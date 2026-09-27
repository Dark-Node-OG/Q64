"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Chess, type Square } from "chess.js";
import Board from "@/components/chess/Board";
import { statusOf } from "@/lib/chess/engine";
import { decideMove, answerQuestion, type LupusDecision } from "@/lib/lupus/agent";
import { WolfIcon, BackIcon, FlagIcon, SettingsIcon, ChevronRight, SendIcon } from "@/components/ui/icons";
import ResultOverlay from "@/components/match/ResultOverlay";
import Q64Word from "@/components/ui/Q64Word";
import { useSettings, recordGame, DIFFICULTY_RATING, type Color } from "@/lib/store";
import { markBeaten, legendPhoto } from "@/lib/legends";
import { advanceCup } from "@/lib/tournaments";
import { THEME_KEYS, BOARD_THEMES } from "@/lib/boardThemes";
import type { MatchConfig } from "@/components/play/ModePicker";

type Player = { name: string; rating: number; avatar?: string | null };
type ChatMsg = { id: number; who: "you" | "lupus"; text: string; time: string };
type Tab = "chat" | "analysis" | "moves";

const START_MS = 10 * 60 * 1000;
const DIFF_LABEL: Record<string, string> = {
  casual: "Casual", balanced: "Balanced", challenging: "Challenging", analysis: "Analysis",
};

function clockText(ms: number) {
  const s = Math.max(0, Math.ceil(ms / 1000));
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}
function now() {
  return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}
function other(c: Color): Color {
  return c === "w" ? "b" : "w";
}

export default function MatchScreen({
  player, config, onExit,
}: {
  player: Player;
  config: MatchConfig;
  onExit: () => void;
}) {
  const { mode, difficulty, playerColor, opponent } = config;
  const isLocal = mode === "local";
  const hasEngine = mode === "computer" || mode === "lupus";
  const engineColor: Color | null = hasEngine ? other(playerColor) : null;
  const opponentName = opponent ? opponent.name : mode === "lupus" ? "LUPUS" : mode === "computer" ? "Computer" : "Black";
  // Opponent identity for the bar: a career legend shows title+rating, LUPUS shows his face.
  const opponentSub = opponent
    ? `${opponent.title} · ${opponent.rating}`
    : hasEngine ? `${DIFF_LABEL[difficulty]} · ${DIFFICULTY_RATING[difficulty]}` : "Player · Black";
  const opponentAvatar = opponent ? legendPhoto(opponent) : mode === "lupus" ? "/lupus.jpg" : mode === "computer" ? "/avatars/computer.svg" : undefined;

  const [settings, setSettings] = useSettings();

  const gameRef = useRef(new Chess());
  const [fen, setFen] = useState(gameRef.current.fen());
  const [selected, setSelected] = useState<Square | null>(null);
  const [lastMove, setLastMove] = useState<{ from: Square; to: Square } | null>(null);
  const [thinking, setThinking] = useState(false);
  const [tab, setTab] = useState<Tab>(mode === "lupus" ? "chat" : mode === "computer" ? "analysis" : "moves");
  const [messages, setMessages] = useState<ChatMsg[]>(
    mode === "lupus"
      ? [{ id: 1, who: "lupus", text: "Good luck. I'm here if you want to talk through the position — ask me anything during the game.", time: now() }]
      : []
  );
  const [analysis, setAnalysis] = useState<LupusDecision | null>(null);
  const [input, setInput] = useState("");
  const [whiteMs, setWhiteMs] = useState(START_MS);
  const [blackMs, setBlackMs] = useState(START_MS);
  const [ended, setEnded] = useState<null | "resign" | "timeout">(null);
  const [reviewPly, setReviewPly] = useState<number | null>(null); // null = live
  const [showSettings, setShowSettings] = useState(false);
  const msgId = useRef(2);
  const recorded = useRef(false);

  const game = gameRef.current;
  const status = useMemo(() => statusOf(game), [fen]); // eslint-disable-line react-hooks/exhaustive-deps
  const over = status.over || ended !== null;

  const movesSan = useMemo(() => game.history(), [fen]); // eslint-disable-line react-hooks/exhaustive-deps

  // whose move can a human make right now
  const humanCanMove = !over && reviewPly === null && (isLocal || game.turn() === playerColor);

  // board orientation
  const orientation: Color = isLocal
    ? (settings.autoRotateLocal ? (game.turn() as Color) : "w")
    : playerColor;

  // what to display (live position or a reviewed past position)
  const display = useMemo(() => {
    if (reviewPly === null) {
      return { game, lastMove, interactive: humanCanMove };
    }
    const g = new Chess();
    for (const san of movesSan.slice(0, reviewPly)) g.move(san);
    const hist = g.history({ verbose: true });
    const last = hist.length ? { from: hist[hist.length - 1].from, to: hist[hist.length - 1].to } : null;
    return { game: g, lastMove: last, interactive: false };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reviewPly, fen, lastMove, humanCanMove]);

  const pushMsg = useCallback((who: ChatMsg["who"], text: string) => {
    setMessages((m) => [...m, { id: msgId.current++, who, text, time: now() }]);
  }, []);

  function playSound(kind: "move" | "capture") {
    if (!settings.sound || typeof window === "undefined") return;
    try {
      const Ctx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new Ctx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.value = kind === "capture" ? 180 : 360;
      gain.gain.setValueAtTime(0.06, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.12);
      osc.connect(gain).connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.13);
      osc.onended = () => ctx.close();
    } catch { /* ignore */ }
  }

  // clock ticks for the side to move
  useEffect(() => {
    if (over) return;
    const id = setInterval(() => {
      if (game.turn() === "w") setWhiteMs((ms) => (ms <= 250 ? (setEnded("timeout"), 0) : ms - 250));
      else setBlackMs((ms) => (ms <= 250 ? (setEnded("timeout"), 0) : ms - 250));
    }, 250);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fen, over]);

  // engine plays its turn (computer / lupus). It never posts to chat.
  useEffect(() => {
    if (over || !engineColor) return;
    if (game.turn() !== engineColor) return;
    setThinking(true);
    const delay = difficulty === "casual" ? 350 : difficulty === "balanced" ? 600 : 950;
    const t = setTimeout(() => {
      const decision = decideMove(game.fen(), difficulty);
      const mv = game.move(decision.san);
      playSound(mv?.captured ? "capture" : "move");
      setLastMove({ from: decision.move.from, to: decision.move.to });
      setFen(game.fen());
      setAnalysis(decision);
      setThinking(false);
    }, delay);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fen, over]);

  // record the finished game once
  useEffect(() => {
    if (!over || recorded.current) return;
    recorded.current = true;
    const r = outcome();
    let result: "win" | "loss" | "draw";
    if (!r.winnerColor) result = "draw";
    else if (isLocal) result = "win"; // local is unrated; store from White's view
    else result = r.winnerColor === playerColor ? "win" : "loss";
    recordGame({
      mode,
      difficulty: hasEngine ? difficulty : undefined,
      result,
      reason: r.reason,
      playerColor: isLocal ? "w" : playerColor,
      opponent: opponentName,
      moves: Math.ceil(game.history().length / 2),
      pgn: game.pgn(),
    });
    // Career: beating a legend unlocks the next challenger on the ladder.
    if (opponent && result === "win") markBeaten(opponent.id);
    // Cup: winning a round advances the tournament (and wins the cup on the final round).
    if (config.tournament && result === "win") advanceCup(config.tournament.cupId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [over]);

  const onSquare = useCallback(
    (sq: Square) => {
      if (!humanCanMove) return;
      const piece = game.get(sq);
      const myColor = isLocal ? (game.turn() as Color) : playerColor;
      if (selected === null) {
        if (piece && piece.color === myColor) setSelected(sq);
        return;
      }
      if (sq === selected) { setSelected(null); return; }
      if (piece && piece.color === myColor) { setSelected(sq); return; }
      try {
        const mv = game.move({ from: selected, to: sq, promotion: "q" });
        if (mv) {
          playSound(mv.captured ? "capture" : "move");
          setLastMove({ from: mv.from, to: mv.to });
          setSelected(null);
          setFen(game.fen());
        }
      } catch {
        setSelected(null);
      }
    },
    [game, humanCanMove, selected, playerColor, isLocal] // eslint-disable-line react-hooks/exhaustive-deps
  );

  function send() {
    const q = input.trim();
    if (!q) return;
    pushMsg("you", q);
    setInput("");
    setTab("chat");
    const last = analysis?.san;
    const fenNow = game.fen();
    const hist = game.history();
    const evalText = analysis
      ? `${analysis.evalCp > 40 ? "White" : analysis.evalCp < -40 ? "Black" : "roughly level"}${
          Math.abs(analysis.evalCp) > 40 ? ` (${(Math.abs(analysis.evalCp) / 100).toFixed(1)})` : ""
        }`
      : undefined;
    // Ask LUPUS's real brain; fall back to the offline answer so chat never breaks.
    (async () => {
      try {
        const res = await fetch("/api/lupus", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fen: fenNow, question: q, history: hist, lastLupusSan: last, playerName: player.name, evalText }),
        });
        const data = await res.json();
        pushMsg("lupus", data?.ok && data.text ? data.text : answerQuestion(fenNow, q, last));
      } catch {
        pushMsg("lupus", answerQuestion(fenNow, q, last));
      }
    })();
  }

  const totalPly = movesSan.length;
  const atPly = reviewPly ?? totalPly;
  const stepBack = () => setReviewPly(Math.max(0, atPly - 1));
  const stepFwd = () => {
    const next = atPly + 1;
    setReviewPly(next >= totalPly ? null : next);
  };

  // outcome from the current game state
  function outcome() {
    if (status.over) {
      if (status.reason === "checkmate") return { title: "Checkmate", winnerColor: status.winner as Color, reason: "checkmate" };
      const t = status.reason === "stalemate" ? "Stalemate" : status.reason === "repetition" ? "Draw by repetition" : status.reason === "insufficient" ? "Insufficient material" : "Draw";
      return { title: t, winnerColor: null as Color | null, reason: status.reason };
    }
    if (ended === "timeout") {
      const winnerColor: Color = whiteMs <= 0 ? "b" : "w";
      return { title: "Time out", winnerColor, reason: "timeout" };
    }
    // resignation: the side to move resigns
    const winnerColor: Color = other(game.turn() as Color);
    return { title: "Resigned", winnerColor, reason: "resignation" };
  }

  const result = useMemo(() => {
    if (!over) return null;
    const r = outcome();
    const winnerName = r.winnerColor === null
      ? null
      : isLocal
        ? (r.winnerColor === "w" ? "White" : "Black")
        : r.winnerColor === playerColor ? player.name : opponentName;
    const score = r.winnerColor === null ? "½ — ½" : r.winnerColor === "w" ? "1 — 0" : "0 — 1";
    const playerResult: "win" | "loss" | "draw" =
      r.winnerColor === null ? "draw" : isLocal ? "win" : r.winnerColor === playerColor ? "win" : "loss";
    return { title: r.title, winner: winnerName, score, playerResult };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [over, whiteMs, blackMs]);

  // right-panel tabs by mode
  const tabs: Tab[] = mode === "lupus" ? ["chat", "analysis", "moves"] : mode === "computer" ? ["analysis", "moves"] : ["moves"];
  // On mobile the panel is a slide-up drawer you pull open / withdraw (desktop keeps a side panel).
  const [drawerOpen, setDrawerOpen] = useState(false);

  const topActive = game.turn() === (isLocal ? "b" : engineColor) && !over;
  const bottomActive = humanCanMove || (game.turn() === (isLocal ? "w" : playerColor) && !over);

  return (
    <div className="relative min-h-[100dvh] bg-night-900">
      <div className="absolute inset-0 opacity-20 bg-[url('/bg/home.jpg')] bg-cover bg-center" />
      <div className="absolute inset-0 bg-gradient-to-b from-night-900/90 to-night-900" />

      <div className="relative lg:flex lg:gap-4 lg:px-4 lg:pt-3 max-w-[1100px] mx-auto">
        {/* LEFT: board column */}
        <div className="lg:flex-1 lg:max-w-[560px] px-3 pt-3 pb-16 lg:pb-3">
          <header className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <button onClick={onExit} className="text-slate-300 hover:text-white"><BackIcon /></button>
              <Q64Word size="sm" />
              <span className="text-[11px] text-slate-400 ml-1">
                {mode === "lupus" ? "vs LUPUS" : mode === "computer" ? "vs Computer" : "Local Match"}
              </span>
            </div>
            <button onClick={() => setShowSettings(true)} className="text-slate-300 hover:text-white"><SettingsIcon className="w-5 h-5" /></button>
          </header>

          {/* opponent bar */}
          <PlayerBar
            name={opponentName}
            sub={opponentSub}
            side={opponent ? opponent.country : "Black"}
            clock={clockText(blackMs)}
            active={topActive}
            isLupus={mode === "lupus"}
            thinking={thinking && engineColor === "b"}
            avatarUrl={opponentAvatar}
          />

          {/* legend quote card — flavor while you play a career opponent */}
          {opponent && (
            <div className="mt-2 rounded-xl glass border border-electric-500/30 px-3 py-2">
              <div className="text-[11px] text-slate-400">{opponent.style}</div>
              <div className="text-[12px] italic text-slate-200">&ldquo;{opponent.quote}&rdquo;</div>
            </div>
          )}

          <div className="my-3">
            <Board
              game={display.game}
              selected={selected}
              lastMove={display.lastMove}
              interactive={display.interactive}
              orientation={orientation}
              theme={settings.boardTheme}
              showCoordinates={settings.showCoordinates}
              onSquare={onSquare}
            />
          </div>

          {/* player bar */}
          <PlayerBar
            name={isLocal ? "White" : player.name}
            sub={isLocal ? "Player · White" : `Player · ${player.rating}`}
            side="White"
            clock={clockText(whiteMs)}
            active={bottomActive}
            thinking={thinking && engineColor === "w"}
            avatarUrl={isLocal ? null : player.avatar}
          />

          {/* controls */}
          <div className="mt-3 grid grid-cols-4 gap-2 pb-4">
            <ControlBtn label="Resign" onClick={() => setEnded("resign")} disabled={over}><FlagIcon className="w-5 h-5" /></ControlBtn>
            <ControlBtn label="Back" onClick={stepBack} disabled={atPly <= 0}><span className="text-lg">‹</span></ControlBtn>
            <ControlBtn label="Fwd" onClick={stepFwd} disabled={reviewPly === null}><span className="text-lg">›</span></ControlBtn>
            <ControlBtn label="Settings" onClick={() => setShowSettings(true)}><SettingsIcon className="w-5 h-5" /></ControlBtn>
          </div>

          {reviewPly !== null && (
            <button onClick={() => setReviewPly(null)} className="mb-4 w-full text-xs text-electric-300 border border-electric-500/30 rounded-lg py-2 hover:bg-electric-500/10">
              Reviewing move {reviewPly} of {totalPly} — tap to return to live
            </button>
          )}
        </div>

        {/* RIGHT: desktop side panel / mobile slide-up drawer */}
        <div
          className={`px-3 pb-6 lg:static lg:z-auto lg:flex-1 lg:max-w-[520px] lg:translate-y-0
            fixed left-1/2 bottom-0 z-30 w-full max-w-[480px] -translate-x-1/2
            transition-transform duration-300 ease-out lg:transition-none
            ${drawerOpen ? "translate-y-0" : "translate-y-[calc(100%-3.25rem)] lg:translate-y-0"}`}
        >
          {/* mobile handle — tap to pull the panel up or withdraw it */}
          <button
            onClick={() => setDrawerOpen((v) => !v)}
            className="lg:hidden flex w-full flex-col items-center pt-1.5 pb-2"
            aria-label={drawerOpen ? "Withdraw panel" : "Open panel"}
          >
            <span className="h-1.5 w-12 rounded-full bg-slate-400/80" />
            <span className="mt-1 text-[11px] text-slate-300">
              {drawerOpen ? "Tap to withdraw" : `Open ${tab === "chat" ? "Chat" : tab === "analysis" ? "Analysis" : "Moves"}`}
            </span>
          </button>

          <div className="glass-strong rounded-2xl border border-electric-500/20 overflow-hidden flex flex-col h-[70dvh] lg:h-[calc(100dvh-1.5rem)]">
            <div className="flex border-b border-electric-500/15">
              {tabs.map((tk) => (
                <TabBtn key={tk} active={tab === tk} onClick={() => { setTab(tk); setDrawerOpen(true); }}>
                  {tk === "chat" ? "Chat" : tk === "analysis" ? "Analysis" : "Moves"}
                </TabBtn>
              ))}
            </div>

            {tab === "chat" && (
              <ChatPanel messages={messages} input={input} setInput={setInput} onSend={send} playerName={player.name} />
            )}
            {tab === "analysis" && <AnalysisPanel decision={analysis} />}
            {tab === "moves" && <MovesPanel moves={movesSan} atPly={atPly} onGoto={(p) => setReviewPly(p >= totalPly ? null : p)} />}
          </div>
        </div>
      </div>

      {showSettings && (
        <MatchSettings settings={settings} onChange={setSettings} onClose={() => setShowSettings(false)} />
      )}

      {result && (
        <ResultOverlay
          title={result.title}
          player={isLocal ? "White" : player.name}
          winner={result.winner}
          score={result.score}
          opponent={opponentName}
          isLupus={mode === "lupus"}
          opponentAvatar={opponentAvatar ?? null}
          playerAvatar={isLocal ? null : player.avatar}
          moves={Math.ceil(game.history().length / 2)}
          pgn={game.pgn()}
          result={result.playerResult}
          onRematch={() => window.location.reload()}
          onHome={onExit}
        />
      )}
    </div>
  );
}

/* ---- sub components ---- */

function PlayerBar({
  name, sub, side, clock, active, isLupus, thinking, avatarUrl,
}: {
  name: string; sub: string; side: string; clock: string; active: boolean; isLupus?: boolean; thinking?: boolean; avatarUrl?: string | null;
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className={`h-11 w-11 rounded-xl overflow-hidden flex items-center justify-center ${isLupus ? "bg-night-600 text-cyan-q shadow-glow" : "bg-gradient-to-br from-electric-500 to-violet-q text-white"}`}>
          {avatarUrl ? <img src={avatarUrl} alt="" className="h-full w-full object-cover" /> : isLupus ? <WolfIcon className="w-6 h-6" /> : <span className="font-bold">{name.slice(0, 1)}</span>}
        </div>
        <div>
          <div className="font-semibold text-white leading-tight flex items-center gap-1.5">
            {name}
            {isLupus && <span className="text-cyan-q text-xs">✔</span>}
          </div>
          <div className="text-[11px] text-slate-400">{thinking ? "Thinking…" : sub}</div>
        </div>
      </div>
      <div className={`rounded-lg px-3 py-1.5 border text-right ${active ? "border-electric-500/60 bg-electric-500/10 shadow-glow-soft" : "border-slate-600/40 bg-night-700/60"}`}>
        <div className="text-lg font-semibold tracking-wide text-white tabular-nums">{clock}</div>
        <div className="text-[10px] text-slate-400">{side}</div>
      </div>
    </div>
  );
}

function ControlBtn({ children, label, onClick, disabled }: { children: React.ReactNode; label: string; onClick?: () => void; disabled?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`glass rounded-xl py-2.5 flex flex-col items-center gap-1 text-slate-200 ${disabled ? "opacity-40" : "hover:border-electric-500/50"}`}
    >
      {children}
      {label && <span className="text-[10px]">{label}</span>}
    </button>
  );
}

function TabBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 py-3 text-sm font-medium transition ${active ? "text-electric-400 border-b-2 border-electric-500" : "text-slate-400"}`}
    >
      {children}
    </button>
  );
}

function ChatPanel({
  messages, input, setInput, onSend, playerName,
}: {
  messages: ChatMsg[]; input: string; setInput: (s: string) => void; onSend: () => void; playerName: string;
}) {
  const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);
  const suggestions = ["Why did you play that?", "What are my options?", "Can you analyze this position?"];

  return (
    <>
      <div className="flex-1 overflow-y-auto no-scrollbar p-3 space-y-3">
        {messages.map((m) => {
          const you = m.who === "you";
          return (
            <div key={m.id} className={`flex gap-2 ${you ? "flex-row-reverse" : ""}`}>
              <div className={`h-7 w-7 shrink-0 rounded-full flex items-center justify-center text-xs ${you ? "bg-gradient-to-br from-electric-500 to-violet-q text-white" : "bg-night-600 text-cyan-q"}`}>
                {you ? playerName.slice(0, 1) : <WolfIcon className="w-4 h-4" />}
              </div>
              <div className={`max-w-[78%] rounded-2xl px-3 py-2 ${you ? "bg-electric-600/25 border border-electric-500/30" : "bg-night-600/70 border border-white/5"}`}>
                <div className="text-[11px] text-slate-400 mb-0.5">{you ? "You" : "LUPUS"}</div>
                <div className="text-sm text-slate-100 whitespace-pre-wrap">{m.text}</div>
                <div className="text-[10px] text-slate-500 mt-1 text-right">{m.time}</div>
              </div>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>

      <div className="p-3 border-t border-electric-500/15">
        <div className="flex flex-wrap gap-2 mb-2">
          {suggestions.map((s) => (
            <button key={s} onClick={() => setInput(s)} className="text-[11px] px-2.5 py-1 rounded-full bg-night-600/70 border border-electric-500/20 text-slate-300 hover:border-electric-500/50">
              {s}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 glass rounded-xl px-3 py-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && onSend()}
            placeholder="Ask LUPUS anything..."
            className="flex-1 bg-transparent outline-none text-sm text-slate-100 placeholder:text-slate-500"
          />
          <button onClick={onSend} className="text-electric-400 hover:text-cyan-q"><SendIcon className="w-5 h-5" /></button>
        </div>
      </div>
    </>
  );
}

function AnalysisPanel({ decision }: { decision: LupusDecision | null }) {
  const evalCp = decision?.evalCp ?? 0;
  const pct = Math.max(4, Math.min(96, 50 + evalCp / 20));
  const evalText = (Math.abs(evalCp) / 100).toFixed(1);
  const lead = evalCp > 20 ? "White" : evalCp < -20 ? "Black" : "Even";

  return (
    <div className="flex-1 overflow-y-auto no-scrollbar p-3 space-y-3">
      <div className="glass rounded-xl p-3">
        <div className="text-xs text-slate-400 mb-2">Position Evaluation</div>
        <div className="flex items-center gap-3">
          <div className="text-2xl font-bold text-white tabular-nums">{evalCp >= 0 ? "+" : "−"}{evalText}</div>
          <div className="flex-1">
            <div className="flex justify-between text-[10px] text-slate-400 mb-1"><span>White</span><span>Black</span></div>
            <div className="h-2 rounded-full bg-night-500 overflow-hidden flex">
              <div className="h-full bg-white/85" style={{ width: `${pct}%` }} />
              <div className="h-full bg-electric-600" style={{ width: `${100 - pct}%` }} />
            </div>
          </div>
        </div>
        <div className="text-[11px] text-slate-400 mt-2">{lead === "Even" ? "Balanced position" : `Slight advantage: ${lead}`}</div>
      </div>

      {!decision ? (
        <div className="glass rounded-xl p-4 text-sm text-slate-400 text-center">
          Play a move — the engine responds and its analysis appears here.
        </div>
      ) : (
        <>
          <div className="glass rounded-xl p-3 border border-electric-500/25">
            <div className="flex items-center gap-2 text-sm">
              <WolfIcon className="w-5 h-5 text-cyan-q" />
              <span className="text-slate-300">Best Move</span>
              <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-400/30">● {decision.confidence}</span>
            </div>
            <div className="text-2xl font-bold text-white mt-1">{decision.san}</div>
            <div className="text-xs text-slate-400 mt-1">{decision.reason}</div>
          </div>

          <div className="glass rounded-xl p-3">
            <div className="text-xs text-slate-400 mb-2">Considerations</div>
            <div className="flex flex-wrap gap-2">
              {decision.considerations.map((c) => (
                <span key={c} className="text-[11px] px-2.5 py-1 rounded-full bg-night-600/70 border border-electric-500/20 text-slate-200">{c}</span>
              ))}
            </div>
          </div>

          <div className="glass rounded-xl p-3">
            <div className="text-xs text-slate-400 mb-2">Candidate Moves</div>
            <div className="space-y-2">
              {decision.candidates.map((c) => (
                <div key={c.san} className="flex items-center gap-3 text-sm">
                  <span className="font-semibold text-white w-12">{c.san}</span>
                  <span className="text-slate-400 flex-1">{c.label}</span>
                  <span className="text-electric-300 tabular-nums">{c.evalCp >= 0 ? "+" : "−"}{(Math.abs(c.evalCp) / 100).toFixed(1)}</span>
                  <ChevronRight className="w-4 h-4 text-slate-600" />
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function MovesPanel({ moves, atPly, onGoto }: { moves: string[]; atPly: number; onGoto: (ply: number) => void }) {
  const rows = [];
  for (let i = 0; i < moves.length; i += 2) {
    rows.push({ n: i / 2 + 1, white: moves[i], black: moves[i + 1], wPly: i + 1, bPly: i + 2 });
  }
  return (
    <div className="flex-1 overflow-y-auto no-scrollbar p-3">
      {moves.length === 0 ? (
        <div className="text-sm text-slate-400 text-center mt-6">No moves yet. Make the first move to begin.</div>
      ) : (
        <div className="space-y-1">
          {rows.map((r) => (
            <div key={r.n} className="flex items-center text-sm">
              <span className="w-8 text-slate-500">{r.n}.</span>
              <button onClick={() => onGoto(r.wPly)} className={`flex-1 text-left px-2 py-1 rounded ${atPly === r.wPly ? "bg-electric-500/20 text-white" : "text-slate-200 hover:bg-white/5"}`}>{r.white}</button>
              {r.black && (
                <button onClick={() => onGoto(r.bPly)} className={`flex-1 text-left px-2 py-1 rounded ${atPly === r.bPly ? "bg-electric-500/20 text-white" : "text-slate-200 hover:bg-white/5"}`}>{r.black}</button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function MatchSettings({
  settings, onChange, onClose,
}: {
  settings: ReturnType<typeof useSettings>[0];
  onChange: (patch: Partial<ReturnType<typeof useSettings>[0]>) => void;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-night-900/70 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-sm glass-strong edge-glow rounded-t-3xl sm:rounded-3xl p-5 animate-fade-up" onClick={(e) => e.stopPropagation()}>
        <div className="text-lg font-bold text-white mb-4">Match Settings</div>
        <Toggle label="Sound effects" value={settings.sound} onChange={(v) => onChange({ sound: v })} />
        <Toggle label="Show coordinates" value={settings.showCoordinates} onChange={(v) => onChange({ showCoordinates: v })} />
        <Toggle label="Auto-rotate (local)" value={settings.autoRotateLocal} onChange={(v) => onChange({ autoRotateLocal: v })} />
        <div className="mt-4">
          <div className="text-xs text-slate-400 mb-2">Board theme · {BOARD_THEMES[settings.boardTheme].name}</div>
          <div className="grid grid-cols-4 gap-2">
            {THEME_KEYS.map((th) => {
              const def = BOARD_THEMES[th];
              const active = settings.boardTheme === th;
              return (
                <button
                  key={th}
                  onClick={() => onChange({ boardTheme: th })}
                  className={`rounded-lg p-1 transition ${active ? "ring-2 ring-electric-500" : "opacity-80 hover:opacity-100"}`}
                  title={def.name}
                >
                  <div className="rounded overflow-hidden grid grid-cols-2 h-7 w-full" style={{ background: def.frame }}>
                    <span style={{ background: def.light }} />
                    <span style={{ background: def.dark }} />
                    <span style={{ background: def.dark }} />
                    <span style={{ background: def.light }} />
                  </div>
                </button>
              );
            })}
          </div>
        </div>
        <button onClick={onClose} className="mt-5 w-full rounded-xl py-3 font-semibold text-white bg-gradient-to-r from-electric-600 to-electric-500">Done</button>
      </div>
    </div>
  );
}

function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button onClick={() => onChange(!value)} className="w-full flex items-center justify-between py-2.5">
      <span className="text-sm text-slate-200">{label}</span>
      <span className={`h-6 w-11 rounded-full p-0.5 transition ${value ? "bg-electric-500" : "bg-night-500"}`}>
        <span className={`block h-5 w-5 rounded-full bg-white transition ${value ? "translate-x-5" : ""}`} />
      </span>
    </button>
  );
}

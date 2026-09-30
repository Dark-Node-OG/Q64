"use client";

// A live online chess game between two real people, synced through Supabase realtime.
// Built to feel like the offline board: two player bars with photo, name and quote,
// running clocks, a slide-up chat drawer to talk to your opponent, and a small refresh
// button for when the network hiccups. Refreshing the page resumes this same game.

import { useCallback, useEffect, useRef, useState } from "react";
import { Chess, type Square } from "chess.js";
import Board from "@/components/chess/Board";
import { BackIcon, SendIcon } from "@/components/ui/icons";
import Q64Word from "@/components/ui/Q64Word";
import { supabase } from "@/lib/supabaseClient";
import {
  getGame, pushMove, applyOnlineResult, getRating, getFullProfile,
  sendGameChat, getGameChat, type Game, type GameChatMsg, type OnlineUser,
} from "@/lib/online";
import { useSettings, chessTitle } from "@/lib/store";

function clockText(ms: number) {
  const s = Math.max(0, Math.ceil(ms / 1000));
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

export default function OnlineMatch({ gameId, me, onExit }: { gameId: string; me: OnlineUser; onExit: () => void }) {
  const [settings] = useSettings();
  const [row, setRow] = useState<Game | null>(null);
  const gameRef = useRef(new Chess());
  const [, force] = useState(0);
  const [selected, setSelected] = useState<Square | null>(null);
  const [lastMove, setLastMove] = useState<{ from: Square; to: Square } | null>(null);

  const [hostProfile, setHostProfile] = useState<OnlineUser | null>(null);
  const [guestProfile, setGuestProfile] = useState<OnlineUser | null>(null);

  // live clock display, recomputed every 250ms from the row + updated_at
  const [nowTick, setNowTick] = useState(Date.now());

  // chat
  const [chat, setChat] = useState<GameChatMsg[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [unread, setUnread] = useState(0);

  const myColor: "w" | "b" = row ? (row.host_id === me.id ? row.host_color : row.host_color === "w" ? "b" : "w") : "w";

  const applyRow = useCallback((g: Game) => {
    setRow(g);
    const chess = new Chess();
    try { chess.load(g.fen); } catch { /* keep */ }
    gameRef.current = chess;
    const hist = chess.history({ verbose: true });
    const last = hist[hist.length - 1];
    setLastMove(last ? { from: last.from as Square, to: last.to as Square } : null);
    force((n) => n + 1);
  }, []);

  // initial load + realtime subscription to this game row
  const loadGame = useCallback(() => { getGame(gameId).then((g) => { if (g) applyRow(g); }); }, [gameId, applyRow]);
  useEffect(() => {
    let active = true;
    getGame(gameId).then((g) => { if (active && g) applyRow(g); });
    const sb = supabase;
    if (!sb) return;
    const ch = sb.channel(`game:${gameId}`)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "games", filter: `id=eq.${gameId}` }, (p) => applyRow(p.new as Game))
      .subscribe();
    return () => { active = false; sb.removeChannel(ch); };
  }, [gameId, applyRow]);

  // fetch both players' real profiles (photo + quote), refresh when guest joins
  useEffect(() => {
    if (!row) return;
    getFullProfile(row.host_id).then(setHostProfile);
    if (row.guest_id) getFullProfile(row.guest_id).then(setGuestProfile);
  }, [row?.host_id, row?.guest_id]); // eslint-disable-line react-hooks/exhaustive-deps

  // chat: load + realtime
  const loadChat = useCallback(() => { getGameChat(gameId).then(setChat); }, [gameId]);
  useEffect(() => {
    loadChat();
    const sb = supabase;
    if (!sb) return;
    const ch = sb.channel(`gamechat:${gameId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "game_chat", filter: `game_id=eq.${gameId}` }, (p) => {
        const m = p.new as GameChatMsg;
        setChat((c) => (c.some((x) => x.id === m.id) ? c : [...c, m]));
        if (m.from_id !== me.id) setUnread((u) => (drawerOpen ? 0 : u + 1));
      })
      .subscribe();
    return () => { sb.removeChannel(ch); };
  }, [gameId, loadChat, me.id, drawerOpen]);

  // clock ticker
  useEffect(() => {
    const t = setInterval(() => setNowTick(Date.now()), 250);
    return () => clearInterval(t);
  }, []);

  const over = !!row && (row.status === "finished" || row.status === "abandoned");
  const bothHere = !!row?.guest_id;
  const myTurn = !!row && bothHere && !over && gameRef.current.turn() === myColor;

  // ---- clocks: the side to move counts down from its stored ms since the last update ----
  const updatedAtMs = row?.updated_at ? new Date(row.updated_at).getTime() : nowTick;
  const elapsed = bothHere && !over ? Math.max(0, nowTick - updatedAtMs) : 0;
  const turn = gameRef.current.turn();
  const whiteMs = Math.max(0, (row?.white_ms ?? 600000) - (turn === "w" ? elapsed : 0));
  const blackMs = Math.max(0, (row?.black_ms ?? 600000) - (turn === "b" ? elapsed : 0));

  // flag my own flag-fall (only the player whose clock runs reports it, to avoid double writes)
  const flagged = useRef(false);
  useEffect(() => {
    if (!row || over || !bothHere || flagged.current) return;
    const myMs = myColor === "w" ? whiteMs : blackMs;
    if (myTurn && myMs <= 0) {
      flagged.current = true;
      const oppId = row.host_id === me.id ? row.guest_id : row.host_id;
      void pushMove(gameId, gameRef.current.fen(), row.moves || [], turn, "finished", oppId, whiteMs, blackMs);
    }
  }, [whiteMs, blackMs, myTurn, over, bothHere, row, myColor, gameId, me.id, turn]);

  // when the game ends, update MY online rating (each player updates their own)
  const ratingApplied = useRef(false);
  useEffect(() => {
    if (!row || row.status !== "finished" || ratingApplied.current) return;
    ratingApplied.current = true;
    const oppId = row.host_id === me.id ? row.guest_id : row.host_id;
    const score = row.winner === me.id ? 1 : !row.winner || row.winner === "draw" ? 0.5 : 0;
    (async () => {
      const oppRating = oppId ? await getRating(oppId) : 1200;
      await applyOnlineResult(me.rating, oppRating, score);
    })();
  }, [row, me]);

  const onSquare = useCallback((sq: Square) => {
    if (!myTurn || !row) return;
    const g = gameRef.current;
    const piece = g.get(sq);
    if (selected) {
      if (sq === selected) { setSelected(null); return; }
      try {
        const mv = g.move({ from: selected, to: sq, promotion: "q" });
        if (mv) {
          const isOver = g.isGameOver();
          const winner: string | null = g.isCheckmate() ? me.id : isOver ? "draw" : null;
          const status: Game["status"] = isOver ? "finished" : "active";
          const moves = [...(row.moves || []), mv.san];
          // I just consumed time from my own clock
          const myNew = myColor === "w" ? whiteMs : blackMs;
          const newWhite = myColor === "w" ? myNew : (row.white_ms ?? whiteMs);
          const newBlack = myColor === "b" ? myNew : (row.black_ms ?? blackMs);
          setLastMove({ from: mv.from as Square, to: mv.to as Square });
          setSelected(null);
          force((n) => n + 1);
          void pushMove(gameId, g.fen(), moves, g.turn() as "w" | "b", status, winner, newWhite, newBlack);
          return;
        }
      } catch { /* illegal — reselect */ }
      if (piece && piece.color === myColor) setSelected(sq); else setSelected(null);
    } else if (piece && piece.color === myColor) {
      setSelected(sq);
    }
  }, [myTurn, selected, row, myColor, gameId, me.id, whiteMs, blackMs]);

  const resign = () => {
    if (!row || over) return;
    const oppId = row.host_id === me.id ? row.guest_id : row.host_id;
    void pushMove(gameId, gameRef.current.fen(), row.moves || [], turn, "finished", oppId, row.white_ms ?? whiteMs, row.black_ms ?? blackMs);
  };

  const refresh = () => { loadGame(); loadChat(); };

  const sendChat = () => {
    const b = chatInput.trim();
    if (!b) return;
    setChatInput("");
    void sendGameChat(gameId, b, me.username);
  };

  // identities for the two bars
  const iAmHost = row?.host_id === me.id;
  const meProfile = iAmHost ? hostProfile : guestProfile;
  const oppProfileRaw = iAmHost ? guestProfile : hostProfile;
  const oppName = row ? (iAmHost ? row.guest_name || "Waiting…" : row.host_name || "Host") : "Opponent";
  const oppColor: "w" | "b" = myColor === "w" ? "b" : "w";

  const statusText = !row
    ? "Loading…"
    : !bothHere
    ? `Waiting for an opponent — share room code ${row.code}`
    : over
    ? (!row.winner || row.winner === "draw") ? "Draw" : row.winner === me.id ? "You win! 🏆" : `${oppName} wins`
    : myTurn ? "Your move" : "Opponent's move…";

  const topClock = oppColor === "w" ? whiteMs : blackMs;
  const bottomClock = myColor === "w" ? whiteMs : blackMs;

  return (
    <div className="relative min-h-[100dvh] bg-night-900">
      <div className="absolute inset-0 opacity-20 bg-[url('/bg/home.jpg')] bg-cover bg-center" />
      <div className="absolute inset-0 bg-gradient-to-b from-night-900/90 to-night-900" />
      <div className="relative px-3 pt-3 pb-16 max-w-[480px] mx-auto">
        <header className="flex items-center justify-between mb-3">
          <button onClick={onExit} className="text-slate-300 hover:text-white"><BackIcon /></button>
          <Q64Word size="sm" />
          <div className="flex items-center gap-3">
            <button onClick={refresh} title="Refresh" className="text-slate-300 hover:text-white" aria-label="Refresh game">
              <RefreshIcon className="w-5 h-5" />
            </button>
            <span className="text-slate-400 text-sm">Online</span>
          </div>
        </header>

        <div className="glass rounded-xl px-3 py-2 mb-2 flex items-center justify-between">
          <span className="text-xs text-slate-400">Room</span>
          <span className="text-xs tracking-widest text-cyan-q font-semibold">{row?.code}</span>
        </div>

        {/* opponent bar */}
        <PlayerBar name={oppName} profile={oppProfileRaw} clock={clockText(topClock)} active={!over && bothHere && turn === oppColor} />
        {oppProfileRaw?.quote && (
          <div className="mt-2 rounded-xl glass border border-electric-500/25 px-3 py-2">
            <div className="text-[12px] italic text-slate-200">&ldquo;{oppProfileRaw.quote}&rdquo;</div>
          </div>
        )}

        <div className={`text-center text-sm my-2 ${myTurn ? "text-electric-300" : "text-slate-400"}`}>{statusText}</div>

        <Board
          game={gameRef.current}
          selected={selected}
          lastMove={lastMove}
          interactive={myTurn}
          orientation={myColor}
          theme={settings.boardTheme}
          showCoordinates={settings.showCoordinates}
          onSquare={onSquare}
        />

        {/* my bar */}
        <div className="mt-2">
          <PlayerBar name={me.username} profile={meProfile ?? me} clock={clockText(bottomClock)} active={myTurn} />
        </div>
        {(meProfile?.quote || me.quote) && (
          <div className="mt-2 rounded-xl glass border border-violet-q/30 px-3 py-2">
            <div className="text-[12px] italic text-slate-200">&ldquo;{meProfile?.quote || me.quote}&rdquo;</div>
          </div>
        )}

        {/* controls */}
        <div className="mt-3 grid grid-cols-2 gap-2">
          <button onClick={resign} disabled={over || !bothHere} className="glass rounded-xl py-2.5 text-sm text-slate-200 disabled:opacity-40 hover:border-electric-500/50">Resign</button>
          <button onClick={() => { setDrawerOpen(true); setUnread(0); }} className="glass rounded-xl py-2.5 text-sm text-slate-200 hover:border-electric-500/50 relative">
            Chat {unread > 0 && <span className="absolute top-1.5 right-3 h-2 w-2 rounded-full bg-cyan-q" />}
          </button>
        </div>

        <div className="mt-3 text-center text-[11px] text-slate-500">
          You are {myColor === "w" ? "White" : "Black"} · moves sync live over the internet
        </div>
      </div>

      {/* chat drawer */}
      <div className={`fixed inset-x-0 bottom-0 z-40 transition-transform duration-300 ${drawerOpen ? "translate-y-0" : "translate-y-full"}`}>
        <div className="max-w-[480px] mx-auto glass-strong rounded-t-2xl border border-electric-500/25 flex flex-col h-[62dvh]">
          <div className="flex items-center justify-between px-4 py-3 border-b border-electric-500/15">
            <span className="text-white font-semibold text-sm">Chat with {oppName}</span>
            <button onClick={() => setDrawerOpen(false)} className="text-slate-400 hover:text-white text-sm">Close</button>
          </div>
          <ChatList chat={chat} meId={me.id} />
          <div className="p-3 border-t border-electric-500/15 flex items-center gap-2">
            <input
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendChat()}
              placeholder="Message your opponent…"
              className="flex-1 bg-night-600 rounded-xl px-3 py-2.5 text-sm text-white outline-none border border-electric-500/20 focus:border-electric-500"
            />
            <button onClick={sendChat} className="text-electric-400 hover:text-cyan-q"><SendIcon className="w-5 h-5" /></button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ChatList({ chat, meId }: { chat: GameChatMsg[]; meId: string }) {
  const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [chat]);
  return (
    <div className="flex-1 overflow-y-auto no-scrollbar p-3 space-y-2">
      {chat.length === 0 ? (
        <div className="text-center text-sm text-slate-500 mt-6">Say hello to your opponent.</div>
      ) : chat.map((m) => {
        const mine = m.from_id === meId;
        return (
          <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[78%] rounded-2xl px-3 py-2 ${mine ? "bg-electric-600/25 border border-electric-500/30" : "bg-night-600/70 border border-white/5"}`}>
              {!mine && <div className="text-[11px] text-slate-400 mb-0.5">{m.from_name || "Opponent"}</div>}
              <div className="text-sm text-slate-100 whitespace-pre-wrap break-words">{m.body}</div>
            </div>
          </div>
        );
      })}
      <div ref={endRef} />
    </div>
  );
}

function PlayerBar({ name, profile, clock, active }: { name: string; profile: OnlineUser | null; clock: string; active: boolean }) {
  const title = profile ? chessTitle(profile.rating).short : "";
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="h-11 w-11 rounded-xl overflow-hidden bg-gradient-to-br from-electric-500 to-violet-q flex items-center justify-center text-white">
          {profile?.avatar ? <img src={profile.avatar} alt="" className="h-full w-full object-cover" /> : <span className="font-bold">{name.slice(0, 1).toUpperCase()}</span>}
        </div>
        <div>
          <div className="font-semibold text-white leading-tight">{name}</div>
          <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
            {profile && <span className="text-[10px] px-1.5 rounded bg-electric-600/25 border border-electric-500/40 text-white">{title}</span>}
            {profile ? `Rating ${profile.rating}` : ""}
          </div>
        </div>
      </div>
      <div className={`rounded-lg px-3 py-1.5 border text-right ${active ? "border-electric-500/60 bg-electric-500/10 shadow-glow-soft" : "border-slate-600/40 bg-night-700/60"}`}>
        <div className="text-lg font-semibold tracking-wide text-white tabular-nums">{clock}</div>
      </div>
    </div>
  );
}

function RefreshIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12a9 9 0 1 1-2.64-6.36" />
      <path d="M21 3v6h-6" />
    </svg>
  );
}

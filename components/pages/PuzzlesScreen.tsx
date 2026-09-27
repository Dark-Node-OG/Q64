"use client";

import { useRef, useState, useCallback } from "react";
import { Chess, type Square } from "chess.js";
import Q64Word from "@/components/ui/Q64Word";
import BottomNav, { type Route } from "@/components/ui/BottomNav";
import Board from "@/components/chess/Board";
import { BackIcon } from "@/components/ui/icons";
import { PUZZLES, type Puzzle } from "@/lib/puzzles";
import { useSettings, getPuzzleProgress, markPuzzleSolved } from "@/lib/store";

export default function PuzzlesScreen({ onBack, onNavigate }: { onBack: () => void; onNavigate: (r: Route) => void }) {
  const [active, setActive] = useState<Puzzle | null>(null);
  const progress = getPuzzleProgress();

  if (active) return <PuzzleSolver puzzle={active} onExit={() => setActive(null)} />;

  return (
    <div className="relative min-h-[100dvh] pb-28">
      <div className="absolute inset-0 opacity-30 bg-[url('/bg/home.jpg')] bg-cover bg-center" />
      <div className="absolute inset-0 bg-gradient-to-b from-night-900/90 to-night-900" />

      <div className="relative px-5 pt-6">
        <header className="flex items-center gap-3 mb-6">
          <button onClick={onBack} className="text-slate-300 hover:text-white"><BackIcon /></button>
          <Q64Word size="sm" />
          <span className="text-slate-400 text-sm ml-1">Puzzles</span>
        </header>

        <div className="space-y-3">
          {PUZZLES.map((p) => {
            const solved = progress[p.id]?.solved;
            return (
              <button
                key={p.id}
                onClick={() => setActive(p)}
                className="w-full glass rounded-2xl p-4 flex items-center gap-4 text-left hover:border-electric-500/40 transition"
              >
                <span className={`h-11 w-11 rounded-xl grid place-items-center font-bold ${solved ? "bg-emerald-500/20 text-emerald-300 border border-emerald-400/40" : "bg-night-500/70 text-electric-400"}`}>
                  {solved ? "✓" : "♟"}
                </span>
                <span className="flex-1">
                  <span className="block font-semibold text-white">{p.title}</span>
                  <span className="block text-xs text-slate-400">{p.theme} · {p.sideToMove === "w" ? "White" : "Black"} to move</span>
                </span>
                <span className="text-xs text-slate-400 tabular-nums">{p.rating}</span>
              </button>
            );
          })}
        </div>
      </div>

      <BottomNav active="puzzles" onNavigate={onNavigate} />
    </div>
  );
}

function PuzzleSolver({ puzzle, onExit }: { puzzle: Puzzle; onExit: () => void }) {
  const [settings] = useSettings();
  const gameRef = useRef(new Chess(puzzle.fen));
  const [fen, setFen] = useState(gameRef.current.fen());
  const [selected, setSelected] = useState<Square | null>(null);
  const [lastMove, setLastMove] = useState<{ from: Square; to: Square } | null>(null);
  const [state, setState] = useState<"solving" | "solved" | "wrong">("solving");
  const [showHint, setShowHint] = useState(false);

  const game = gameRef.current;

  const reset = () => {
    gameRef.current = new Chess(puzzle.fen);
    setFen(gameRef.current.fen());
    setSelected(null);
    setLastMove(null);
    setState("solving");
  };

  const onSquare = useCallback((sq: Square) => {
    if (state === "solved") return;
    const piece = game.get(sq);
    if (selected === null) {
      if (piece && piece.color === puzzle.sideToMove) setSelected(sq);
      return;
    }
    if (sq === selected) { setSelected(null); return; }
    if (piece && piece.color === puzzle.sideToMove) { setSelected(sq); return; }
    try {
      const mv = game.move({ from: selected, to: sq, promotion: "q" });
      if (!mv) { setSelected(null); return; }
      setSelected(null);
      setLastMove({ from: mv.from, to: mv.to });
      const correct = puzzle.solution.includes(mv.san);
      if (correct) {
        setFen(game.fen());
        setState("solved");
        markPuzzleSolved(puzzle.id);
      } else {
        // wrong: undo and flag
        game.undo();
        setState("wrong");
        setTimeout(() => setState("solving"), 900);
      }
    } catch {
      setSelected(null);
    }
  }, [game, selected, state, puzzle]);

  return (
    <div className="relative min-h-[100dvh] pb-10 bg-night-900">
      <div className="absolute inset-0 opacity-20 bg-[url('/bg/home.jpg')] bg-cover bg-center" />
      <div className="absolute inset-0 bg-gradient-to-b from-night-900/90 to-night-900" />

      <div className="relative px-4 pt-4 max-w-[560px] mx-auto">
        <header className="flex items-center gap-3 mb-3">
          <button onClick={onExit} className="text-slate-300 hover:text-white"><BackIcon /></button>
          <div>
            <div className="font-semibold text-white">{puzzle.title}</div>
            <div className="text-[11px] text-slate-400">{puzzle.theme} · {puzzle.sideToMove === "w" ? "White" : "Black"} to move · {puzzle.rating}</div>
          </div>
        </header>

        <div className="my-3">
          <Board
            game={game}
            selected={selected}
            lastMove={lastMove}
            interactive={state !== "solved"}
            orientation={puzzle.sideToMove}
            theme={settings.boardTheme}
            showCoordinates={settings.showCoordinates}
            onSquare={onSquare}
          />
        </div>

        {state === "solved" ? (
          <div className="glass-strong edge-glow rounded-2xl p-4 text-center">
            <div className="text-emerald-300 font-bold text-lg">Solved! ✓</div>
            <div className="text-sm text-slate-300 mt-1">Nicely spotted. That was the winning idea.</div>
            <div className="mt-3 flex gap-2 justify-center">
              <button onClick={reset} className="glass rounded-xl px-4 py-2 text-sm text-slate-200">Replay</button>
              <button onClick={onExit} className="rounded-xl px-4 py-2 text-sm text-white bg-gradient-to-r from-electric-600 to-electric-500 font-semibold">More puzzles</button>
            </div>
          </div>
        ) : (
          <div className="glass rounded-2xl p-4">
            <div className={`text-sm font-medium ${state === "wrong" ? "text-red-300" : "text-slate-300"}`}>
              {state === "wrong" ? "Not quite — try another move." : "Find the best move for the side to play."}
            </div>
            {showHint ? (
              <div className="text-xs text-cyan-q mt-2">Hint: {puzzle.hint}</div>
            ) : (
              <button onClick={() => setShowHint(true)} className="mt-2 text-xs text-electric-300">Show hint</button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

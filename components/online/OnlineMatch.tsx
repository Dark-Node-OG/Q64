"use client";

// A live online chess game between two people, synced through Supabase realtime.
// Each move updates the shared game row; the opponent receives it instantly.

import { useCallback, useEffect, useRef, useState } from "react";
import { Chess, type Square } from "chess.js";
import Board from "@/components/chess/Board";
import { BackIcon } from "@/components/ui/icons";
import Q64Word from "@/components/ui/Q64Word";
import { supabase } from "@/lib/supabaseClient";
import { getGame, pushMove, type Game, type OnlineUser } from "@/lib/online";
import { useSettings } from "@/lib/store";

export default function OnlineMatch({ gameId, me, onExit }: { gameId: string; me: OnlineUser; onExit: () => void }) {
  const [settings] = useSettings();
  const [row, setRow] = useState<Game | null>(null);
  const gameRef = useRef(new Chess());
  const [fen, setFen] = useState(gameRef.current.fen());
  const [selected, setSelected] = useState<Square | null>(null);
  const [lastMove, setLastMove] = useState<{ from: Square; to: Square } | null>(null);

  const myColor: "w" | "b" = row ? (row.host_id === me.id ? row.host_color : row.host_color === "w" ? "b" : "w") : "w";

  const applyRow = useCallback((g: Game) => {
    setRow(g);
    const chess = new Chess();
    try { chess.load(g.fen); } catch { /* keep */ }
    gameRef.current = chess;
    setFen(chess.fen());
    const hist = chess.history({ verbose: true });
    const last = hist[hist.length - 1];
    setLastMove(last ? { from: last.from as Square, to: last.to as Square } : null);
  }, []);

  // initial load + realtime subscription to this game row
  useEffect(() => {
    let active = true;
    getGame(gameId).then((g) => { if (active && g) applyRow(g); });
    const sb = supabase;
    if (!sb) return;
    const ch = sb
      .channel(`game:${gameId}`)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "games", filter: `id=eq.${gameId}` }, (payload) => {
        applyRow(payload.new as Game);
      })
      .subscribe();
    return () => { active = false; sb.removeChannel(ch); };
  }, [gameId, applyRow]);

  const over = !!row && (row.status === "finished" || row.status === "abandoned");
  const bothHere = !!row?.guest_id;
  const myTurn = !!row && bothHere && !over && gameRef.current.turn() === myColor;

  const onSquare = useCallback((sq: Square) => {
    if (!myTurn || !row) return;
    const g = gameRef.current;
    const piece = g.get(sq);
    if (selected) {
      if (sq === selected) { setSelected(null); return; }
      // try the move
      try {
        const mv = g.move({ from: selected, to: sq, promotion: "q" });
        if (mv) {
          const isOver = g.isGameOver();
          let winner: string | null = null;
          if (g.isCheckmate()) winner = myColor === "w" ? (row.host_color === "w" ? row.host_name : row.guest_name) || "White" : (row.host_color === "b" ? row.host_name : row.guest_name) || "Black";
          const status: Game["status"] = isOver ? "finished" : "active";
          const moves = [...(row.moves || []), mv.san];
          setFen(g.fen());
          setLastMove({ from: mv.from as Square, to: mv.to as Square });
          setSelected(null);
          void pushMove(gameId, g.fen(), moves, g.turn() as "w" | "b", status, winner);
          return;
        }
      } catch { /* illegal — fall through to reselect */ }
      if (piece && piece.color === myColor) setSelected(sq); else setSelected(null);
    } else if (piece && piece.color === myColor) {
      setSelected(sq);
    }
  }, [myTurn, selected, row, myColor, gameId]);

  const statusText = !row
    ? "Loading…"
    : !bothHere
    ? `Waiting for an opponent — share room code ${row.code}`
    : over
    ? row.winner ? `${row.winner} wins` : "Game over"
    : myTurn ? "Your move" : "Opponent's move…";

  const oppName = row ? (row.host_id === me.id ? row.guest_name || "Opponent" : row.host_name || "Host") : "Opponent";

  return (
    <div className="relative min-h-[100dvh] bg-night-900">
      <div className="absolute inset-0 opacity-20 bg-[url('/bg/home.jpg')] bg-cover bg-center" />
      <div className="absolute inset-0 bg-gradient-to-b from-night-900/90 to-night-900" />
      <div className="relative px-3 pt-3 max-w-[480px] mx-auto">
        <header className="flex items-center justify-between mb-3">
          <button onClick={onExit} className="text-slate-300 hover:text-white"><BackIcon /></button>
          <Q64Word size="sm" />
          <span className="text-slate-400 text-sm">Online</span>
        </header>

        <div className="glass rounded-xl px-3 py-2 mb-3 flex items-center justify-between">
          <span className="text-sm text-white font-semibold">vs {oppName}</span>
          <span className="text-xs text-cyan-q">{row?.code}</span>
        </div>

        <div className={`text-center text-sm mb-2 ${myTurn ? "text-electric-300" : "text-slate-400"}`}>{statusText}</div>

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

        <div className="mt-4 text-center text-[11px] text-slate-500">
          You are {myColor === "w" ? "White" : "Black"} · moves sync live over the internet
        </div>
      </div>
    </div>
  );
}

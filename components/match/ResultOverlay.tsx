"use client";

import { useEffect, useState } from "react";
import { WolfIcon } from "@/components/ui/icons";
import Q64Word from "@/components/ui/Q64Word";

// Polished end-of-game result screen for a Q64 match.
export default function ResultOverlay({
  title, player, winner, score, moves, opponent, isLupus, opponentAvatar, playerAvatar, onRematch, onHome, pgn, result,
}: {
  title: string;
  player: string;
  winner: string | null;
  score: string;
  moves: number;
  opponent: string;
  isLupus?: boolean;
  opponentAvatar?: string | null;
  playerAvatar?: string | null;
  onRematch: () => void;
  onHome: () => void;
  pgn?: string;
  result?: "win" | "loss" | "draw";
}) {
  // LUPUS reviews the finished game (real brain). Silent if the AI is unavailable.
  const [coach, setCoach] = useState<string | null>(null);
  const [coachLoading, setCoachLoading] = useState(false);
  useEffect(() => {
    if (!pgn) return;
    setCoachLoading(true);
    fetch("/api/lupus", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ coach: true, pgn, result: result || "draw", playerName: player }),
    })
      .then((r) => r.json())
      .then((d) => { if (d?.ok && d.text) setCoach(d.text); })
      .catch(() => {})
      .finally(() => setCoachLoading(false));
  }, [pgn, result, player]);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-night-900/85 backdrop-blur-sm animate-fade-in px-6">
      <div className="w-full max-w-sm glass-strong edge-glow rounded-3xl p-6 text-center animate-fade-up">
        <div className="flex justify-center mb-3"><Q64Word size="sm" /></div>
        <div className="text-3xl font-extrabold text-white">{title}</div>
        {winner && <div className="mt-1 text-sm text-slate-300">{winner} wins</div>}

        <div className="my-5 flex items-center justify-center gap-4">
          <div className="flex flex-col items-center">
            <div className="h-12 w-12 rounded-xl overflow-hidden bg-gradient-to-br from-electric-500 to-violet-q flex items-center justify-center font-bold text-white">
              {playerAvatar ? <img src={playerAvatar} alt="" className="h-full w-full object-cover" /> : player.slice(0, 1)}
            </div>
            <div className="text-xs text-slate-300 mt-1">{player}</div>
          </div>
          <div className="text-2xl font-bold text-white tabular-nums">{score}</div>
          <div className="flex flex-col items-center">
            <div className="h-12 w-12 rounded-xl overflow-hidden bg-night-600 flex items-center justify-center text-cyan-q shadow-glow">
              {opponentAvatar ? <img src={opponentAvatar} alt="" className="h-full w-full object-cover" /> : isLupus ? <WolfIcon className="w-7 h-7" /> : <span className="font-bold text-white">{opponent.slice(0, 1)}</span>}
            </div>
            <div className="text-xs text-slate-300 mt-1">{opponent}</div>
          </div>
        </div>

        <div className="text-xs text-slate-400 mb-4">{moves} moves played</div>

        {/* LUPUS post-game coaching */}
        {(coachLoading || coach) && (
          <div className="mb-5 rounded-2xl glass border border-electric-500/30 p-3 text-left">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="h-6 w-6 rounded-lg bg-night-600 text-cyan-q flex items-center justify-center"><WolfIcon className="w-4 h-4" /></span>
              <span className="text-xs font-semibold text-white">LUPUS reviews your game</span>
            </div>
            {coach ? (
              <div className="text-[12px] leading-relaxed text-slate-200 whitespace-pre-line">{coach}</div>
            ) : (
              <div className="text-[12px] text-slate-400">LUPUS is looking over your moves…</div>
            )}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <button onClick={onRematch} className="rounded-xl py-3 font-semibold text-white bg-gradient-to-r from-electric-600 to-electric-500 hover:shadow-glow transition">Rematch</button>
          <button onClick={onHome} className="rounded-xl py-3 font-semibold text-slate-200 glass hover:border-electric-500/50 transition">Home</button>
        </div>
      </div>
    </div>
  );
}

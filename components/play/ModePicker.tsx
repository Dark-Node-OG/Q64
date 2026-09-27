"use client";

// Q64 game-mode selection. Player chooses how to play before a match starts.
// Computer and Local are fully playable now; Online and LUPUS are wired to a
// real backend later (shown with a "Soon" badge, same as the launch plan).

import { useState } from "react";
import Q64Word from "@/components/ui/Q64Word";
import { BackIcon, WolfIcon, ProfileIcon, ChevronRight } from "@/components/ui/icons";
import type { Difficulty } from "@/lib/lupus/agent";
import type { GameMode, Color } from "@/lib/store";
import type { Legend } from "@/lib/legends";

export type MatchConfig = {
  mode: GameMode;
  difficulty: Difficulty;
  playerColor: Color;
  opponent?: Legend | null; // set for Career matches vs a legend
  tournament?: { cupId: string } | null; // set for Cup rounds — advances the cup on a win
};

const DIFFS: { key: Difficulty; label: string; sub: string }[] = [
  { key: "casual", label: "Casual", sub: "Relaxed, ~900" },
  { key: "balanced", label: "Balanced", sub: "Club level, ~1200" },
  { key: "challenging", label: "Challenging", sub: "Strong, ~1550" },
  { key: "analysis", label: "Analysis", sub: "Deep, ~1800" },
];

const MODES: { key: GameMode; title: string; sub: string; badge?: string; disabled?: boolean }[] = [
  { key: "computer", title: "Vs Computer", sub: "Offline — play the Q64 engine" },
  { key: "local", title: "Local — Two Players", sub: "Share one device, take turns" },
  { key: "online", title: "Online — Vs Human", sub: "Sign in, then play a friend by room code", badge: "Live" },
  { key: "lupus", title: "Play with LUPUS", sub: "Your AI chess companion", badge: "Beta" },
];

export default function ModePicker({
  onStart, onBack,
}: {
  onStart: (config: MatchConfig) => void;
  onBack: () => void;
}) {
  const [mode, setMode] = useState<GameMode>("computer");
  const [difficulty, setDifficulty] = useState<Difficulty>("balanced");
  const [playerColor, setPlayerColor] = useState<Color>("w");

  const needsEngine = mode === "computer" || mode === "lupus";

  return (
    <div className="relative min-h-[100dvh] pb-10">
      <div className="absolute inset-0 opacity-30 bg-[url('/bg/home.jpg')] bg-cover bg-center" />
      <div className="absolute inset-0 bg-gradient-to-b from-night-900/90 to-night-900" />

      <div className="relative px-5 pt-6">
        <header className="flex items-center gap-3 mb-6">
          <button onClick={onBack} className="text-slate-300 hover:text-white"><BackIcon /></button>
          <Q64Word size="sm" />
          <span className="text-slate-400 text-sm ml-1">New Game</span>
        </header>

        {/* mode cards */}
        <div className="space-y-3">
          {MODES.map((m) => {
            const active = mode === m.key;
            return (
              <button
                key={m.key}
                onClick={() => !m.disabled && setMode(m.key)}
                disabled={m.disabled}
                className={`w-full rounded-2xl p-4 flex items-center gap-4 text-left transition
                  ${m.disabled ? "opacity-45 cursor-not-allowed glass" : active
                    ? "bg-gradient-to-r from-electric-600/30 to-violet-q/20 border border-electric-500/60 shadow-glow-soft"
                    : "glass hover:border-electric-500/40"}`}
              >
                <span className={`h-11 w-11 rounded-xl flex items-center justify-center ${active ? "bg-night-700 text-cyan-q shadow-glow" : "bg-night-500/70 text-electric-400"}`}>
                  {m.key === "lupus" ? <WolfIcon className="w-6 h-6" /> : <ProfileIcon className="w-6 h-6" />}
                </span>
                <span className="flex-1">
                  <span className="flex items-center gap-2">
                    <span className="font-semibold text-white">{m.title}</span>
                    {m.badge && <span className="text-[10px] px-2 py-0.5 rounded-full bg-violet-q/20 text-violet-200 border border-violet-q/40">{m.badge}</span>}
                  </span>
                  <span className="block text-xs text-slate-400">{m.sub}</span>
                </span>
                <span className={`h-5 w-5 rounded-full border-2 ${active ? "border-cyan-q bg-cyan-q/30" : "border-slate-600"}`} />
              </button>
            );
          })}
        </div>

        {/* difficulty (engine modes only) */}
        {needsEngine && (
          <div className="mt-6">
            <div className="text-xs tracking-[0.3em] text-slate-400 mb-2">DIFFICULTY</div>
            <div className="grid grid-cols-2 gap-2">
              {DIFFS.map((d) => {
                const active = difficulty === d.key;
                return (
                  <button
                    key={d.key}
                    onClick={() => setDifficulty(d.key)}
                    className={`rounded-xl p-3 text-left transition ${active ? "bg-electric-600/25 border border-electric-500/60" : "glass hover:border-electric-500/40"}`}
                  >
                    <div className="font-semibold text-white text-sm">{d.label}</div>
                    <div className="text-[11px] text-slate-400">{d.sub}</div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* side selection (engine modes only) */}
        {needsEngine && (
          <div className="mt-5">
            <div className="text-xs tracking-[0.3em] text-slate-400 mb-2">PLAY AS</div>
            <div className="flex gap-2">
              {(["w", "b"] as Color[]).map((c) => {
                const active = playerColor === c;
                return (
                  <button
                    key={c}
                    onClick={() => setPlayerColor(c)}
                    className={`flex-1 rounded-xl py-3 font-semibold transition ${active ? "bg-electric-600/25 border border-electric-500/60 text-white" : "glass text-slate-300 hover:border-electric-500/40"}`}
                  >
                    {c === "w" ? "White" : "Black"}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* start */}
        <button
          onClick={() => onStart({ mode, difficulty, playerColor })}
          className="mt-8 w-full rounded-2xl py-4 font-bold text-white text-lg flex items-center justify-center gap-2
            bg-gradient-to-r from-electric-600 to-electric-500 hover:shadow-glow transition"
        >
          Start Game <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}

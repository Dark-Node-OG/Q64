"use client";

// Q64 CAREER / STORY MODE. Climb the ladder of real chess legends from a Dark Node
// trainee all the way to the World Champion. Beat one to unlock the next. Your wins
// are saved on the device, so your career and record persist.

import { useEffect, useState } from "react";
import Q64Word from "@/components/ui/Q64Word";
import BottomNav, { type Route } from "@/components/ui/BottomNav";
import { BackIcon } from "@/components/ui/icons";
import { LEGENDS, loadCareer, isUnlocked, nextChallengerIndex, legendPhoto, type Legend } from "@/lib/legends";

export default function CareerScreen({
  onBack, onNavigate, onPlay,
}: {
  onBack: () => void;
  onNavigate: (r: Route) => void;
  onPlay: (legend: Legend) => void;
}) {
  const [beaten, setBeaten] = useState<string[]>([]);

  useEffect(() => setBeaten(loadCareer().beaten), []);

  const nextIdx = nextChallengerIndex(beaten);
  const complete = nextIdx >= LEGENDS.length;
  const progress = Math.round((beaten.length / LEGENDS.length) * 100);

  return (
    <div className="relative min-h-[100dvh] pb-28">
      <div className="absolute inset-0 opacity-30 bg-[url('/bg/home.jpg')] bg-cover bg-center" />
      <div className="absolute inset-0 bg-gradient-to-b from-night-900/90 to-night-900" />

      <div className="relative px-5 pt-6">
        <header className="flex items-center gap-3 mb-4">
          <button onClick={onBack} className="text-slate-300 hover:text-white"><BackIcon /></button>
          <Q64Word size="sm" />
          <span className="text-slate-400 text-sm ml-1">Career</span>
        </header>

        {/* progress */}
        <div className="glass rounded-2xl p-4 mb-5 border border-electric-500/20">
          <div className="flex items-center justify-between mb-2">
            <div className="text-white font-semibold">{complete ? "World Champion 👑" : "Your climb to the crown"}</div>
            <div className="text-cyan-q text-sm">{beaten.length}/{LEGENDS.length}</div>
          </div>
          <div className="h-2 rounded-full bg-night-600 overflow-hidden">
            <div className="h-full bg-gradient-to-r from-electric-500 to-cyan-q transition-all" style={{ width: `${progress}%` }} />
          </div>
          <div className="text-[11px] text-slate-400 mt-2">
            {complete ? "You beat every legend. You are the Q64 champion." : "Beat each opponent to unlock the next. Play White or Black — just win."}
          </div>
        </div>

        {/* ladder */}
        <div className="space-y-2.5">
          {LEGENDS.map((lg, i) => {
            const won = beaten.includes(lg.id);
            const unlocked = isUnlocked(i, beaten);
            const isNext = i === nextIdx;
            return (
              <div
                key={lg.id}
                className={`rounded-2xl p-3 flex items-center gap-3 border transition ${
                  isNext
                    ? "bg-gradient-to-r from-electric-600/30 to-violet-q/20 border-electric-500/60 shadow-glow-soft"
                    : won
                    ? "glass border-emerald-500/30"
                    : unlocked
                    ? "glass border-electric-500/20"
                    : "glass border-slate-700/40 opacity-55"
                }`}
              >
                <div className={`h-12 w-12 shrink-0 rounded-xl overflow-hidden flex items-center justify-center text-xl ${won ? "bg-emerald-500/20" : "bg-gradient-to-br from-electric-500/40 to-violet-q/40"}`}>
                  {unlocked ? (
                    legendPhoto(lg) ? <img src={legendPhoto(lg)!} alt="" className="h-full w-full object-cover" /> : <span>{lg.country}</span>
                  ) : "🔒"}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-white truncate">{unlocked ? lg.name : "??? Locked"}</span>
                    {won && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300">Beaten</span>}
                  </div>
                  <div className="text-[11px] text-slate-400 truncate">
                    {unlocked ? `${lg.title} · ${lg.rating}` : `Beat ${i > 0 ? LEGENDS[i - 1].name : "the first"} to unlock`}
                  </div>
                </div>
                {isNext ? (
                  <button
                    onClick={() => onPlay(lg)}
                    className="shrink-0 rounded-xl px-4 py-2 text-sm font-bold text-white bg-gradient-to-r from-electric-600 to-electric-500 hover:shadow-glow"
                  >
                    Play
                  </button>
                ) : won ? (
                  <button
                    onClick={() => onPlay(lg)}
                    className="shrink-0 rounded-xl px-3 py-2 text-xs font-semibold text-slate-200 glass hover:border-electric-500/40"
                  >
                    Rematch
                  </button>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>

      <BottomNav active="career" onNavigate={onNavigate} />
    </div>
  );
}

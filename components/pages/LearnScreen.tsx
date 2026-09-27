"use client";

import { useState } from "react";
import Q64Word from "@/components/ui/Q64Word";
import BottomNav, { type Route } from "@/components/ui/BottomNav";
import { BackIcon, ChevronRight } from "@/components/ui/icons";
import { LESSONS, type Lesson } from "@/lib/learn";
import MiniBoard from "@/components/chess/MiniBoard";
import { useSettings } from "@/lib/store";

const LEVEL_COLOR: Record<Lesson["level"], string> = {
  Beginner: "text-emerald-300 border-emerald-400/40 bg-emerald-500/15",
  Intermediate: "text-cyan-q border-cyan-q/40 bg-cyan-q/10",
  Advanced: "text-violet-200 border-violet-q/40 bg-violet-q/15",
};

export default function LearnScreen({ onBack, onNavigate }: { onBack: () => void; onNavigate: (r: Route) => void }) {
  const [open, setOpen] = useState<string | null>(null);
  const [settings] = useSettings();

  return (
    <div className="relative min-h-[100dvh] pb-28">
      <div className="absolute inset-0 opacity-30 bg-[url('/bg/home.jpg')] bg-cover bg-center" />
      <div className="absolute inset-0 bg-gradient-to-b from-night-900/90 to-night-900" />

      <div className="relative px-5 pt-6">
        <header className="flex items-center gap-3 mb-6">
          <button onClick={onBack} className="text-slate-300 hover:text-white"><BackIcon /></button>
          <Q64Word size="sm" />
          <span className="text-slate-400 text-sm ml-1">Learn</span>
        </header>

        <div className="space-y-3">
          {LESSONS.map((l) => {
            const expanded = open === l.id;
            return (
              <div key={l.id} className="glass rounded-2xl overflow-hidden">
                <button onClick={() => setOpen(expanded ? null : l.id)} className="w-full p-4 flex items-center gap-4 text-left hover:bg-white/5">
                  <span className="flex-1">
                    <span className="flex items-center gap-2">
                      <span className="font-semibold text-white">{l.title}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full border ${LEVEL_COLOR[l.level]}`}>{l.level}</span>
                    </span>
                    <span className="block text-xs text-slate-400 mt-0.5">{l.summary}</span>
                    <span className="block text-[11px] text-slate-500 mt-1">{l.minutes} min read</span>
                  </span>
                  <ChevronRight className={`w-5 h-5 text-slate-500 transition ${expanded ? "rotate-90" : ""}`} />
                </button>
                {expanded && (
                  <div className="px-4 pb-4">
                    <ul className="space-y-2 border-t border-electric-500/15 pt-3">
                      {l.points.map((p, i) => (
                        <li key={i} className="flex gap-2 text-sm text-slate-200">
                          <span className="text-cyan-q mt-0.5">◆</span>
                          <span>{p}</span>
                        </li>
                      ))}
                    </ul>

                    {/* visual diagrams */}
                    {l.diagrams.map((d, i) => (
                      <div key={i} className="mt-4 flex gap-3 items-start">
                        <div className="w-32 shrink-0">
                          <MiniBoard fen={d.fen} theme={settings.boardTheme} highlights={d.highlights} />
                        </div>
                        <div className="text-xs text-slate-300 pt-1">{d.caption}</div>
                      </div>
                    ))}

                    <button onClick={() => onNavigate("puzzles")} className="mt-4 text-xs text-electric-300">Practice with puzzles →</button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <BottomNav active="learn" onNavigate={onNavigate} />
    </div>
  );
}

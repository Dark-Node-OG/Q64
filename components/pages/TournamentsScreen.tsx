"use client";

// Q64 CUPS & TOURNAMENTS. Enter a cup, beat each round's opponent in order, and lift the
// trophy. Your progress and won cups are saved on the device.

import { useEffect, useState } from "react";
import Q64Word from "@/components/ui/Q64Word";
import BottomNav, { type Route } from "@/components/ui/BottomNav";
import { BackIcon } from "@/components/ui/icons";
import {
  CUPS, loadCups, isCupUnlocked, cupRound, cupNextOpponent, cupById, type CupState,
} from "@/lib/tournaments";
import { legendById, legendPhoto, type Legend } from "@/lib/legends";

export default function TournamentsScreen({
  onBack, onNavigate, onPlay,
}: {
  onBack: () => void;
  onNavigate: (r: Route) => void;
  onPlay: (legend: Legend, cupId: string) => void;
}) {
  const [state, setState] = useState<CupState>({ won: [], progress: {} });
  useEffect(() => setState(loadCups()), []);

  return (
    <div className="relative min-h-[100dvh] pb-28">
      <div className="absolute inset-0 opacity-30 bg-[url('/bg/home.jpg')] bg-cover bg-center" />
      <div className="absolute inset-0 bg-gradient-to-b from-night-900/90 to-night-900" />

      <div className="relative px-5 pt-6">
        <header className="flex items-center gap-3 mb-4">
          <button onClick={onBack} className="text-slate-300 hover:text-white"><BackIcon /></button>
          <Q64Word size="sm" />
          <span className="text-slate-400 text-sm ml-1">Cups & Tournaments</span>
        </header>

        <div className="glass rounded-2xl p-4 mb-5 border border-electric-500/20">
          <div className="text-white font-semibold">{state.won.length}/{CUPS.length} cups won</div>
          <div className="text-[11px] text-slate-400 mt-1">Beat every round in a cup to lift the trophy. Lose a round? Just try it again.</div>
          {state.won.length > 0 && (
            <div className="mt-2 flex gap-1.5 text-xl">{CUPS.filter((c) => state.won.includes(c.id)).map((c) => <span key={c.id}>{c.icon}</span>)}</div>
          )}
        </div>

        <div className="space-y-3">
          {CUPS.map((cup) => {
            const unlocked = isCupUnlocked(cup, state.won);
            const won = state.won.includes(cup.id);
            const round = cupRound(cup.id, state);
            const total = cup.rounds.length;
            const next = cupNextOpponent(cup.id, state);
            const pct = Math.round((round / total) * 100);
            return (
              <div
                key={cup.id}
                className={`rounded-2xl p-4 border transition ${
                  won ? "glass border-emerald-500/30" : unlocked ? "glass border-electric-500/25" : "glass border-slate-700/40 opacity-55"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 shrink-0 rounded-xl bg-gradient-to-br from-electric-500/30 to-violet-q/30 flex items-center justify-center text-2xl">
                    {unlocked ? cup.icon : "🔒"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-white">{cup.name}</div>
                    <div className="text-[11px] text-slate-400 truncate">
                      {unlocked ? cup.subtitle : `Win the ${cupById(cup.unlockAfter || "")?.name ?? "previous cup"} first`}
                    </div>
                  </div>
                  {won && <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300">Champion</span>}
                </div>

                {unlocked && (
                  <>
                    {/* bracket — every opponent in this cup, in order */}
                    <div className="mt-3 flex items-center gap-1.5">
                      {cup.rounds.map((rid, ri) => {
                        const lg = legendById(rid);
                        const done = ri < round;
                        const current = ri === round && !won;
                        const photo = lg ? legendPhoto(lg) : null;
                        return (
                          <div key={rid} className="flex items-center gap-1.5">
                            <div
                              title={lg?.name}
                              className={`h-8 w-8 rounded-lg overflow-hidden flex items-center justify-center text-sm border ${
                                done ? "border-emerald-500/60" : current ? "border-cyan-q shadow-glow" : "border-slate-600/50 opacity-70"
                              }`}
                            >
                              {photo ? <img src={photo} alt="" className="h-full w-full object-cover" /> : <span>{lg?.country ?? "🐺"}</span>}
                            </div>
                            {ri < cup.rounds.length - 1 && <span className="text-slate-600 text-xs">›</span>}
                          </div>
                        );
                      })}
                    </div>
                    <div className="mt-3 h-1.5 rounded-full bg-night-600 overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-electric-500 to-cyan-q" style={{ width: `${pct}%` }} />
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <div className="text-[11px] text-slate-400">
                        {won ? "Cup complete" : `Round ${round + 1} of ${total} · ${next?.name ?? ""}`}
                      </div>
                      {!won && next && (
                        <button
                          onClick={() => onPlay(next, cup.id)}
                          className="rounded-xl px-4 py-1.5 text-sm font-bold text-white bg-gradient-to-r from-electric-600 to-electric-500 hover:shadow-glow"
                        >
                          {round === 0 ? "Enter" : "Next round"}
                        </button>
                      )}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <BottomNav active="tournaments" onNavigate={onNavigate} />
    </div>
  );
}

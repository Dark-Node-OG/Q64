"use client";

import { useEffect, useState } from "react";
import Q64Word from "@/components/ui/Q64Word";
import BottomNav, { type Route } from "@/components/ui/BottomNav";
import { BackIcon } from "@/components/ui/icons";
import { getHistory, clearHistory, type GameRecord } from "@/lib/store";

const MODE_LABEL: Record<string, string> = {
  computer: "Vs Computer", local: "Local", online: "Online", lupus: "LUPUS",
};

function fmtDate(ms: number) {
  return new Date(ms).toLocaleDateString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function HistoryScreen({ onBack, onNavigate }: { onBack: () => void; onNavigate: (r: Route) => void }) {
  const [history, setHistory] = useState<GameRecord[]>([]);

  useEffect(() => setHistory(getHistory()), []);

  function wipe() {
    clearHistory();
    setHistory([]);
  }

  return (
    <div className="relative min-h-[100dvh] pb-28">
      <div className="absolute inset-0 opacity-30 bg-[url('/bg/home.jpg')] bg-cover bg-center" />
      <div className="absolute inset-0 bg-gradient-to-b from-night-900/90 to-night-900" />

      <div className="relative px-5 pt-6">
        <header className="flex items-center gap-3 mb-6">
          <button onClick={onBack} className="text-slate-300 hover:text-white"><BackIcon /></button>
          <Q64Word size="sm" />
          <span className="text-slate-400 text-sm ml-1">Game History</span>
          {history.length > 0 && (
            <button onClick={wipe} className="ml-auto text-[11px] text-red-300/80 hover:text-red-300">Clear all</button>
          )}
        </header>

        {history.length === 0 ? (
          <div className="glass rounded-2xl p-8 text-center">
            <div className="text-slate-300 font-semibold mb-1">No games yet</div>
            <div className="text-sm text-slate-400 mb-4">Finished games are saved here automatically.</div>
            <button onClick={() => onNavigate("play")} className="rounded-xl px-5 py-2.5 text-white bg-gradient-to-r from-electric-600 to-electric-500 text-sm font-semibold">Play a game</button>
          </div>
        ) : (
          <div className="space-y-2.5">
            {history.map((g) => {
              const rated = g.mode === "computer" || g.mode === "lupus";
              const delta = g.ratingAfter - g.ratingBefore;
              return (
                <div key={g.id} className="glass rounded-xl p-3.5 flex items-center gap-3">
                  <span className={`h-10 w-10 rounded-lg grid place-items-center font-bold
                    ${g.result === "win" ? "bg-emerald-500/25 text-emerald-300 border border-emerald-400/40"
                      : g.result === "loss" ? "bg-red-500/20 text-red-300 border border-red-400/40"
                      : "bg-slate-500/20 text-slate-300 border border-slate-400/40"}`}>
                    {g.result === "win" ? "W" : g.result === "loss" ? "L" : "D"}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-white">
                      {MODE_LABEL[g.mode]} <span className="text-slate-500">·</span> <span className="text-slate-300 capitalize">{g.reason}</span>
                    </div>
                    <div className="text-[11px] text-slate-400">{fmtDate(g.date)} · {g.moves} moves · as {g.playerColor === "w" ? "White" : "Black"}</div>
                  </div>
                  {rated && (
                    <span className={`text-xs font-semibold tabular-nums ${delta > 0 ? "text-emerald-300" : delta < 0 ? "text-red-300" : "text-slate-400"}`}>
                      {delta > 0 ? "+" : ""}{delta}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <BottomNav active="history" onNavigate={onNavigate} />
    </div>
  );
}

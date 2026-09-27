"use client";

import { useEffect, useState } from "react";
import {
  PlayIcon, PuzzleIcon, LearnIcon, HistoryIcon, ProfileIcon,
  SettingsIcon, BellIcon, WolfIcon, ChevronRight, TrophyIcon,
} from "@/components/ui/icons";
import Q64Word from "@/components/ui/Q64Word";
import BottomNav, { type Route } from "@/components/ui/BottomNav";
import { LEGENDS, loadCareer, nextChallengerIndex } from "@/lib/legends";
import { getHistory } from "@/lib/store";

type Notice = { text: string; route: Route };

// Real notifications from the player's own data (career, last game) — no fake badge.
function buildNotices(): Notice[] {
  const out: Notice[] = [];
  try {
    const beaten = loadCareer().beaten;
    const idx = nextChallengerIndex(beaten);
    if (idx < LEGENDS.length) out.push({ text: `Career: your next challenger is ${LEGENDS[idx].name}`, route: "career" });
    else out.push({ text: "Career complete — you are the World Champion 👑", route: "career" });
    const h = getHistory();
    if (h.length) {
      const last = h[0];
      out.push({ text: `Last game vs ${last.opponent}: ${last.result === "win" ? "you won" : last.result === "loss" ? "you lost" : "a draw"}`, route: "history" });
    } else {
      out.push({ text: "Play your first game to start your record", route: "play" });
    }
  } catch {}
  return out;
}

type Props = {
  player: { name: string; avatar: string | null };
  onNavigate: (r: Route) => void;
};

const MENU: { key: Route; title: string; sub: string; Icon: typeof PlayIcon }[] = [
  { key: "play", title: "Play", sub: "Computer, local two-player or LUPUS", Icon: PlayIcon },
  { key: "career", title: "Career", sub: "Climb from rookie to World Champion", Icon: WolfIcon },
  { key: "tournaments", title: "Cups & Tournaments", sub: "Win trophies and championships", Icon: TrophyIcon },
  { key: "puzzles", title: "Puzzles", sub: "Train your tactics", Icon: PuzzleIcon },
  { key: "learn", title: "Learn", sub: "Improve your skills", Icon: LearnIcon },
  { key: "history", title: "Game History", sub: "View your past games", Icon: HistoryIcon },
  { key: "profile", title: "Profile", sub: "Your stats & achievements", Icon: ProfileIcon },
];

export default function HomeScreen({ player, onNavigate }: Props) {
  const playerName = player.name;
  const [notices, setNotices] = useState<Notice[]>([]);
  const [showNotif, setShowNotif] = useState(false);
  useEffect(() => setNotices(buildNotices()), []);
  return (
    <div className="relative min-h-[100dvh] pb-24">
      <div className="absolute inset-0 opacity-40 bg-[url('/bg/home.jpg')] bg-cover bg-center" />
      <div className="absolute inset-0 bg-gradient-to-b from-night-900/85 via-night-900/92 to-night-900" />

      <div className="relative px-5 pt-6">
        {/* top bar */}
        <header className="flex items-center justify-between">
          <Q64Word size="md" />
          <div className="flex items-center gap-4 text-slate-300">
            <div className="relative">
              <button aria-label="Notifications" className="relative" onClick={() => setShowNotif((v) => !v)}>
                <BellIcon className="w-6 h-6" />
                {notices.length > 0 && <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-cyan-q" />}
              </button>
              {showNotif && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setShowNotif(false)} />
                  <div className="absolute right-0 mt-2 w-64 z-40 glass-strong rounded-2xl border border-electric-500/30 p-2 animate-fade-up">
                    <div className="px-2 py-1 text-[11px] tracking-wide text-slate-400">NOTIFICATIONS</div>
                    {notices.length === 0 ? (
                      <div className="px-2 py-3 text-xs text-slate-400">You are all caught up.</div>
                    ) : (
                      notices.map((n, i) => (
                        <button
                          key={i}
                          onClick={() => { setShowNotif(false); onNavigate(n.route); }}
                          className="w-full text-left rounded-xl px-2 py-2 text-[12px] text-slate-200 hover:bg-night-600/60"
                        >
                          {n.text}
                        </button>
                      ))
                    )}
                  </div>
                </>
              )}
            </div>
            <button aria-label="Settings" onClick={() => onNavigate("settings")}><SettingsIcon className="w-6 h-6" /></button>
            <button onClick={() => onNavigate("profile")} className="h-9 w-9 rounded-full overflow-hidden bg-gradient-to-br from-electric-500 to-violet-q ring-2 ring-electric-500/40 flex items-center justify-center text-sm font-bold text-white">
              {player.avatar ? <img src={player.avatar} alt="" className="h-full w-full object-cover" /> : playerName.slice(0, 1)}
            </button>
          </div>
        </header>

        {/* welcome card */}
        <section className="mt-5 glass-strong edge-glow rounded-2xl p-4 flex items-center gap-4 animate-fade-up">
          <div className="h-14 w-14 rounded-xl bg-night-600 flex items-center justify-center text-cyan-q shadow-glow">
            <WolfIcon className="w-8 h-8" />
          </div>
          <div className="flex-1">
            <div className="text-xs text-slate-400">Welcome back,</div>
            <div className="text-xl font-bold text-white leading-tight">{playerName}</div>
            <div className="text-xs text-slate-400">Better moves. Bigger goals.</div>
          </div>
        </section>

        {/* menu */}
        <nav className="mt-4 space-y-3">
          {MENU.map(({ key, title, sub, Icon }, i) => (
            <button
              key={key}
              onClick={() => onNavigate(key)}
              className="group w-full glass rounded-2xl p-4 flex items-center gap-4 text-left transition hover:border-electric-500/50 hover:shadow-glow-soft animate-fade-up"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <span className="h-11 w-11 rounded-xl bg-night-500/70 flex items-center justify-center text-electric-400 group-hover:text-cyan-q transition">
                <Icon className="w-6 h-6" />
              </span>
              <span className="flex-1">
                <span className="block font-semibold text-white">{title}</span>
                <span className="block text-xs text-slate-400">{sub}</span>
              </span>
              <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-electric-400 transition" />
            </button>
          ))}

          {/* LUPUS highlight */}
          <button
            onClick={() => onNavigate("play")}
            className="group w-full rounded-2xl p-4 flex items-center gap-4 text-left animate-fade-up
              bg-gradient-to-r from-electric-600/25 to-violet-q/20 border border-electric-500/40 hover:shadow-glow transition"
            style={{ animationDelay: "320ms" }}
          >
            <span className="h-11 w-11 rounded-xl bg-night-700 flex items-center justify-center text-cyan-q shadow-glow">
              <WolfIcon className="w-6 h-6" />
            </span>
            <span className="flex-1">
              <span className="flex items-center gap-2">
                <span className="font-semibold text-white">Play with LUPUS</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-400/30">● Online</span>
              </span>
              <span className="block text-xs text-slate-400">Your AI chess companion</span>
            </span>
            <ChevronRight className="w-5 h-5 text-electric-300" />
          </button>
        </nav>
      </div>

      <BottomNav active="home" onNavigate={onNavigate} />
    </div>
  );
}

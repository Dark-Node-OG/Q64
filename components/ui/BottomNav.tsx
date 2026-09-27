"use client";

import { HomeIcon, PlayIcon, PuzzleIcon, LearnIcon, SettingsIcon } from "@/components/ui/icons";

export type Route = "home" | "play" | "puzzles" | "learn" | "history" | "profile" | "settings" | "match" | "career" | "tournaments" | "online";

const ITEMS: { label: string; route: Route; Icon: typeof HomeIcon }[] = [
  { label: "Home", route: "home", Icon: HomeIcon },
  { label: "Play", route: "play", Icon: PlayIcon },
  { label: "Puzzles", route: "puzzles", Icon: PuzzleIcon },
  { label: "Learn", route: "learn", Icon: LearnIcon },
  { label: "Settings", route: "settings", Icon: SettingsIcon },
];

export default function BottomNav({ active, onNavigate }: { active: Route; onNavigate: (r: Route) => void }) {
  return (
    <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] px-4 pb-3 z-20">
      <div className="glass-strong rounded-2xl border border-electric-500/20 flex justify-between px-2 py-2">
        {ITEMS.map(({ label, route, Icon }) => (
          <button
            key={label}
            onClick={() => onNavigate(route)}
            className={`flex-1 flex flex-col items-center gap-1 py-1 transition ${active === route ? "text-electric-400" : "text-slate-400 hover:text-slate-200"}`}
          >
            <Icon className="w-5 h-5" />
            <span className="text-[10px]">{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

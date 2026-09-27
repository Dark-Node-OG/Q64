"use client";

import { useEffect } from "react";

// Dark Node studio cinematic intro. Short, atmospheric, then hands off to Q64 loading.
export default function DarkNodeIntro({ onDone }: { onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 2600);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-night-900 animate-fade-in cursor-pointer"
      onClick={onDone}
    >
      <div className="absolute inset-0 opacity-70 animate-slow-drift bg-[url('/bg/launch.jpg')] bg-cover bg-center" />
      <div className="absolute inset-0 bg-gradient-to-b from-night-900/70 via-night-900/40 to-night-900" />

      {/* central energy beam */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 h-1/2 w-[2px] beam-line animate-beam" />

      <div className="relative flex flex-col items-center text-center px-8">
        <div className="animate-logo-reveal">
          <div className="text-2xl font-semibold tracking-[0.35em] text-white">DARK NODE</div>
          <div className="mt-1 text-[11px] tracking-[0.5em] text-electric-400/80">GAME STUDIO</div>
        </div>
      </div>

      <div className="absolute bottom-10 text-[10px] tracking-[0.6em] text-slate-400 animate-fade-in">
        GAMES · AI · FUTURE
      </div>
    </div>
  );
}

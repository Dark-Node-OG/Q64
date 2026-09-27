"use client";

import { useEffect, useState } from "react";
import Q64Word from "@/components/ui/Q64Word";

const STEPS = [
  "Loading game engine...",
  "Preparing the board...",
  "Connecting AI agent...",
  "Syncing data...",
  "Almost ready...",
];

// Q64 loading experience: logo, chess theme background, animated progress + status steps.
export default function LoadingScreen({ onDone }: { onDone: () => void }) {
  const [progress, setProgress] = useState(0);
  const [step, setStep] = useState(0);

  useEffect(() => {
    const total = 2600;
    const start = Date.now();
    const id = setInterval(() => {
      const p = Math.min(100, ((Date.now() - start) / total) * 100);
      setProgress(p);
      setStep(Math.min(STEPS.length - 1, Math.floor((p / 100) * STEPS.length)));
      if (p >= 100) {
        clearInterval(id);
        setTimeout(onDone, 350);
      }
    }, 60);
    return () => clearInterval(id);
  }, [onDone]);

  return (
    <div className="fixed inset-0 z-40 flex flex-col items-center bg-night-900 animate-fade-in">
      <div className="absolute inset-0 opacity-80 animate-slow-drift bg-[url('/bg/loading.jpg')] bg-cover bg-center" />
      <div className="absolute inset-0 bg-gradient-to-b from-night-900/50 via-night-900/30 to-night-900" />

      <div className="relative flex flex-col items-center pt-24">
        <div className="animate-logo-reveal">
          <Q64Word size="xl" tagline />
        </div>
      </div>

      <div className="relative mt-auto mb-16 w-full max-w-sm px-8">
        <div className="mb-3 text-center text-[11px] tracking-[0.35em] text-shimmer">
          INITIALIZING Q64...
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-night-600/70 border border-electric-500/20">
          <div className="h-full progress-shimmer rounded-full transition-[width] duration-100" style={{ width: `${progress}%` }} />
        </div>

        <ul className="mt-5 space-y-2">
          {STEPS.map((s, i) => (
            <li key={s} className="flex items-center gap-3 text-sm">
              <span
                className={`inline-block h-2.5 w-2.5 rounded-full border ${
                  i < step
                    ? "bg-electric-500 border-electric-500"
                    : i === step
                    ? "bg-cyan-q border-cyan-q animate-pulse-glow"
                    : "bg-transparent border-slate-600"
                }`}
              />
              <span className={i <= step ? "text-slate-100" : "text-slate-500"}>{s}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

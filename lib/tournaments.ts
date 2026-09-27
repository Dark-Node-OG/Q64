// Q64 CUPS & TOURNAMENTS. Each cup is a short bracket of opponents you beat in order.
// Win every round to lift the trophy. Lose a round and you simply retry it (forgiving),
// so a cup is a real run you can grind. Progress + won cups persist on the device.

"use client";

import { LEGENDS, legendById, type Legend } from "@/lib/legends";

export type Cup = {
  id: string;
  name: string;
  subtitle: string;
  icon: string; // emoji trophy/medal
  rounds: string[]; // legend ids, in order
  unlockAfter?: string; // cup id that must be won first
};

export const CUPS: Cup[] = [
  { id: "rookie", name: "Rookie Cup", subtitle: "Your first taste of glory", icon: "🥉", rounds: ["cadet-vale", "scout-ren", "tristan-tate"] },
  { id: "attackers", name: "Attackers Cup", subtitle: "Survive the fiercest hitters", icon: "🥈", rounds: ["andrew-tate", "emory-tate", "tal"], unlockAfter: "rookie" },
  { id: "legends", name: "Legends Cup", subtitle: "Face the immortals of chess", icon: "🥇", rounds: ["morphy", "capablanca", "karpov"], unlockAfter: "attackers" },
  { id: "world", name: "World Championship", subtitle: "Beat the greatest to be crowned", icon: "🏆", rounds: ["fischer", "anand", "kasparov", "carlsen"], unlockAfter: "legends" },
];

const KEY = "q64.cups";
export type CupState = { won: string[]; progress: Record<string, number> }; // progress = rounds completed

export function loadCups(): CupState {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const p = JSON.parse(raw) as CupState;
      return { won: Array.isArray(p.won) ? p.won : [], progress: p.progress && typeof p.progress === "object" ? p.progress : {} };
    }
  } catch {}
  return { won: [], progress: {} };
}
function save(s: CupState) { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch {} }

export function cupById(id: string): Cup | undefined {
  return CUPS.find((c) => c.id === id);
}
export function isCupUnlocked(cup: Cup, won: string[]): boolean {
  return !cup.unlockAfter || won.includes(cup.unlockAfter);
}
// Which round the player is on for a cup (0-based). Equals rounds.length when the cup is complete.
export function cupRound(cupId: string, s: CupState): number {
  return Math.min(s.progress[cupId] ?? 0, (cupById(cupId)?.rounds.length ?? 0));
}
// The next opponent to play in a cup, or null if the cup is finished.
export function cupNextOpponent(cupId: string, s: CupState): Legend | null {
  const cup = cupById(cupId);
  if (!cup) return null;
  const r = cupRound(cupId, s);
  if (r >= cup.rounds.length) return null;
  return legendById(cup.rounds[r]) ?? null;
}
// Call after WINNING a cup round: advance; if the final round is cleared, mark the cup won.
export function advanceCup(cupId: string): CupState {
  const s = loadCups();
  const cup = cupById(cupId);
  if (!cup) return s;
  const done = (s.progress[cupId] ?? 0) + 1;
  s.progress[cupId] = done;
  if (done >= cup.rounds.length && !s.won.includes(cupId)) s.won.push(cupId);
  save(s);
  return s;
}
// Convenience for other screens (e.g. the trophy shelf on the profile).
export function wonCups(): Cup[] {
  const s = loadCups();
  return CUPS.filter((c) => s.won.includes(c.id));
}
export { LEGENDS };

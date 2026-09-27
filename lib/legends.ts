// Q64 CAREER / STORY MODE — the ladder of opponents you climb from beginner to World Champion.
// Real chess legends (public data + real signature quotes) plus a few Dark Node trainee bots at
// the very start and the Tate family (their father Emory Tate was a real attacking International
// Master). You beat one to unlock the next; beat the champion to win the crown.
//
// Photos: drop a real image at /public/legends/<id>.jpg to show a face; until then a clean
// styled initial-avatar is shown (see CareerScreen). Ratings are the player's real peak strength
// (flavor + story); the on-device engine plays at the mapped difficulty tier.

"use client";

import type { Difficulty } from "@/lib/lupus/agent";

export type Legend = {
  id: string;
  name: string;
  title: string; // e.g. "World Champion", "The Magician from Riga"
  country: string; // flag emoji
  rating: number; // peak strength (story/flavor)
  era: string;
  style: string;
  difficulty: Difficulty; // which engine strength this opponent plays at
  quote: string; // shown on a card while you play them
  real: boolean; // true = real historical/current player
};

// Ordered WEAKEST → STRONGEST. This order IS the career ladder.
export const LEGENDS: Legend[] = [
  { id: "cadet-vale", name: "Cadet Vale", title: "Dark Node Trainee", country: "🐺", rating: 700, era: "Recruit", style: "Learning the ropes, makes mistakes", difficulty: "casual", quote: "I'm still learning… but I won't go down easy.", real: false },
  { id: "scout-ren", name: "Scout Ren", title: "Dark Node Scout", country: "🐺", rating: 980, era: "Recruit", style: "Solid but predictable", difficulty: "casual", quote: "Show me what you've got, challenger.", real: false },
  { id: "tristan-tate", name: "Tristan Tate", title: "The Wingman", country: "🇺🇸", rating: 1250, era: "Modern", style: "Bold, impatient, loves to attack", difficulty: "casual", quote: "I play chess like I live — fast and fearless.", real: true },
  { id: "andrew-tate", name: "Andrew Tate", title: "Top G", country: "🇺🇸", rating: 1500, era: "Modern", style: "Aggressive, relentless pressure", difficulty: "balanced", quote: "I don't lose. I win, or I learn. On this board, I win.", real: true },
  { id: "emory-tate", name: "Emory Tate", title: "International Master", country: "🇺🇸", rating: 2200, era: "1980s–2010s", style: "Brilliant, sacrificial attacker", difficulty: "balanced", quote: "Chess is a fighting art. I don't play the board — I hunt the king.", real: true },
  { id: "morphy", name: "Paul Morphy", title: "The Pride of New Orleans", country: "🇺🇸", rating: 2500, era: "1850s", style: "Romantic, fast development, deadly attacks", difficulty: "challenging", quote: "Help your pieces so they can help you.", real: true },
  { id: "capablanca", name: "José Raúl Capablanca", title: "The Chess Machine", country: "🇨🇺", rating: 2725, era: "1920s", style: "Effortless, perfect endgames", difficulty: "challenging", quote: "You may learn much more from a game you lose than from a game you win.", real: true },
  { id: "tal", name: "Mikhail Tal", title: "The Magician from Riga", country: "🇱🇻", rating: 2705, era: "1960s", style: "Wild sacrifices, chaos and beauty", difficulty: "challenging", quote: "You must take your opponent into a deep dark forest where 2+2=5.", real: true },
  { id: "karpov", name: "Anatoly Karpov", title: "The Boa Constrictor", country: "🇷🇺", rating: 2780, era: "1970s–80s", style: "Squeezes you slowly until you break", difficulty: "analysis", quote: "Chess is everything: art, science, and sport.", real: true },
  { id: "fischer", name: "Bobby Fischer", title: "The Lone Genius", country: "🇺🇸", rating: 2785, era: "1970s", style: "Precise, ruthless, universal", difficulty: "analysis", quote: "I don't believe in psychology. I believe in good moves.", real: true },
  { id: "anand", name: "Viswanathan Anand", title: "The Tiger of Madras", country: "🇮🇳", rating: 2817, era: "2000s", style: "Lightning fast, universal", difficulty: "analysis", quote: "Confidence is very important — even pretending to be confident.", real: true },
  { id: "kasparov", name: "Garry Kasparov", title: "The Beast of Baku", country: "🇷🇺", rating: 2851, era: "1985–2005", style: "Explosive attacking power", difficulty: "analysis", quote: "Chess is mental torture.", real: true },
  { id: "carlsen", name: "Magnus Carlsen", title: "World Champion", country: "🇳🇴", rating: 2882, era: "Now", style: "Grinds any position, never lets go", difficulty: "analysis", quote: "You have to be merciless.", real: true },
];

export const FINAL_BOSS = LEGENDS[LEGENDS.length - 1];

// ---- career progress (localStorage) ----
const KEY = "q64.career";
export type CareerState = { beaten: string[] }; // ids of legends defeated

export function loadCareer(): CareerState {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as CareerState;
      return { beaten: Array.isArray(parsed.beaten) ? parsed.beaten : [] };
    }
  } catch {}
  return { beaten: [] };
}
export function saveCareer(s: CareerState) {
  try { localStorage.setItem(KEY, JSON.stringify(s)); } catch {}
}
export function markBeaten(id: string) {
  const s = loadCareer();
  if (!s.beaten.includes(id)) { s.beaten.push(id); saveCareer(s); }
}

// A legend is unlocked if it's the first, or the previous one on the ladder is beaten.
export function isUnlocked(index: number, beaten: string[]): boolean {
  if (index === 0) return true;
  return beaten.includes(LEGENDS[index - 1].id);
}
export function nextChallengerIndex(beaten: string[]): number {
  const i = LEGENDS.findIndex((l) => !beaten.includes(l.id));
  return i === -1 ? LEGENDS.length : i; // length = career complete
}
export function legendById(id: string): Legend | undefined {
  return LEGENDS.find((l) => l.id === id);
}
// Every opponent has a photo at /legends/<id>.jpg (real players = real photos; the two Dark
// Node bots = random faces), so an avatar always shows.
export function legendPhoto(lg: Legend): string {
  return `/legends/${lg.id}.jpg`;
}

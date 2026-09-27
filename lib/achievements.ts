"use client";
// Q64 achievements — badges the player unlocks from their real progress (all computed
// from on-device data: games, career, cups, rating). Shown on the profile.
import { getHistory, computeStats, getProfile } from "./store";
import { loadCareer, legendById } from "./legends";
import { loadCups } from "./tournaments";

export type Achievement = { id: string; name: string; desc: string; icon: string; unlocked: boolean };

export function achievements(): Achievement[] {
  const stats = computeStats(getHistory());
  const beaten = loadCareer().beaten;
  const wonCups = loadCups().won;
  const rating = getProfile().rating;
  const beatReal = beaten.some((id) => legendById(id)?.real);

  const defs: { id: string; name: string; desc: string; icon: string; ok: boolean }[] = [
    { id: "first-win", name: "First Blood", desc: "Win your first game", icon: "⚔️", ok: stats.wins >= 1 },
    { id: "streak3", name: "On Fire", desc: "Win 3 games in a row", icon: "🔥", ok: stats.bestStreak >= 3 },
    { id: "vet", name: "Veteran", desc: "Play 25 games", icon: "🎖️", ok: stats.total >= 25 },
    { id: "sharp", name: "Sharpshooter", desc: "60% win rate (10+ games)", icon: "🎯", ok: stats.total >= 10 && stats.winRate >= 60 },
    { id: "slayer", name: "Giant Slayer", desc: "Beat a real chess legend", icon: "🗡️", ok: beatReal },
    { id: "champ", name: "World Champion", desc: "Beat Magnus in Career", icon: "👑", ok: beaten.includes("carlsen") },
    { id: "trophy", name: "Trophy Hunter", desc: "Win a cup", icon: "🏆", ok: wonCups.length >= 1 },
    { id: "classA", name: "Class A", desc: "Reach a 1600 rating", icon: "📈", ok: rating >= 1600 },
    { id: "master", name: "Master", desc: "Reach a 2200 rating", icon: "♟️", ok: rating >= 2200 },
  ];
  return defs.map((a) => ({ id: a.id, name: a.name, desc: a.desc, icon: a.icon, unlocked: a.ok }));
}

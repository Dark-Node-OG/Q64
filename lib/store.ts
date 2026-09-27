// Q64 local data layer.
// Everything the player accumulates (profile, rating, finished games, settings,
// puzzle progress) is real data persisted in the browser via localStorage.
// When the online backend is added later, these same shapes map straight onto it.

"use client";

import { useCallback, useEffect, useState } from "react";
import type { Difficulty } from "@/lib/lupus/agent";
import type { BoardTheme } from "@/lib/boardThemes";

export type GameMode = "computer" | "local" | "online" | "lupus";
export type Color = "w" | "b";

export type GameRecord = {
  id: string;
  date: number; // epoch ms
  mode: GameMode;
  difficulty?: Difficulty;
  result: "win" | "loss" | "draw";
  reason: string; // checkmate, resignation, timeout, stalemate, draw...
  playerColor: Color;
  opponent: string;
  moves: number;
  pgn: string;
  ratingBefore: number;
  ratingAfter: number;
};

export type Profile = {
  name: string;
  avatar: string | null; // data URL of the player's chosen photo
  rating: number;
  createdAt: number;
  quote?: string; // the player's own little word/quote, shown on a card while they play
};

export type Settings = {
  sound: boolean;
  showCoordinates: boolean;
  autoRotateLocal: boolean;
  boardTheme: BoardTheme;
};

export type PuzzleProgress = Record<string, { solved: boolean; date: number }>;

const KEYS = {
  profile: "q64.profile",
  history: "q64.history",
  settings: "q64.settings",
  puzzles: "q64.puzzles",
} as const;

export const DEFAULT_PROFILE: Profile = {
  name: "",
  avatar: null,
  rating: 1200,
  createdAt: Date.now(),
};

export const DEFAULT_SETTINGS: Settings = {
  sound: true,
  showCoordinates: true,
  autoRotateLocal: true,
  boardTheme: "classic",
};

// Opponent strength used for rating maths (Elo-style).
export const DIFFICULTY_RATING: Record<Difficulty, number> = {
  casual: 900,
  balanced: 1200,
  challenging: 1550,
  analysis: 1800,
};

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return { ...fallback, ...(JSON.parse(raw) as T) };
  } catch {
    return fallback;
  }
}

function write<T>(key: string, value: T) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* ignore quota / private mode errors */
  }
}

/* ---------------- profile ---------------- */

export function getProfile(): Profile {
  return read<Profile>(KEYS.profile, DEFAULT_PROFILE);
}
export function saveProfile(p: Profile) {
  write(KEYS.profile, p);
}

/* ---------------- history ---------------- */

export function getHistory(): GameRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEYS.history);
    return raw ? (JSON.parse(raw) as GameRecord[]) : [];
  } catch {
    return [];
  }
}

// Compute Elo change for a rated result. Local/online games are unrated (returns 0).
export function ratingDelta(
  playerRating: number,
  opponentRating: number,
  result: "win" | "loss" | "draw"
): number {
  const expected = 1 / (1 + 10 ** ((opponentRating - playerRating) / 400));
  const actual = result === "win" ? 1 : result === "draw" ? 0.5 : 0;
  return Math.round(32 * (actual - expected));
}

// Record a finished game, update rating for rated modes, and return the saved record.
export function recordGame(input: {
  mode: GameMode;
  difficulty?: Difficulty;
  result: "win" | "loss" | "draw";
  reason: string;
  playerColor: Color;
  opponent: string;
  moves: number;
  pgn: string;
}): GameRecord {
  const profile = getProfile();
  const rated = input.mode === "computer" || input.mode === "lupus";
  const oppRating = input.difficulty ? DIFFICULTY_RATING[input.difficulty] : profile.rating;
  const delta = rated ? ratingDelta(profile.rating, oppRating, input.result) : 0;

  const record: GameRecord = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    date: Date.now(),
    ...input,
    ratingBefore: profile.rating,
    ratingAfter: profile.rating + delta,
  };

  if (delta !== 0) {
    saveProfile({ ...profile, rating: profile.rating + delta });
  }

  const history = getHistory();
  history.unshift(record);
  write(KEYS.history, history.slice(0, 200)); // keep last 200
  return record;
}

export function clearHistory() {
  write(KEYS.history, []);
}

// Wipe EVERYTHING (profile, rating, history, career, cups, puzzles, settings) for a fresh start.
export function resetAccount() {
  try {
    const rm: string[] = [];
    for (let i = 0; i < window.localStorage.length; i++) {
      const k = window.localStorage.key(i);
      if (k && k.startsWith("q64.")) rm.push(k);
    }
    rm.forEach((k) => window.localStorage.removeItem(k));
  } catch {}
}

/* ---------------- derived stats ---------------- */

export type Stats = {
  total: number;
  wins: number;
  losses: number;
  draws: number;
  winRate: number; // 0..100
  streak: number; // current, positive = winning streak, negative = losing
  bestStreak: number;
};

export function computeStats(history: GameRecord[]): Stats {
  const rated = history.filter((g) => g.mode === "computer" || g.mode === "lupus");
  const wins = rated.filter((g) => g.result === "win").length;
  const losses = rated.filter((g) => g.result === "loss").length;
  const draws = rated.filter((g) => g.result === "draw").length;
  const total = rated.length;

  // history is newest-first; walk from newest for current streak.
  let streak = 0;
  for (const g of rated) {
    if (g.result === "draw") break;
    const val = g.result === "win" ? 1 : -1;
    if (streak === 0 || Math.sign(streak) === val) streak += val;
    else break;
  }
  // best winning streak across all rated games (oldest-first)
  let best = 0;
  let run = 0;
  for (const g of [...rated].reverse()) {
    if (g.result === "win") {
      run += 1;
      best = Math.max(best, run);
    } else run = 0;
  }

  return {
    total,
    wins,
    losses,
    draws,
    winRate: total ? Math.round((wins / total) * 100) : 0,
    streak,
    bestStreak: best,
  };
}

/* ---------------- settings ---------------- */

export function getSettings(): Settings {
  return read<Settings>(KEYS.settings, DEFAULT_SETTINGS);
}
export function saveSettings(s: Settings) {
  write(KEYS.settings, s);
}

/* ---------------- avatar helper ---------------- */

// Turn an uploaded image file into a small square data URL suitable for storage.
export function fileToAvatar(file: File, size = 256): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("no canvas"));
        // cover-crop to a centered square
        const min = Math.min(img.width, img.height);
        const sx = (img.width - min) / 2;
        const sy = (img.height - min) / 2;
        ctx.drawImage(img, sx, sy, min, min, 0, 0, size, size);
        resolve(canvas.toDataURL("image/jpeg", 0.85));
      };
      img.onerror = reject;
      img.src = reader.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/* ---------------- puzzles ---------------- */

export function getPuzzleProgress(): PuzzleProgress {
  return read<PuzzleProgress>(KEYS.puzzles, {});
}
export function markPuzzleSolved(id: string) {
  const p = getPuzzleProgress();
  p[id] = { solved: true, date: Date.now() };
  write(KEYS.puzzles, p);
}

/* ---------------- react hooks ---------------- */

// Small hook: load once on mount (client only), keep in state.
export function useProfile(): [Profile, (p: Profile) => void] {
  const [profile, setProfile] = useState<Profile>(DEFAULT_PROFILE);
  useEffect(() => setProfile(getProfile()), []);
  const update = useCallback((p: Profile) => {
    setProfile(p);
    saveProfile(p);
  }, []);
  return [profile, update];
}

export function useSettings(): [Settings, (patch: Partial<Settings>) => void] {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  useEffect(() => setSettings(getSettings()), []);
  const update = useCallback((patch: Partial<Settings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      saveSettings(next);
      return next;
    });
  }, []);
  return [settings, update];
}

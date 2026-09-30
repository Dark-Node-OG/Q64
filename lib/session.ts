"use client";

// Keeps a game alive across a browser refresh.
// Before this, refreshing mid-game dumped the player back to the intro/home screen
// because the whole app state lived only in memory. Now the active match (offline OR
// online) is written to localStorage, and app/page.tsx restores it on load.

import type { MatchConfig } from "@/components/play/ModePicker";

const KEY = "q64.session.v1";

// Live snapshot of an offline match so it can be rebuilt exactly.
export type MatchLive = {
  pgn: string;
  whiteMs: number;
  blackMs: number;
  ended: "resign" | "timeout" | null;
};

export type SavedSession =
  | { kind: "match"; config: MatchConfig; live?: MatchLive }
  | { kind: "online"; gameId: string };

export function saveSession(s: SavedSession) {
  try { localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* ignore */ }
}

export function loadSession(): SavedSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as SavedSession) : null;
  } catch {
    return null;
  }
}

export function clearSession() {
  try { localStorage.removeItem(KEY); } catch { /* ignore */ }
}

// Update just the live board snapshot of an in-progress offline match.
export function updateMatchLive(live: MatchLive) {
  const s = loadSession();
  if (s && s.kind === "match") saveSession({ ...s, live });
}

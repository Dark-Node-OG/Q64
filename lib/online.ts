"use client";
// Q64 online: accounts, the who's-online lobby, and room-code multiplayer.
import { supabase } from "./supabaseClient";

export type OnlineUser = { id: string; username: string; rating: number };
export type Game = {
  id: string; code: string;
  host_id: string; guest_id: string | null;
  host_name: string | null; guest_name: string | null;
  host_color: "w" | "b";
  fen: string; moves: string[]; turn: "w" | "b";
  status: "waiting" | "active" | "finished" | "abandoned";
  winner: string | null; minutes: number;
};

const START_FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

export async function currentUser(): Promise<OnlineUser | null> {
  if (!supabase) return null;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: prof } = await supabase.from("profiles").select("id,username,rating").eq("id", user.id).maybeSingle();
  return prof
    ? { id: prof.id, username: prof.username, rating: prof.rating }
    : { id: user.id, username: user.email?.split("@")[0] || "player", rating: 1200 };
}

export async function signUp(email: string, password: string, username: string) {
  if (!supabase) return { ok: false as const, message: "Online is not set up." };
  const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { username } } });
  if (error) return { ok: false as const, message: error.message };
  if (!data.session) return { ok: true as const, needsConfirm: true, message: "Account made. Check your email to confirm it, then sign in." };
  return { ok: true as const, message: "Welcome to Q64 online." };
}
export async function signIn(email: string, password: string) {
  if (!supabase) return { ok: false as const, message: "Online is not set up." };
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  return error ? { ok: false as const, message: error.message } : { ok: true as const, message: "Signed in." };
}
export async function signOut() { await supabase?.auth.signOut(); }

// ---- lobby: who's online (heartbeat via profiles.last_seen) ----
export async function touchOnline() {
  if (!supabase) return;
  const { data: { user } } = await supabase.auth.getUser();
  if (user) await supabase.from("profiles").update({ last_seen: new Date().toISOString() }).eq("id", user.id);
}
export async function onlinePlayers(exceptId?: string): Promise<OnlineUser[]> {
  if (!supabase) return [];
  const since = new Date(Date.now() - 60_000).toISOString(); // active in the last 60s
  const { data } = await supabase.from("profiles").select("id,username,rating,last_seen").gte("last_seen", since).order("last_seen", { ascending: false }).limit(30);
  return (data || []).filter((p) => p.id !== exceptId).map((p) => ({ id: p.id, username: p.username, rating: p.rating }));
}

// ---- rooms ----
function code6() { return Math.random().toString(36).slice(2, 8).toUpperCase(); }

export async function createRoom(hostColor: "w" | "b", minutes: number, hostName: string) {
  if (!supabase) return { ok: false as const, message: "Online is not set up." };
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, message: "Sign in first." };
  const code = code6();
  const { data, error } = await supabase.from("games")
    .insert({ code, host_id: user.id, host_name: hostName, host_color: hostColor, minutes, fen: START_FEN, moves: [], turn: "w", status: "waiting" })
    .select().single();
  if (error) return { ok: false as const, message: error.message };
  return { ok: true as const, game: data as Game };
}

export async function joinRoom(code: string, guestName: string) {
  if (!supabase) return { ok: false as const, message: "Online is not set up." };
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, message: "Sign in first." };
  const { data: game } = await supabase.from("games").select("*").eq("code", code.trim().toUpperCase()).maybeSingle();
  if (!game) return { ok: false as const, message: "No room with that code." };
  if (game.guest_id && game.guest_id !== user.id) return { ok: false as const, message: "That room is already full." };
  if (game.host_id === user.id) return { ok: true as const, game: game as Game }; // rejoin your own room
  const { data, error } = await supabase.from("games")
    .update({ guest_id: user.id, guest_name: guestName, status: "active" })
    .eq("id", game.id).select().single();
  if (error) return { ok: false as const, message: error.message };
  return { ok: true as const, game: data as Game };
}

export async function getGame(id: string): Promise<Game | null> {
  if (!supabase) return null;
  const { data } = await supabase.from("games").select("*").eq("id", id).maybeSingle();
  return (data as Game) || null;
}

// push a move (the mover updates the shared row; the opponent gets it via realtime)
export async function pushMove(id: string, fen: string, moves: string[], turn: "w" | "b", status: Game["status"], winner: string | null) {
  if (!supabase) return;
  await supabase.from("games").update({ fen, moves, turn, status, winner, updated_at: new Date().toISOString() }).eq("id", id);
}

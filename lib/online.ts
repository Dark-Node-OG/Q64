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

// ---- invites (challenge someone from the who's-online list) ----
export type Invite = { id: string; from_id: string; from_name: string | null; to_id: string; game_id: string | null; game_code: string | null; status: string };

export async function sendInvite(toId: string, hostName: string) {
  if (!supabase) return { ok: false as const, message: "Online is not set up." };
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, message: "Sign in first." };
  const room = await createRoom("w", 10, hostName); // I host as White
  if (!room.ok) return room;
  const { error } = await supabase.from("invites").insert({ from_id: user.id, from_name: hostName, to_id: toId, game_id: room.game.id, game_code: room.game.code });
  if (error) return { ok: false as const, message: error.message };
  return { ok: true as const, game: room.game };
}

// ---- ratings + records ----
function eloNext(my: number, opp: number, score: number) { // score: 1 win, 0.5 draw, 0 loss
  const exp = 1 / (1 + Math.pow(10, (opp - my) / 400));
  return Math.max(100, Math.round(my + 32 * (score - exp)));
}
// After an online game, update MY OWN rating (RLS lets each player update only their own).
export async function applyOnlineResult(myRating: number, oppRating: number, score: number): Promise<number> {
  if (!supabase) return myRating;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return myRating;
  const next = eloNext(myRating, oppRating, score);
  await supabase.from("profiles").update({ rating: next }).eq("id", user.id);
  return next;
}
export async function getRating(id: string): Promise<number> {
  if (!supabase) return 1200;
  const { data } = await supabase.from("profiles").select("rating").eq("id", id).maybeSingle();
  return data?.rating ?? 1200;
}
// A player's online record, computed from finished games (winner stores the winner's user id, or "draw").
export async function playerRecord(id: string): Promise<{ wins: number; losses: number; draws: number; games: number }> {
  if (!supabase) return { wins: 0, losses: 0, draws: 0, games: 0 };
  const { data } = await supabase.from("games").select("winner,host_id,guest_id").or(`host_id.eq.${id},guest_id.eq.${id}`).eq("status", "finished");
  let wins = 0, losses = 0, draws = 0;
  for (const g of data || []) {
    if (!g.winner || g.winner === "draw") draws++;
    else if (g.winner === id) wins++;
    else losses++;
  }
  return { wins, losses, draws, games: (data || []).length };
}

export async function respondInvite(inv: Invite, accept: boolean, myName: string) {
  if (!supabase) return { ok: false as const, message: "Online is not set up." };
  await supabase.from("invites").update({ status: accept ? "accepted" : "declined" }).eq("id", inv.id);
  if (!accept) return { ok: false as const, message: "declined" };
  if (!inv.game_code) return { ok: false as const, message: "That room is no longer available." };
  return await joinRoom(inv.game_code, myName);
}

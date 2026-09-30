"use client";
// Q64 online + social: accounts, presence, room-code multiplayer, friends,
// direct messages, in-game chat, a posts feed, notifications and scheduled matches.
import { supabase } from "./supabaseClient";
import { getProfile, saveProfile } from "./store";

export type OnlineUser = {
  id: string;
  username: string;
  rating: number;
  avatar?: string | null;
  quote?: string | null;
  last_seen?: string | null;
};
export type Game = {
  id: string; code: string;
  host_id: string; guest_id: string | null;
  host_name: string | null; guest_name: string | null;
  host_color: "w" | "b";
  fen: string; moves: string[]; turn: "w" | "b";
  status: "waiting" | "active" | "finished" | "abandoned";
  winner: string | null; minutes: number;
  white_ms: number | null; black_ms: number | null;
  updated_at?: string | null;
};

const START_FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

async function uid(): Promise<string | null> {
  if (!supabase) return null;
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id ?? null;
}

export async function currentUser(): Promise<OnlineUser | null> {
  if (!supabase) return null;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: prof } = await supabase.from("profiles").select("id,username,rating,avatar_url,quote").eq("id", user.id).maybeSingle();
  return prof
    ? { id: prof.id, username: prof.username, rating: prof.rating, avatar: prof.avatar_url, quote: prof.quote }
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

// Push my local (offline) profile up so online IS the same one profile: real name,
// photo, quote and rating. The offline account is the single source of identity.
export async function syncMyProfile(p: { username?: string; avatar?: string | null; quote?: string | null; rating?: number }) {
  if (!supabase) return;
  const id = await uid();
  if (!id) return;
  const patch: Record<string, unknown> = { last_seen: new Date().toISOString() };
  if (p.username) patch.username = p.username;
  if (p.avatar !== undefined) patch.avatar_url = p.avatar;
  if (p.quote !== undefined) patch.quote = p.quote;
  if (typeof p.rating === "number") patch.rating = p.rating;
  await supabase.from("profiles").update(patch).eq("id", id);
}

export async function getFullProfile(id: string): Promise<OnlineUser | null> {
  if (!supabase) return null;
  const { data } = await supabase.from("profiles").select("id,username,rating,avatar_url,quote,last_seen").eq("id", id).maybeSingle();
  return data ? { id: data.id, username: data.username, rating: data.rating, avatar: data.avatar_url, quote: data.quote, last_seen: data.last_seen } : null;
}

// ---- lobby: who's online (heartbeat via profiles.last_seen) ----
export async function touchOnline() {
  if (!supabase) return;
  const id = await uid();
  if (id) await supabase.from("profiles").update({ last_seen: new Date().toISOString() }).eq("id", id);
}
export async function onlinePlayers(exceptId?: string): Promise<OnlineUser[]> {
  if (!supabase) return [];
  const since = new Date(Date.now() - 90_000).toISOString(); // active in the last 90s
  const { data } = await supabase.from("profiles").select("id,username,rating,avatar_url,quote,last_seen").gte("last_seen", since).order("last_seen", { ascending: false }).limit(40);
  return (data || []).filter((p) => p.id !== exceptId).map((p) => ({ id: p.id, username: p.username, rating: p.rating, avatar: p.avatar_url, quote: p.quote, last_seen: p.last_seen }));
}

// ---- rooms ----
function code6() { return Math.random().toString(36).slice(2, 8).toUpperCase(); }

export async function createRoom(hostColor: "w" | "b", minutes: number, hostName: string) {
  if (!supabase) return { ok: false as const, message: "Online is not set up." };
  const id = await uid();
  if (!id) return { ok: false as const, message: "Sign in first." };
  const code = code6();
  const ms = minutes * 60_000;
  const { data, error } = await supabase.from("games")
    .insert({ code, host_id: id, host_name: hostName, host_color: hostColor, minutes, fen: START_FEN, moves: [], turn: "w", status: "waiting", white_ms: ms, black_ms: ms })
    .select().single();
  if (error) return { ok: false as const, message: error.message };
  return { ok: true as const, game: data as Game };
}

export async function joinRoom(code: string, guestName: string) {
  if (!supabase) return { ok: false as const, message: "Online is not set up." };
  const id = await uid();
  if (!id) return { ok: false as const, message: "Sign in first." };
  const { data: game } = await supabase.from("games").select("*").eq("code", code.trim().toUpperCase()).maybeSingle();
  if (!game) return { ok: false as const, message: "No room with that code." };
  if (game.guest_id && game.guest_id !== id) return { ok: false as const, message: "That room is already full." };
  if (game.host_id === id) return { ok: true as const, game: game as Game }; // rejoin your own room
  const { data, error } = await supabase.from("games")
    .update({ guest_id: id, guest_name: guestName, status: "active" })
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
export async function pushMove(
  id: string, fen: string, moves: string[], turn: "w" | "b",
  status: Game["status"], winner: string | null,
  whiteMs?: number, blackMs?: number,
) {
  if (!supabase) return;
  const patch: Record<string, unknown> = { fen, moves, turn, status, winner, updated_at: new Date().toISOString() };
  if (whiteMs !== undefined) patch.white_ms = whiteMs;
  if (blackMs !== undefined) patch.black_ms = blackMs;
  await supabase.from("games").update(patch).eq("id", id);
}

// ---- in-game chat (talk to your opponent during the match) ----
export type GameChatMsg = { id: string; game_id: string; from_id: string; from_name: string | null; body: string; created_at: string };
export async function sendGameChat(gameId: string, body: string, fromName: string) {
  if (!supabase) return;
  const id = await uid();
  if (!id) return;
  await supabase.from("game_chat").insert({ game_id: gameId, from_id: id, from_name: fromName, body });
}
export async function getGameChat(gameId: string): Promise<GameChatMsg[]> {
  if (!supabase) return [];
  const { data } = await supabase.from("game_chat").select("*").eq("game_id", gameId).order("created_at", { ascending: true }).limit(200);
  return (data as GameChatMsg[]) || [];
}

// ---- notifications ----
export type Notif = { id: string; user_id: string; type: string; title: string | null; body: string | null; data: Record<string, unknown> | null; read: boolean; created_at: string };
export async function notify(userId: string, type: string, title: string, body: string, data?: Record<string, unknown>) {
  if (!supabase) return;
  await supabase.from("notifications").insert({ user_id: userId, type, title, body, data: data ?? null });
}
export async function listNotifications(): Promise<Notif[]> {
  if (!supabase) return [];
  const { data } = await supabase.from("notifications").select("*").order("created_at", { ascending: false }).limit(40);
  return (data as Notif[]) || [];
}
export async function unreadNotifCount(): Promise<number> {
  if (!supabase) return 0;
  const id = await uid();
  if (!id) return 0;
  const { count } = await supabase.from("notifications").select("*", { count: "exact", head: true }).eq("user_id", id).eq("read", false);
  return count ?? 0;
}
export async function markNotifRead(id: string) { await supabase?.from("notifications").update({ read: true }).eq("id", id); }
export async function markAllNotifRead() {
  const id = await uid();
  if (id) await supabase?.from("notifications").update({ read: true }).eq("user_id", id).eq("read", false);
}

// ---- friends ----
export type FriendStatus = "none" | "pending_out" | "pending_in" | "friends";
export type FriendRow = { id: string; requester_id: string; addressee_id: string; status: string };

export async function friendStatusWith(otherId: string): Promise<{ status: FriendStatus; row?: FriendRow }> {
  if (!supabase) return { status: "none" };
  const me = await uid();
  if (!me) return { status: "none" };
  const { data } = await supabase.from("friendships").select("*")
    .or(`and(requester_id.eq.${me},addressee_id.eq.${otherId}),and(requester_id.eq.${otherId},addressee_id.eq.${me})`)
    .maybeSingle();
  if (!data) return { status: "none" };
  const row = data as FriendRow;
  if (row.status === "accepted") return { status: "friends", row };
  if (row.requester_id === me) return { status: "pending_out", row };
  return { status: "pending_in", row };
}

export async function sendFriendRequest(toId: string, myName: string) {
  if (!supabase) return { ok: false as const, message: "Online is not set up." };
  const me = await uid();
  if (!me) return { ok: false as const, message: "Sign in first." };
  const { error } = await supabase.from("friendships").insert({ requester_id: me, addressee_id: toId, status: "pending" });
  if (error) return { ok: false as const, message: error.message };
  await notify(toId, "friend_request", "New friend request", `${myName} wants to be your friend.`, { from: me, name: myName });
  return { ok: true as const };
}

export async function respondFriendRequest(rowId: string, accept: boolean, myName: string, requesterId: string) {
  if (!supabase) return;
  if (accept) {
    await supabase.from("friendships").update({ status: "accepted" }).eq("id", rowId);
    const me = await uid();
    await notify(requesterId, "friend_accept", "Friend request accepted", `${myName} accepted your friend request.`, { from: me, name: myName });
  } else {
    await supabase.from("friendships").delete().eq("id", rowId);
  }
}

export async function removeFriend(rowId: string) { await supabase?.from("friendships").delete().eq("id", rowId); }

// incoming pending requests (people who want to be my friend)
export async function listFriendRequests(): Promise<{ row: FriendRow; user: OnlineUser | null }[]> {
  if (!supabase) return [];
  const me = await uid();
  if (!me) return [];
  const { data } = await supabase.from("friendships").select("*").eq("addressee_id", me).eq("status", "pending");
  const rows = (data as FriendRow[]) || [];
  const out = await Promise.all(rows.map(async (row) => ({ row, user: await getFullProfile(row.requester_id) })));
  return out;
}

// my accepted friends
export async function listFriends(): Promise<{ row: FriendRow; user: OnlineUser | null }[]> {
  if (!supabase) return [];
  const me = await uid();
  if (!me) return [];
  const { data } = await supabase.from("friendships").select("*")
    .or(`requester_id.eq.${me},addressee_id.eq.${me}`).eq("status", "accepted");
  const rows = (data as FriendRow[]) || [];
  const out = await Promise.all(rows.map(async (row) => {
    const otherId = row.requester_id === me ? row.addressee_id : row.requester_id;
    return { row, user: await getFullProfile(otherId) };
  }));
  return out;
}

// ---- direct messages ----
export type DM = { id: string; from_id: string; to_id: string; body: string; read: boolean; created_at: string };
export async function sendDM(toId: string, body: string, myName: string) {
  if (!supabase) return;
  const me = await uid();
  if (!me) return;
  await supabase.from("dm_messages").insert({ from_id: me, to_id: toId, body });
  await notify(toId, "dm", "New message", `${myName}: ${body.slice(0, 60)}`, { from: me, name: myName });
}
export async function getConversation(otherId: string): Promise<DM[]> {
  if (!supabase) return [];
  const me = await uid();
  if (!me) return [];
  const { data } = await supabase.from("dm_messages").select("*")
    .or(`and(from_id.eq.${me},to_id.eq.${otherId}),and(from_id.eq.${otherId},to_id.eq.${me})`)
    .order("created_at", { ascending: true }).limit(300);
  return (data as DM[]) || [];
}
export async function markConversationRead(otherId: string) {
  const me = await uid();
  if (me) await supabase?.from("dm_messages").update({ read: true }).eq("from_id", otherId).eq("to_id", me).eq("read", false);
}

// ---- posts feed ----
export type Post = { id: string; author_id: string; author_name: string | null; author_avatar: string | null; body: string | null; image_url: string | null; created_at: string };
export type Comment = { id: string; post_id: string; user_id: string; author_name: string | null; author_avatar: string | null; body: string; created_at: string };

export async function createPost(body: string, imageUrl: string | null, me: OnlineUser) {
  if (!supabase) return { ok: false as const, message: "Online is not set up." };
  const id = await uid();
  if (!id) return { ok: false as const, message: "Sign in first." };
  const { error } = await supabase.from("posts").insert({ author_id: id, author_name: me.username, author_avatar: me.avatar ?? null, body: body || null, image_url: imageUrl });
  if (error) return { ok: false as const, message: error.message };
  return { ok: true as const };
}
export async function listPosts(limit = 40): Promise<Post[]> {
  if (!supabase) return [];
  const { data } = await supabase.from("posts").select("*").order("created_at", { ascending: false }).limit(limit);
  return (data as Post[]) || [];
}
export async function listUserPosts(userId: string, limit = 20): Promise<Post[]> {
  if (!supabase) return [];
  const { data } = await supabase.from("posts").select("*").eq("author_id", userId).order("created_at", { ascending: false }).limit(limit);
  return (data as Post[]) || [];
}
export async function deletePost(postId: string) { await supabase?.from("posts").delete().eq("id", postId); }

export async function likeInfo(postId: string): Promise<{ count: number; liked: boolean }> {
  if (!supabase) return { count: 0, liked: false };
  const me = await uid();
  const { data } = await supabase.from("post_likes").select("user_id").eq("post_id", postId);
  const rows = data || [];
  return { count: rows.length, liked: !!me && rows.some((r) => r.user_id === me) };
}
export async function toggleLike(postId: string, authorId: string, myName: string): Promise<boolean> {
  if (!supabase) return false;
  const me = await uid();
  if (!me) return false;
  const { data } = await supabase.from("post_likes").select("id").eq("post_id", postId).eq("user_id", me).maybeSingle();
  if (data) { await supabase.from("post_likes").delete().eq("id", (data as { id: string }).id); return false; }
  await supabase.from("post_likes").insert({ post_id: postId, user_id: me });
  if (authorId !== me) await notify(authorId, "like", "New like", `${myName} liked your post.`, { post: postId });
  return true;
}
export async function listComments(postId: string): Promise<Comment[]> {
  if (!supabase) return [];
  const { data } = await supabase.from("post_comments").select("*").eq("post_id", postId).order("created_at", { ascending: true });
  return (data as Comment[]) || [];
}
export async function addComment(postId: string, body: string, authorId: string, me: OnlineUser) {
  if (!supabase) return;
  const id = await uid();
  if (!id) return;
  await supabase.from("post_comments").insert({ post_id: postId, user_id: id, author_name: me.username, author_avatar: me.avatar ?? null, body });
  if (authorId !== id) await notify(authorId, "comment", "New comment", `${me.username} commented: ${body.slice(0, 50)}`, { post: postId });
}

// ---- invites (challenge someone) ----
export type Invite = { id: string; from_id: string; from_name: string | null; to_id: string; game_id: string | null; game_code: string | null; status: string };

export async function sendInvite(toId: string, hostName: string) {
  if (!supabase) return { ok: false as const, message: "Online is not set up." };
  const me = await uid();
  if (!me) return { ok: false as const, message: "Sign in first." };
  const room = await createRoom("w", 10, hostName); // I host as White
  if (!room.ok) return room;
  const { error } = await supabase.from("invites").insert({ from_id: me, from_name: hostName, to_id: toId, game_id: room.game.id, game_code: room.game.code });
  if (error) return { ok: false as const, message: error.message };
  // also drop a notification so they see it later if they're not on the lobby right now
  await notify(toId, "challenge", "Chess challenge", `${hostName} challenged you to a game.`, { game_id: room.game.id, game_code: room.game.code });
  return { ok: true as const, game: room.game };
}
export async function respondInvite(inv: Invite, accept: boolean, myName: string) {
  if (!supabase) return { ok: false as const, message: "Online is not set up." };
  await supabase.from("invites").update({ status: accept ? "accepted" : "declined" }).eq("id", inv.id);
  if (!accept) return { ok: false as const, message: "declined" };
  if (!inv.game_code) return { ok: false as const, message: "That room is no longer available." };
  return await joinRoom(inv.game_code, myName);
}

// ---- scheduled matches ----
export type Schedule = { id: string; from_id: string; from_name: string | null; to_id: string; to_name: string | null; at: string; minutes: number; color: string; status: string; game_id: string | null; created_at: string };
export async function scheduleMatch(toId: string, toName: string, atISO: string, minutes: number, color: "w" | "b", myName: string) {
  if (!supabase) return { ok: false as const, message: "Online is not set up." };
  const me = await uid();
  if (!me) return { ok: false as const, message: "Sign in first." };
  const { error } = await supabase.from("scheduled_matches").insert({ from_id: me, from_name: myName, to_id: toId, to_name: toName, at: atISO, minutes, color });
  if (error) return { ok: false as const, message: error.message };
  await notify(toId, "schedule", "Match invite", `${myName} wants to schedule a game with you.`, { at: atISO });
  return { ok: true as const };
}
export async function listSchedules(): Promise<Schedule[]> {
  if (!supabase) return [];
  const me = await uid();
  if (!me) return [];
  const { data } = await supabase.from("scheduled_matches").select("*")
    .or(`from_id.eq.${me},to_id.eq.${me}`).order("at", { ascending: true }).limit(40);
  return (data as Schedule[]) || [];
}
export async function respondSchedule(id: string, status: "accepted" | "declined" | "cancelled") {
  await supabase?.from("scheduled_matches").update({ status }).eq("id", id);
}

// ---- ratings + records ----
function eloNext(my: number, opp: number, score: number) {
  const exp = 1 / (1 + Math.pow(10, (opp - my) / 400));
  return Math.max(100, Math.round(my + 32 * (score - exp)));
}
export async function applyOnlineResult(myRating: number, oppRating: number, score: number): Promise<number> {
  if (!supabase) return myRating;
  const id = await uid();
  if (!id) return myRating;
  const next = eloNext(myRating, oppRating, score);
  await supabase.from("profiles").update({ rating: next }).eq("id", id);
  // keep the offline profile's rating the same number — one rating across the whole app
  try { const lp = getProfile(); saveProfile({ ...lp, rating: next }); } catch { /* ignore */ }
  return next;
}
export async function getRating(id: string): Promise<number> {
  if (!supabase) return 1200;
  const { data } = await supabase.from("profiles").select("rating").eq("id", id).maybeSingle();
  return data?.rating ?? 1200;
}
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

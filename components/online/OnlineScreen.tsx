"use client";

// Q64 ONLINE hub: sign in, see who's online, challenge players, add friends and chat with
// them, post to the feed, get notifications, schedule matches, and play live games.

import { useCallback, useEffect, useState } from "react";
import Q64Word from "@/components/ui/Q64Word";
import BottomNav, { type Route } from "@/components/ui/BottomNav";
import { BackIcon, BellIcon } from "@/components/ui/icons";
import { onlineEnabled, supabase } from "@/lib/supabaseClient";
import {
  currentUser, signIn, signUp, signOut, createRoom, joinRoom, touchOnline, onlinePlayers,
  sendInvite, respondInvite, syncMyProfile, listFriends, listFriendRequests, respondFriendRequest,
  listNotifications, unreadNotifCount, markAllNotifRead, listSchedules, respondSchedule,
  type OnlineUser, type Invite, type Notif, type FriendRow, type Schedule,
} from "@/lib/online";
import OnlineMatch from "@/components/online/OnlineMatch";
import PlayerProfile from "@/components/online/PlayerProfile";
import DMChat from "@/components/online/DMChat";
import Feed from "@/components/online/Feed";
import { chessTitle, getProfile } from "@/lib/store";
import { saveSession, clearSession } from "@/lib/session";

type Tab = "play" | "friends" | "feed";
type View = { kind: "lobby" } | { kind: "game"; id: string } | { kind: "profile"; id: string } | { kind: "dm"; user: OnlineUser };

export default function OnlineScreen({ onBack, onNavigate, initialGameId }: { onBack: () => void; onNavigate: (r: Route) => void; initialGameId?: string | null }) {
  const [user, setUser] = useState<OnlineUser | null>(null);
  const [ready, setReady] = useState(false);
  const [view, setView] = useState<View>(initialGameId ? { kind: "game", id: initialGameId } : { kind: "lobby" });
  const [tab, setTab] = useState<Tab>("play");
  const [incoming, setIncoming] = useState<Invite | null>(null);
  const [notifs, setNotifs] = useState<Notif[]>([]);
  const [unread, setUnread] = useState(0);
  const [showNotif, setShowNotif] = useState(false);

  // Load my account and OVERLAY my real offline profile (name, photo, quote, rating) so the
  // online identity IS the one offline profile — then push it up so others see the real me.
  const loadMe = useCallback(async () => {
    const u = await currentUser();
    if (!u) { setUser(null); setReady(true); return; }
    const p = getProfile();
    const merged: OnlineUser = {
      ...u,
      username: p.name || u.username,
      avatar: p.avatar ?? u.avatar ?? null,
      quote: p.quote ?? u.quote ?? null,
      rating: p.rating || u.rating,
    };
    setUser(merged);
    setReady(true);
    syncMyProfile({ username: merged.username, avatar: merged.avatar, quote: merged.quote, rating: merged.rating });
  }, []);
  useEffect(() => { loadMe(); }, [loadMe]);

  // presence heartbeat
  useEffect(() => {
    if (!user) return;
    touchOnline();
    const t = setInterval(touchOnline, 30_000);
    return () => clearInterval(t);
  }, [user]);

  // remember the active online game across a refresh
  useEffect(() => {
    if (view.kind === "game") saveSession({ kind: "online", gameId: view.id });
  }, [view]);

  // notifications poll
  const refreshNotifs = useCallback(() => {
    listNotifications().then(setNotifs);
    unreadNotifCount().then(setUnread);
  }, []);
  useEffect(() => {
    if (!user) return;
    refreshNotifs();
    const t = setInterval(refreshNotifs, 20_000);
    return () => clearInterval(t);
  }, [user, refreshNotifs]);

  // realtime: notifications + challenges
  useEffect(() => {
    if (!user || !supabase) return;
    const sb = supabase;
    const ch = sb.channel(`notif:${user.id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` }, () => refreshNotifs())
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "invites", filter: `to_id=eq.${user.id}` }, (p) => {
        const inv = p.new as Invite;
        if (inv.status === "pending") setIncoming(inv);
      })
      .subscribe();
    return () => { sb.removeChannel(ch); };
  }, [user, refreshNotifs]);

  if (!onlineEnabled) return <Shell onBack={onBack} onNavigate={onNavigate}><Info>Online play is not set up on this build yet.</Info></Shell>;
  if (!ready) return <Shell onBack={onBack} onNavigate={onNavigate}><Info>Loading…</Info></Shell>;
  if (!user) return <Shell onBack={onBack} onNavigate={onNavigate}><AuthForm onAuthed={loadMe} /></Shell>;

  if (view.kind === "game") {
    return <OnlineMatch gameId={view.id} me={user} onExit={() => { clearSession(); setView({ kind: "lobby" }); }} />;
  }
  if (view.kind === "profile") {
    return <PlayerProfile userId={view.id} me={user} onBack={() => setView({ kind: "lobby" })} onEnterGame={(id) => setView({ kind: "game", id })} onMessage={(u) => setView({ kind: "dm", user: u })} />;
  }
  if (view.kind === "dm") {
    return <DMChat me={user} other={view.user} onBack={() => setView({ kind: "lobby" })} />;
  }

  const openGame = (id: string) => setView({ kind: "game", id });
  const openProfile = (id: string) => setView({ kind: "profile", id });

  const onNotifClick = async (n: Notif) => {
    setShowNotif(false);
    await markAllNotifRead();
    setUnread(0);
    const gid = (n.data as { game_id?: string } | null)?.game_id;
    if (n.type === "challenge" && gid) { openGame(gid); return; }
    if (n.type === "friend_request" || n.type === "friend_accept") { setTab("friends"); return; }
    if (n.type === "comment" || n.type === "like") { setTab("feed"); return; }
    if (n.type === "dm") { const from = (n.data as { from?: string } | null)?.from; if (from) openProfile(from); return; }
    if (n.type === "schedule") { setTab("friends"); return; }
  };

  return (
    <Shell onBack={onBack} onNavigate={onNavigate}>
      {/* my bar + notification bell */}
      <div className="glass rounded-2xl p-4 flex items-center justify-between mb-4">
        <button onClick={() => openProfile(user.id)} className="flex items-center gap-3 text-left">
          <div className="h-10 w-10 rounded-xl overflow-hidden bg-gradient-to-br from-electric-500 to-violet-q flex items-center justify-center font-bold text-white">
            {user.avatar ? <img src={user.avatar} alt="" className="h-full w-full object-cover" /> : user.username.slice(0, 1).toUpperCase()}
          </div>
          <div>
            <div className="text-white font-semibold">{user.username}</div>
            <div className="text-[11px] text-slate-400">Rating {user.rating} · online</div>
          </div>
        </button>
        <div className="flex items-center gap-4">
          <div className="relative">
            <button onClick={() => { setShowNotif((v) => !v); if (!showNotif) { markAllNotifRead(); setUnread(0); } }} className="relative text-slate-300 hover:text-white">
              <BellIcon className="w-6 h-6" />
              {unread > 0 && <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full bg-cyan-q text-[10px] text-night-900 font-bold flex items-center justify-center">{unread}</span>}
            </button>
            {showNotif && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setShowNotif(false)} />
                <div className="absolute right-0 mt-2 w-72 z-40 glass-strong rounded-2xl border border-electric-500/30 p-2 animate-fade-up max-h-96 overflow-y-auto no-scrollbar">
                  <div className="px-2 py-1 text-[11px] tracking-wide text-slate-400">NOTIFICATIONS</div>
                  {notifs.length === 0 ? (
                    <div className="px-2 py-3 text-xs text-slate-400">Nothing yet.</div>
                  ) : notifs.map((n) => (
                    <button key={n.id} onClick={() => onNotifClick(n)} className={`w-full text-left rounded-xl px-2 py-2 hover:bg-night-600/60 ${n.read ? "" : "bg-electric-500/5"}`}>
                      <div className="text-[12px] text-white font-medium">{n.title}</div>
                      <div className="text-[11px] text-slate-400">{n.body}</div>
                      <div className="text-[9px] text-slate-600 mt-0.5">{new Date(n.created_at).toLocaleString()}</div>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
          <button onClick={async () => { await signOut(); setUser(null); }} className="text-[12px] text-slate-400 hover:text-white">Sign out</button>
        </div>
      </div>

      {/* tabs */}
      <div className="flex gap-2 mb-4">
        {(["play", "friends", "feed"] as Tab[]).map((tk) => (
          <button key={tk} onClick={() => setTab(tk)} className={`flex-1 rounded-xl py-2.5 text-sm font-semibold capitalize ${tab === tk ? "bg-electric-600/25 border border-electric-500/60 text-white" : "glass text-slate-300"}`}>
            {tk}
          </button>
        ))}
      </div>

      {tab === "play" && <PlayTab user={user} onEnter={openGame} onOpenProfile={openProfile} />}
      {tab === "friends" && <FriendsTab user={user} onOpenProfile={openProfile} onMessage={(u) => setView({ kind: "dm", user: u })} onEnter={openGame} />}
      {tab === "feed" && <Feed me={user} onOpenProfile={openProfile} />}

      {incoming && (
        <InvitePrompt inv={incoming} myName={user.username} onClose={() => setIncoming(null)} onAccepted={(id) => { setIncoming(null); openGame(id); }} />
      )}
    </Shell>
  );
}

/* ---------------- PLAY tab: rooms + who's online ---------------- */

function PlayTab({ user, onEnter, onOpenProfile }: { user: OnlineUser; onEnter: (id: string) => void; onOpenProfile: (id: string) => void }) {
  const [players, setPlayers] = useState<OnlineUser[]>([]);
  const [code, setCode] = useState("");
  const [color, setColor] = useState<"w" | "b">("w");
  const [minutes, setMinutes] = useState(10);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(() => { onlinePlayers(user.id).then(setPlayers); }, [user.id]);
  useEffect(() => { refresh(); const t = setInterval(refresh, 15_000); return () => clearInterval(t); }, [refresh]);

  const host = async () => { setBusy(true); setMsg(""); const r = await createRoom(color, minutes, user.username); setBusy(false); if (r.ok) onEnter(r.game.id); else setMsg(r.message); };
  const join = async () => { if (!code.trim()) return; setBusy(true); setMsg(""); const r = await joinRoom(code, user.username); setBusy(false); if (r.ok) onEnter(r.game.id); else setMsg(r.message); };
  const challenge = async (id: string) => { setBusy(true); setMsg(""); const r = await sendInvite(id, user.username); setBusy(false); if (r.ok && "game" in r) onEnter(r.game.id); else setMsg("message" in r ? r.message : "Could not send."); };

  return (
    <div className="space-y-4">
      <div className="glass-strong rounded-2xl p-4">
        <div className="text-white font-semibold mb-3">Create a room</div>
        <div className="flex gap-2 mb-3">
          {(["w", "b"] as const).map((c) => (
            <button key={c} onClick={() => setColor(c)} className={`flex-1 rounded-lg py-2 text-sm font-semibold ${color === c ? "bg-electric-600/25 border border-electric-500/60 text-white" : "glass text-slate-300"}`}>Play {c === "w" ? "White" : "Black"}</button>
          ))}
        </div>
        <div className="flex gap-2 mb-3">
          {[3, 5, 10].map((m) => <button key={m} onClick={() => setMinutes(m)} className={`flex-1 rounded-lg py-2 text-sm ${minutes === m ? "bg-electric-600/25 border border-electric-500/60 text-white" : "glass text-slate-300"}`}>{m} min</button>)}
        </div>
        <button disabled={busy} onClick={host} className="w-full rounded-xl py-3 font-bold text-white bg-gradient-to-r from-electric-600 to-electric-500 hover:shadow-glow disabled:opacity-60">Create room & get a code</button>
      </div>

      <div className="glass-strong rounded-2xl p-4">
        <div className="text-white font-semibold mb-3">Join with a code</div>
        <div className="flex gap-2">
          <input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="ROOM CODE" className="flex-1 bg-night-600 border border-electric-500/25 rounded-lg px-3 py-2.5 text-white text-sm tracking-widest outline-none focus:border-electric-500" />
          <button disabled={busy} onClick={join} className="rounded-xl px-5 font-bold text-white bg-gradient-to-r from-electric-600 to-electric-500 hover:shadow-glow disabled:opacity-60">Join</button>
        </div>
      </div>

      {msg && <div className="text-[12px] text-amber-300 text-center">{msg}</div>}

      <div className="glass rounded-2xl p-4">
        <div className="text-white font-semibold mb-2">Players online ({players.length})</div>
        {players.length === 0 ? (
          <div className="text-[12px] text-slate-400">No one else is online right now. Create a room and share the code with a friend.</div>
        ) : (
          <div className="space-y-2">
            {players.map((p) => (
              <div key={p.id} className="flex items-center justify-between">
                <button onClick={() => onOpenProfile(p.id)} className="flex items-center gap-3 text-left flex-1">
                  <div className="h-9 w-9 rounded-lg overflow-hidden bg-gradient-to-br from-electric-500 to-violet-q flex items-center justify-center text-sm font-bold text-white relative">
                    {p.avatar ? <img src={p.avatar} alt="" className="h-full w-full object-cover" /> : p.username.slice(0, 1).toUpperCase()}
                    <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-400 ring-2 ring-night-800" />
                  </div>
                  <div>
                    <div className="text-slate-100 text-sm font-medium flex items-center gap-1.5">
                      {p.username}
                      <span className="text-[10px] px-1.5 rounded bg-electric-600/25 border border-electric-500/40 text-white">{chessTitle(p.rating).short}</span>
                    </div>
                    <div className="text-[11px] text-slate-500">Rating {p.rating}</div>
                  </div>
                </button>
                <button disabled={busy} onClick={() => challenge(p.id)} className="rounded-lg px-3 py-1.5 text-[12px] font-semibold text-white bg-electric-600/70 hover:bg-electric-600 disabled:opacity-60">Challenge</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------------- FRIENDS tab: requests, friends, scheduled matches ---------------- */

function FriendsTab({ user, onOpenProfile, onMessage, onEnter }: { user: OnlineUser; onOpenProfile: (id: string) => void; onMessage: (u: OnlineUser) => void; onEnter: (id: string) => void }) {
  const [requests, setRequests] = useState<{ row: FriendRow; user: OnlineUser | null }[]>([]);
  const [friends, setFriends] = useState<{ row: FriendRow; user: OnlineUser | null }[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);

  const load = useCallback(() => {
    listFriendRequests().then(setRequests);
    listFriends().then(setFriends);
    listSchedules().then(setSchedules);
  }, []);
  useEffect(() => { load(); }, [load]);

  const accept = async (row: FriendRow) => { await respondFriendRequest(row.id, true, user.username, row.requester_id); load(); };
  const decline = async (row: FriendRow) => { await respondFriendRequest(row.id, false, user.username, row.requester_id); load(); };

  const startScheduled = async (s: Schedule) => {
    // host creates a room and both jump in
    const r = await createRoom((s.color as "w" | "b") || "w", s.minutes || 10, user.username);
    if (r.ok) { await respondSchedule(s.id, "accepted"); onEnter(r.game.id); }
  };

  const upcoming = schedules.filter((s) => s.status === "pending" || s.status === "accepted");

  return (
    <div className="space-y-4">
      {requests.length > 0 && (
        <div className="glass-strong rounded-2xl p-4">
          <div className="text-white font-semibold mb-2">Friend requests</div>
          <div className="space-y-2">
            {requests.map(({ row, user: ru }) => (
              <div key={row.id} className="flex items-center justify-between">
                <button onClick={() => ru && onOpenProfile(ru.id)} className="flex items-center gap-3 text-left">
                  <div className="h-9 w-9 rounded-lg overflow-hidden bg-gradient-to-br from-electric-500 to-violet-q flex items-center justify-center text-sm font-bold text-white">
                    {ru?.avatar ? <img src={ru.avatar} alt="" className="h-full w-full object-cover" /> : (ru?.username || "?").slice(0, 1).toUpperCase()}
                  </div>
                  <div className="text-slate-100 text-sm">{ru?.username || "Player"}</div>
                </button>
                <div className="flex gap-2">
                  <button onClick={() => accept(row)} className="rounded-lg px-3 py-1.5 text-[12px] font-semibold text-white bg-emerald-600/80">Accept</button>
                  <button onClick={() => decline(row)} className="rounded-lg px-3 py-1.5 text-[12px] text-slate-300 glass">Decline</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {upcoming.length > 0 && (
        <div className="glass-strong rounded-2xl p-4">
          <div className="text-white font-semibold mb-2">Scheduled matches</div>
          <div className="space-y-2">
            {upcoming.map((s) => {
              const mine = s.from_id === user.id;
              const other = mine ? s.to_name : s.from_name;
              return (
                <div key={s.id} className="flex items-center justify-between text-sm">
                  <div>
                    <div className="text-slate-100">vs {other || "Player"}</div>
                    <div className="text-[11px] text-slate-500">{new Date(s.at).toLocaleString()} · {s.minutes} min</div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => startScheduled(s)} className="rounded-lg px-3 py-1.5 text-[12px] font-semibold text-white bg-electric-600/70">Play now</button>
                    <button onClick={async () => { await respondSchedule(s.id, "cancelled"); load(); }} className="rounded-lg px-3 py-1.5 text-[12px] text-slate-300 glass">Cancel</button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="glass rounded-2xl p-4">
        <div className="text-white font-semibold mb-2">Friends ({friends.length})</div>
        {friends.length === 0 ? (
          <div className="text-[12px] text-slate-400">No friends yet. Open a player's profile and tap Add friend.</div>
        ) : (
          <div className="space-y-2">
            {friends.map(({ row, user: fu }) => {
              const online = fu?.last_seen ? Date.now() - new Date(fu.last_seen).getTime() < 90_000 : false;
              return (
                <div key={row.id} className="flex items-center justify-between">
                  <button onClick={() => fu && onOpenProfile(fu.id)} className="flex items-center gap-3 text-left flex-1">
                    <div className="h-9 w-9 rounded-lg overflow-hidden bg-gradient-to-br from-electric-500 to-violet-q flex items-center justify-center text-sm font-bold text-white relative">
                      {fu?.avatar ? <img src={fu.avatar} alt="" className="h-full w-full object-cover" /> : (fu?.username || "?").slice(0, 1).toUpperCase()}
                      <span className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full ring-2 ring-night-800 ${online ? "bg-emerald-400" : "bg-slate-500"}`} />
                    </div>
                    <div>
                      <div className="text-slate-100 text-sm font-medium">{fu?.username || "Player"}</div>
                      <div className="text-[11px] text-slate-500">{online ? "Online" : "Offline"}</div>
                    </div>
                  </button>
                  {fu && <button onClick={() => onMessage(fu)} className="rounded-lg px-3 py-1.5 text-[12px] font-semibold text-white bg-electric-600/70 hover:bg-electric-600">Message</button>}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------------- shared bits ---------------- */

function InvitePrompt({ inv, myName, onClose, onAccepted }: { inv: Invite; myName: string; onClose: () => void; onAccepted: (id: string) => void }) {
  const [busy, setBusy] = useState(false);
  const act = async (accept: boolean) => {
    setBusy(true);
    const r = await respondInvite(inv, accept, myName);
    setBusy(false);
    if (accept && r.ok && "game" in r) onAccepted(r.game.id); else onClose();
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-night-900/85 px-6">
      <div className="w-full max-w-xs glass-strong rounded-2xl p-5 text-center">
        <div className="text-white font-bold text-lg mb-1">Challenge!</div>
        <div className="text-sm text-slate-300 mb-4">{inv.from_name || "A player"} wants to play you.</div>
        <div className="grid grid-cols-2 gap-3">
          <button disabled={busy} onClick={() => act(true)} className="rounded-xl py-3 font-bold text-white bg-gradient-to-r from-electric-600 to-electric-500 disabled:opacity-60">Accept</button>
          <button disabled={busy} onClick={() => act(false)} className="rounded-xl py-3 font-semibold text-slate-200 glass">Decline</button>
        </div>
      </div>
    </div>
  );
}

function Shell({ children, onBack, onNavigate }: { children: React.ReactNode; onBack: () => void; onNavigate: (r: Route) => void }) {
  return (
    <div className="relative min-h-[100dvh] pb-28">
      <div className="absolute inset-0 opacity-30 bg-[url('/bg/home.jpg')] bg-cover bg-center" />
      <div className="absolute inset-0 bg-gradient-to-b from-night-900/90 to-night-900" />
      <div className="relative px-5 pt-6">
        <header className="flex items-center gap-3 mb-5">
          <button onClick={onBack} className="text-slate-300 hover:text-white"><BackIcon /></button>
          <Q64Word size="sm" />
          <span className="text-slate-400 text-sm ml-1">Play Online</span>
        </header>
        {children}
      </div>
      <BottomNav active="home" onNavigate={onNavigate} />
    </div>
  );
}

function Info({ children }: { children: React.ReactNode }) {
  return <div className="glass rounded-2xl p-6 text-center text-slate-300">{children}</div>;
}

function AuthForm({ onAuthed }: { onAuthed: () => void }) {
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setBusy(true); setMsg("");
    const r = mode === "in" ? await signIn(email.trim(), password) : await signUp(email.trim(), password, username.trim() || email.split("@")[0]);
    setBusy(false);
    if (!r.ok) { setMsg(r.message); return; }
    if ("needsConfirm" in r && r.needsConfirm) { setMsg(r.message); setMode("in"); return; }
    onAuthed();
  };

  const input = "w-full bg-night-600 border border-electric-500/25 rounded-lg px-3 py-2.5 text-white text-sm outline-none focus:border-electric-500 mb-3";
  return (
    <div className="glass-strong rounded-2xl p-5">
      <div className="text-white font-bold text-lg mb-1">{mode === "in" ? "Sign in" : "Create your Q64 account"}</div>
      <div className="text-[12px] text-slate-400 mb-4">One account to play real people online.</div>
      {mode === "up" && <input className={input} placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} />}
      <input className={input} type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
      <input className={input} type="password" placeholder="Password (6+ characters)" value={password} onChange={(e) => setPassword(e.target.value)} />
      {msg && <div className="text-[12px] text-amber-300 mb-3">{msg}</div>}
      <button disabled={busy} onClick={submit} className="w-full rounded-xl py-3 font-bold text-white bg-gradient-to-r from-electric-600 to-electric-500 hover:shadow-glow disabled:opacity-60">
        {busy ? "Please wait…" : mode === "in" ? "Sign in" : "Create account"}
      </button>
      <button onClick={() => { setMode(mode === "in" ? "up" : "in"); setMsg(""); }} className="w-full mt-3 text-[12px] text-electric-300">
        {mode === "in" ? "New here? Create an account" : "Already have an account? Sign in"}
      </button>
    </div>
  );
}

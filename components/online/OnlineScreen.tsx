"use client";

// Q64 ONLINE: sign in / create an account, see who's online, and start a room-code game
// with a friend (online or on the same hotspot, over data). Only this part needs a connection.

import { useCallback, useEffect, useState } from "react";
import Q64Word from "@/components/ui/Q64Word";
import BottomNav, { type Route } from "@/components/ui/BottomNav";
import { BackIcon } from "@/components/ui/icons";
import { onlineEnabled, supabase } from "@/lib/supabaseClient";
import {
  currentUser, signIn, signUp, signOut, createRoom, joinRoom,
  touchOnline, onlinePlayers, sendInvite, respondInvite, playerRecord,
  type OnlineUser, type Invite,
} from "@/lib/online";
import OnlineMatch from "@/components/online/OnlineMatch";
import { chessTitle, titleProgress } from "@/lib/store";

export default function OnlineScreen({ onBack, onNavigate }: { onBack: () => void; onNavigate: (r: Route) => void }) {
  const [user, setUser] = useState<OnlineUser | null>(null);
  const [ready, setReady] = useState(false);
  const [gameId, setGameId] = useState<string | null>(null);
  const [incoming, setIncoming] = useState<Invite | null>(null);

  useEffect(() => { currentUser().then((u) => { setUser(u); setReady(true); }); }, []);

  // heartbeat so the player shows as online in the lobby
  useEffect(() => {
    if (!user) return;
    touchOnline();
    const t = setInterval(touchOnline, 30_000);
    return () => clearInterval(t);
  }, [user]);

  // listen for someone challenging me
  useEffect(() => {
    if (!user || !supabase) return;
    const sb = supabase;
    const ch = sb.channel(`invites:${user.id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "invites", filter: `to_id=eq.${user.id}` }, (p) => {
        const inv = p.new as Invite;
        if (inv.status === "pending") setIncoming(inv);
      })
      .subscribe();
    return () => { sb.removeChannel(ch); };
  }, [user]);

  if (!onlineEnabled) {
    return <Shell onBack={onBack} onNavigate={onNavigate}><Info>Online play is not set up on this build yet.</Info></Shell>;
  }
  if (!ready) return <Shell onBack={onBack} onNavigate={onNavigate}><Info>Loading…</Info></Shell>;

  if (gameId && user) {
    return <OnlineMatch gameId={gameId} me={user} onExit={() => setGameId(null)} />;
  }
  if (!user) {
    return <Shell onBack={onBack} onNavigate={onNavigate}><AuthForm onAuthed={() => currentUser().then(setUser)} /></Shell>;
  }
  return (
    <Shell onBack={onBack} onNavigate={onNavigate}>
      <Lobby user={user} onEnter={setGameId} onSignOut={async () => { await signOut(); setUser(null); }} />
      {incoming && (
        <InvitePrompt
          inv={incoming}
          myName={user.username}
          onClose={() => setIncoming(null)}
          onAccepted={(id) => { setIncoming(null); setGameId(id); }}
        />
      )}
    </Shell>
  );
}

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
      {mode === "up" && (
        <input className={input} placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} />
      )}
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

function Lobby({ user, onEnter, onSignOut }: { user: OnlineUser; onEnter: (id: string) => void; onSignOut: () => void }) {
  const [players, setPlayers] = useState<OnlineUser[]>([]);
  const [code, setCode] = useState("");
  const [color, setColor] = useState<"w" | "b">("w");
  const [minutes, setMinutes] = useState(10);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [viewing, setViewing] = useState<OnlineUser | null>(null);

  const refresh = useCallback(() => { onlinePlayers(user.id).then(setPlayers); }, [user.id]);
  useEffect(() => { refresh(); const t = setInterval(refresh, 15_000); return () => clearInterval(t); }, [refresh]);

  const host = async () => {
    setBusy(true); setMsg("");
    const r = await createRoom(color, minutes, user.username);
    setBusy(false);
    if (r.ok) onEnter(r.game.id); else setMsg(r.message);
  };
  const join = async () => {
    if (!code.trim()) return;
    setBusy(true); setMsg("");
    const r = await joinRoom(code, user.username);
    setBusy(false);
    if (r.ok) onEnter(r.game.id); else setMsg(r.message);
  };

  return (
    <div className="space-y-4">
      <div className="glass rounded-2xl p-4 flex items-center justify-between">
        <div>
          <div className="text-white font-semibold">{user.username}</div>
          <div className="text-[11px] text-slate-400">Rating {user.rating} · online</div>
        </div>
        <button onClick={onSignOut} className="text-[12px] text-slate-400 hover:text-white">Sign out</button>
      </div>

      {/* create room */}
      <div className="glass-strong rounded-2xl p-4">
        <div className="text-white font-semibold mb-3">Create a room</div>
        <div className="flex gap-2 mb-3">
          {(["w", "b"] as const).map((c) => (
            <button key={c} onClick={() => setColor(c)} className={`flex-1 rounded-lg py-2 text-sm font-semibold ${color === c ? "bg-electric-600/25 border border-electric-500/60 text-white" : "glass text-slate-300"}`}>
              Play {c === "w" ? "White" : "Black"}
            </button>
          ))}
        </div>
        <div className="flex gap-2 mb-3">
          {[3, 5, 10].map((m) => (
            <button key={m} onClick={() => setMinutes(m)} className={`flex-1 rounded-lg py-2 text-sm ${minutes === m ? "bg-electric-600/25 border border-electric-500/60 text-white" : "glass text-slate-300"}`}>{m} min</button>
          ))}
        </div>
        <button disabled={busy} onClick={host} className="w-full rounded-xl py-3 font-bold text-white bg-gradient-to-r from-electric-600 to-electric-500 hover:shadow-glow disabled:opacity-60">Create room & get a code</button>
      </div>

      {/* join room */}
      <div className="glass-strong rounded-2xl p-4">
        <div className="text-white font-semibold mb-3">Join with a code</div>
        <div className="flex gap-2">
          <input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="ROOM CODE" className="flex-1 bg-night-600 border border-electric-500/25 rounded-lg px-3 py-2.5 text-white text-sm tracking-widest outline-none focus:border-electric-500" />
          <button disabled={busy} onClick={join} className="rounded-xl px-5 font-bold text-white bg-gradient-to-r from-electric-600 to-electric-500 hover:shadow-glow disabled:opacity-60">Join</button>
        </div>
      </div>

      {msg && <div className="text-[12px] text-amber-300 text-center">{msg}</div>}

      {/* who's online */}
      <div className="glass rounded-2xl p-4">
        <div className="text-white font-semibold mb-2">Players online ({players.length})</div>
        {players.length === 0 ? (
          <div className="text-[12px] text-slate-400">No one else is online right now. Create a room and share the code with a friend.</div>
        ) : (
          <div className="space-y-1.5">
            {players.map((p) => (
              <div key={p.id} className="flex items-center justify-between text-sm">
                <button onClick={() => setViewing(p)} className="flex items-center gap-2 text-slate-200 hover:text-white text-left">
                  <span className="h-2 w-2 rounded-full bg-emerald-400" />{p.username}
                  <span className="text-[10px] px-1.5 rounded bg-electric-600/25 border border-electric-500/40 text-white">{chessTitle(p.rating).short}</span>
                </button>
                <button
                  disabled={busy}
                  onClick={async () => { setBusy(true); setMsg(""); const r = await sendInvite(p.id, user.username); setBusy(false); if (r.ok) onEnter(r.game.id); else setMsg(r.message); }}
                  className="rounded-lg px-3 py-1 text-[12px] font-semibold text-white bg-electric-600/70 hover:bg-electric-600 disabled:opacity-60"
                >
                  Challenge
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {viewing && <PlayerCard p={viewing} onClose={() => setViewing(null)} onChallenge={async () => { const r = await sendInvite(viewing.id, user.username); if (r.ok) { setViewing(null); onEnter(r.game.id); } }} />}
    </div>
  );
}

function PlayerCard({ p, onClose, onChallenge }: { p: OnlineUser; onClose: () => void; onChallenge: () => void }) {
  const t = chessTitle(p.rating);
  const prog = titleProgress(p.rating);
  const [rec, setRec] = useState<{ wins: number; losses: number; draws: number; games: number } | null>(null);
  useEffect(() => { playerRecord(p.id).then(setRec); }, [p.id]);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-night-900/85 px-6" onClick={onClose}>
      <div className="w-full max-w-xs glass-strong rounded-2xl p-5" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-3 mb-3">
          <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-electric-500 to-violet-q flex items-center justify-center text-lg font-bold text-white">{p.username.slice(0, 1).toUpperCase()}</div>
          <div>
            <div className="text-white font-bold">{p.username}</div>
            <div className="text-[12px] text-slate-400"><span className="text-white">{t.title}</span> · Rating {p.rating}</div>
          </div>
        </div>
        <div className="text-[11px] text-slate-400 mb-1">{prog.pct}% to {prog.next}</div>
        <div className="h-2 rounded-full bg-night-600 overflow-hidden mb-3"><div className="h-full bg-gradient-to-r from-electric-500 to-cyan-q" style={{ width: `${prog.pct}%` }} /></div>
        <div className="flex justify-around text-center mb-4">
          <div><div className="text-emerald-300 font-bold">{rec ? rec.wins : "—"}</div><div className="text-[10px] text-slate-500">Wins</div></div>
          <div><div className="text-red-300 font-bold">{rec ? rec.losses : "—"}</div><div className="text-[10px] text-slate-500">Losses</div></div>
          <div><div className="text-slate-300 font-bold">{rec ? rec.draws : "—"}</div><div className="text-[10px] text-slate-500">Draws</div></div>
          <div><div className="text-white font-bold">{rec ? rec.games : "—"}</div><div className="text-[10px] text-slate-500">Online games</div></div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <button onClick={onChallenge} className="rounded-xl py-2.5 font-bold text-white bg-gradient-to-r from-electric-600 to-electric-500">Challenge</button>
          <button onClick={onClose} className="rounded-xl py-2.5 font-semibold text-slate-200 glass">Close</button>
        </div>
      </div>
    </div>
  );
}

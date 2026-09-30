"use client";

// The FULL profile page for another online player — the same rich view a player sees of
// themselves, not a tiny card: big photo, title, rating, level bar, online win/loss record,
// their recent posts, and the actions you can take (add friend, message, challenge, schedule).

import { useCallback, useEffect, useState } from "react";
import Q64Word from "@/components/ui/Q64Word";
import { BackIcon } from "@/components/ui/icons";
import { chessTitle, titleProgress, getProfile, getHistory, computeStats, type Stats } from "@/lib/store";
import { achievements, type Achievement } from "@/lib/achievements";
import {
  getFullProfile, playerRecord, friendStatusWith, sendFriendRequest, respondFriendRequest,
  removeFriend, sendInvite, listUserPosts, scheduleMatch,
  type OnlineUser, type FriendStatus, type FriendRow, type Post,
} from "@/lib/online";

type Rec = { wins: number; losses: number; draws: number; games: number };

export default function PlayerProfile({
  userId, me, onBack, onEnterGame, onMessage,
}: {
  userId: string;
  me: OnlineUser;
  onBack: () => void;
  onEnterGame: (id: string) => void;
  onMessage: (u: OnlineUser) => void;
}) {
  const isMe = userId === me.id;
  // My own online profile IS my offline profile — show my real data, never an empty one.
  const localMe = isMe ? getProfile() : null;
  const meAsUser: OnlineUser | null = localMe
    ? { id: me.id, username: localMe.name || me.username, rating: localMe.rating, avatar: localMe.avatar, quote: localMe.quote, last_seen: new Date().toISOString() }
    : null;

  const [u, setU] = useState<OnlineUser | null>(meAsUser);
  const [rec, setRec] = useState<Rec | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [fstatus, setFstatus] = useState<FriendStatus>("none");
  const [frow, setFrow] = useState<FriendRow | undefined>();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [showSchedule, setShowSchedule] = useState(false);
  // offline data (only for my own profile)
  const [stats, setStats] = useState<Stats | null>(null);
  const [badges, setBadges] = useState<Achievement[]>([]);
  const [recentForm, setRecentForm] = useState<{ id: string; result: string; opponent: string }[]>([]);

  const load = useCallback(() => {
    if (isMe) {
      setU(meAsUser); // keep my real offline identity on screen
      const h = getHistory();
      setStats(computeStats(h));
      setBadges(achievements());
      setRecentForm(h.slice(0, 8).map((g) => ({ id: g.id, result: g.result, opponent: g.opponent })));
    } else {
      getFullProfile(userId).then(setU);
      friendStatusWith(userId).then(({ status, row }) => { setFstatus(status); setFrow(row); });
    }
    playerRecord(userId).then(setRec);
    listUserPosts(userId).then(setPosts);
  }, [userId, isMe]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, [load]);

  if (!u) return <Shell onBack={onBack}><div className="glass rounded-2xl p-6 text-center text-slate-300">Loading…</div></Shell>;

  const t = chessTitle(u.rating);
  const prog = titleProgress(u.rating);
  const online = u.last_seen ? Date.now() - new Date(u.last_seen).getTime() < 90_000 : false;

  const addFriend = async () => { setBusy(true); await sendFriendRequest(userId, me.username); setBusy(false); setMsg("Friend request sent."); load(); };
  const accept = async () => { if (!frow) return; setBusy(true); await respondFriendRequest(frow.id, true, me.username, frow.requester_id); setBusy(false); load(); };
  const unfriend = async () => { if (!frow) return; setBusy(true); await removeFriend(frow.id); setBusy(false); load(); };
  const challenge = async () => { setBusy(true); const r = await sendInvite(userId, me.username); setBusy(false); if (r.ok && "game" in r) onEnterGame(r.game.id); else setMsg("message" in r ? r.message : "Could not send."); };

  return (
    <Shell onBack={onBack}>
      {/* identity */}
      <section className="glass-strong edge-glow rounded-2xl p-5 flex items-center gap-4">
        <div className="h-16 w-16 rounded-2xl overflow-hidden bg-gradient-to-br from-electric-500 to-violet-q flex items-center justify-center text-2xl font-bold text-white shadow-glow">
          {u.avatar ? <img src={u.avatar} alt="" className="h-full w-full object-cover" /> : u.username.slice(0, 1).toUpperCase()}
        </div>
        <div className="flex-1">
          <div className="text-xl font-bold text-white">{u.username}</div>
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <span className="rounded-md bg-electric-600/25 border border-electric-500/50 px-2 py-0.5 text-[11px] font-bold text-white">{t.short}</span>
            <span className="text-white font-semibold">{t.title}</span>
            <span>· <span className="text-cyan-q font-semibold tabular-nums">{u.rating}</span></span>
          </div>
          <div className="text-[11px] mt-0.5 flex items-center gap-1.5">
            <span className={`h-2 w-2 rounded-full ${online ? "bg-emerald-400" : "bg-slate-500"}`} />
            <span className="text-slate-400">{online ? "Online now" : "Offline"}</span>
          </div>
        </div>
      </section>

      {u.quote && (
        <div className="mt-3 rounded-2xl glass border border-violet-q/30 px-4 py-3">
          <div className="text-sm italic text-slate-200">&ldquo;{u.quote}&rdquo;</div>
        </div>
      )}

      {/* level */}
      <section className="mt-3 glass rounded-2xl p-3">
        <div className="flex items-center justify-between mb-1.5 text-[12px]">
          <span className="text-slate-300">Level</span>
          <span className="text-slate-400">{prog.pct}% to {prog.next}</span>
        </div>
        <div className="h-2 rounded-full bg-night-600 overflow-hidden">
          <div className="h-full bg-gradient-to-r from-electric-500 to-cyan-q" style={{ width: `${prog.pct}%` }} />
        </div>
      </section>

      {/* online record */}
      <section className="mt-4 grid grid-cols-4 gap-2 text-center">
        <Stat label="Wins" value={rec ? rec.wins : "—"} tone="text-emerald-300" />
        <Stat label="Losses" value={rec ? rec.losses : "—"} tone="text-red-300" />
        <Stat label="Draws" value={rec ? rec.draws : "—"} tone="text-slate-200" />
        <Stat label="Games" value={rec ? rec.games : "—"} tone="text-white" />
      </section>

      {/* actions (only on OTHER players' profiles) */}
      {!isMe && (
        <>
          <section className="mt-4 grid grid-cols-2 gap-2">
            <button onClick={challenge} disabled={busy} className="rounded-xl py-3 font-bold text-white bg-gradient-to-r from-electric-600 to-electric-500 disabled:opacity-60">Challenge</button>
            {fstatus === "friends" ? (
              <button onClick={() => onMessage(u)} className="rounded-xl py-3 font-semibold text-white glass border border-electric-500/40">Message</button>
            ) : fstatus === "pending_in" ? (
              <button onClick={accept} disabled={busy} className="rounded-xl py-3 font-bold text-white bg-emerald-600/80 disabled:opacity-60">Accept friend</button>
            ) : fstatus === "pending_out" ? (
              <button disabled className="rounded-xl py-3 font-semibold text-slate-400 glass">Request sent</button>
            ) : (
              <button onClick={addFriend} disabled={busy} className="rounded-xl py-3 font-semibold text-white glass border border-electric-500/40 disabled:opacity-60">Add friend</button>
            )}
            <button onClick={() => setShowSchedule(true)} className="rounded-xl py-2.5 text-sm font-semibold text-slate-200 glass">Schedule a match</button>
            {fstatus === "friends" && <button onClick={unfriend} disabled={busy} className="rounded-xl py-2.5 text-sm text-slate-400 glass">Remove friend</button>}
          </section>
          {msg && <div className="mt-2 text-center text-[12px] text-electric-300">{msg}</div>}
        </>
      )}
      {isMe && <div className="mt-3 text-center text-[12px] text-slate-400">This is your public profile — other players see this.</div>}

      {/* my full offline record: stats, achievements, recent form */}
      {isMe && (
        <>
          <section className="mt-5 grid grid-cols-3 gap-2 text-center">
            <Stat label="Games" value={stats ? stats.total : "—"} tone="text-white" />
            <Stat label="Win rate" value={stats ? `${stats.winRate}%` : "—"} tone="text-cyan-q" />
            <Stat label="Best streak" value={stats ? stats.bestStreak : "—"} tone="text-white" />
          </section>

          <section className="mt-5">
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs tracking-[0.3em] text-slate-400">ACHIEVEMENTS</div>
              <div className="text-[11px] text-slate-500">{badges.filter((b) => b.unlocked).length}/{badges.length}</div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {badges.map((b) => (
                <div key={b.id} title={b.desc} className={`glass rounded-xl p-2.5 text-center ${b.unlocked ? "border border-electric-500/40" : "opacity-45"}`}>
                  <div className="text-2xl leading-none mb-1">{b.icon}</div>
                  <div className="text-[11px] font-semibold text-white leading-tight">{b.name}</div>
                </div>
              ))}
            </div>
          </section>

          <section className="mt-5">
            <div className="text-xs tracking-[0.3em] text-slate-400 mb-2">RECENT FORM</div>
            {recentForm.length === 0 ? (
              <div className="glass rounded-xl p-4 text-sm text-slate-400 text-center">No games yet.</div>
            ) : (
              <div className="flex gap-1.5">
                {recentForm.map((g) => (
                  <span key={g.id} title={`${g.result} vs ${g.opponent}`}
                    className={`h-8 w-8 rounded-lg grid place-items-center text-xs font-bold
                      ${g.result === "win" ? "bg-emerald-500/25 text-emerald-300 border border-emerald-400/40"
                        : g.result === "loss" ? "bg-red-500/20 text-red-300 border border-red-400/40"
                        : "bg-slate-500/20 text-slate-300 border border-slate-400/40"}`}>
                    {g.result === "win" ? "W" : g.result === "loss" ? "L" : "D"}
                  </span>
                ))}
              </div>
            )}
          </section>
        </>
      )}

      {/* recent posts */}
      <section className="mt-5">
        <div className="text-xs tracking-[0.3em] text-slate-400 mb-2">RECENT POSTS</div>
        {posts.length === 0 ? (
          <div className="glass rounded-xl p-4 text-sm text-slate-400 text-center">No posts yet.</div>
        ) : (
          <div className="space-y-3">
            {posts.map((p) => (
              <div key={p.id} className="glass rounded-2xl p-3">
                {p.body && <div className="text-sm text-slate-100 whitespace-pre-wrap mb-2">{p.body}</div>}
                {p.image_url && <img src={p.image_url} alt="" className="rounded-xl w-full object-cover max-h-72" />}
                <div className="text-[10px] text-slate-500 mt-1">{new Date(p.created_at).toLocaleString()}</div>
              </div>
            ))}
          </div>
        )}
      </section>

      {showSchedule && <ScheduleModal me={me} target={u} onClose={() => setShowSchedule(false)} onDone={() => { setShowSchedule(false); setMsg("Match invite sent."); }} />}
    </Shell>
  );
}

function ScheduleModal({ me, target, onClose, onDone }: { me: OnlineUser; target: OnlineUser; onClose: () => void; onDone: () => void }) {
  const [when, setWhen] = useState("");
  const [minutes, setMinutes] = useState(10);
  const [color, setColor] = useState<"w" | "b">("w");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const submit = async () => {
    if (!when) { setErr("Pick a date and time."); return; }
    setBusy(true); setErr("");
    const r = await scheduleMatch(target.id, target.username, new Date(when).toISOString(), minutes, color, me.username);
    setBusy(false);
    if (r.ok) onDone(); else setErr("message" in r ? r.message : "Could not schedule.");
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-night-900/85 px-6" onClick={onClose}>
      <div className="w-full max-w-xs glass-strong rounded-2xl p-5" onClick={(e) => e.stopPropagation()}>
        <div className="text-white font-bold text-lg mb-3">Schedule vs {target.username}</div>
        <label className="text-[12px] text-slate-400">Date & time</label>
        <input type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} className="w-full bg-night-600 border border-electric-500/25 rounded-lg px-3 py-2 text-white text-sm mb-3 mt-1 outline-none" />
        <label className="text-[12px] text-slate-400">Minutes each</label>
        <div className="flex gap-2 my-1 mb-3">
          {[3, 5, 10].map((m) => <button key={m} onClick={() => setMinutes(m)} className={`flex-1 rounded-lg py-2 text-sm ${minutes === m ? "bg-electric-600/25 border border-electric-500/60 text-white" : "glass text-slate-300"}`}>{m}</button>)}
        </div>
        <label className="text-[12px] text-slate-400">You play</label>
        <div className="flex gap-2 my-1 mb-4">
          {(["w", "b"] as const).map((c) => <button key={c} onClick={() => setColor(c)} className={`flex-1 rounded-lg py-2 text-sm ${color === c ? "bg-electric-600/25 border border-electric-500/60 text-white" : "glass text-slate-300"}`}>{c === "w" ? "White" : "Black"}</button>)}
        </div>
        {err && <div className="text-[12px] text-amber-300 mb-2">{err}</div>}
        <div className="grid grid-cols-2 gap-3">
          <button onClick={submit} disabled={busy} className="rounded-xl py-2.5 font-bold text-white bg-gradient-to-r from-electric-600 to-electric-500 disabled:opacity-60">Send invite</button>
          <button onClick={onClose} className="rounded-xl py-2.5 font-semibold text-slate-200 glass">Cancel</button>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: number | string; tone: string }) {
  return (
    <div className="glass rounded-xl py-3">
      <div className={`text-xl font-bold ${tone}`}>{value}</div>
      <div className="text-[10px] text-slate-500 mt-0.5">{label}</div>
    </div>
  );
}

function Shell({ children, onBack }: { children: React.ReactNode; onBack: () => void }) {
  return (
    <div className="relative min-h-[100dvh] pb-16">
      <div className="absolute inset-0 opacity-30 bg-[url('/bg/home.jpg')] bg-cover bg-center" />
      <div className="absolute inset-0 bg-gradient-to-b from-night-900/90 to-night-900" />
      <div className="relative px-5 pt-6">
        <header className="flex items-center gap-3 mb-5">
          <button onClick={onBack} className="text-slate-300 hover:text-white"><BackIcon /></button>
          <Q64Word size="sm" />
          <span className="text-slate-400 text-sm ml-1">Player</span>
        </header>
        {children}
      </div>
    </div>
  );
}

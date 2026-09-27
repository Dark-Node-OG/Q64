"use client";

import { useEffect, useRef, useState } from "react";
import Q64Word from "@/components/ui/Q64Word";
import BottomNav, { type Route } from "@/components/ui/BottomNav";
import { BackIcon, WolfIcon } from "@/components/ui/icons";
import { useProfile, getHistory, computeStats, fileToAvatar, chessTitle, titleProgress, type GameRecord, type Stats } from "@/lib/store";
import { achievements, type Achievement } from "@/lib/achievements";

export default function ProfileScreen({ onBack, onNavigate }: { onBack: () => void; onNavigate: (r: Route) => void }) {
  const [profile, setProfile] = useProfile();
  const [history, setHistory] = useState<GameRecord[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [badges, setBadges] = useState<Achievement[]>([]);
  const [editing, setEditing] = useState(false);
  const [nameDraft, setNameDraft] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  async function pickPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) setProfile({ ...profile, avatar: await fileToAvatar(f) });
  }

  useEffect(() => {
    const h = getHistory();
    setHistory(h);
    setStats(computeStats(h));
    setBadges(achievements());
  }, []);

  const recent = history.slice(0, 8);

  return (
    <div className="relative min-h-[100dvh] pb-28">
      <div className="absolute inset-0 opacity-30 bg-[url('/bg/home.jpg')] bg-cover bg-center" />
      <div className="absolute inset-0 bg-gradient-to-b from-night-900/90 to-night-900" />

      <div className="relative px-5 pt-6">
        <header className="flex items-center gap-3 mb-6">
          <button onClick={onBack} className="text-slate-300 hover:text-white"><BackIcon /></button>
          <Q64Word size="sm" />
          <span className="text-slate-400 text-sm ml-1">Profile</span>
        </header>

        {/* identity card */}
        <section className="glass-strong edge-glow rounded-2xl p-5 flex items-center gap-4">
          <button
            onClick={() => fileRef.current?.click()}
            className="relative h-16 w-16 rounded-2xl overflow-hidden bg-gradient-to-br from-electric-500 to-violet-q flex items-center justify-center text-2xl font-bold text-white shadow-glow"
          >
            {profile.avatar ? <img src={profile.avatar} alt="" className="h-full w-full object-cover" /> : (profile.name.slice(0, 1) || "?")}
            <span className="absolute bottom-0 inset-x-0 bg-black/50 text-[8px] py-0.5 text-center">edit</span>
          </button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={pickPhoto} />
          <div className="flex-1">
            {editing ? (
              <div className="flex gap-2">
                <input
                  autoFocus
                  value={nameDraft}
                  onChange={(e) => setNameDraft(e.target.value)}
                  className="flex-1 bg-night-600 border border-electric-500/30 rounded-lg px-2 py-1 text-white text-sm outline-none"
                />
                <button
                  onClick={() => { setProfile({ ...profile, name: nameDraft.trim() || profile.name }); setEditing(false); }}
                  className="text-xs px-3 rounded-lg bg-electric-600 text-white"
                >Save</button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <div className="text-xl font-bold text-white">{profile.name}</div>
                <button onClick={() => { setNameDraft(profile.name); setEditing(true); }} className="text-[11px] text-electric-300">edit</button>
              </div>
            )}
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <span className="rounded-md bg-electric-600/25 border border-electric-500/50 px-2 py-0.5 text-[11px] font-bold text-white">{chessTitle(profile.rating).short}</span>
              <span className="text-white font-semibold">{chessTitle(profile.rating).title}</span>
              <span>· Rating <span className="text-cyan-q font-semibold tabular-nums">{profile.rating}</span></span>
            </div>
          </div>
        </section>

        {/* level progress toward the next title */}
        <section className="mt-3 glass rounded-2xl p-3">
          <div className="flex items-center justify-between mb-1.5 text-[12px]">
            <span className="text-slate-300">Level</span>
            <span className="text-slate-400">{titleProgress(profile.rating).pct}% to {titleProgress(profile.rating).next}</span>
          </div>
          <div className="h-2 rounded-full bg-night-600 overflow-hidden">
            <div className="h-full bg-gradient-to-r from-electric-500 to-cyan-q transition-all" style={{ width: `${titleProgress(profile.rating).pct}%` }} />
          </div>
        </section>

        {/* stats grid */}
        <section className="mt-4 grid grid-cols-2 gap-3">
          <StatCard label="Games" value={stats ? String(stats.total) : "—"} />
          <StatCard label="Win rate" value={stats ? `${stats.winRate}%` : "—"} accent />
          <StatCard label="Wins" value={stats ? String(stats.wins) : "—"} />
          <StatCard label="Losses" value={stats ? String(stats.losses) : "—"} />
          <StatCard label="Draws" value={stats ? String(stats.draws) : "—"} />
          <StatCard label="Best streak" value={stats ? `${stats.bestStreak}` : "—"} />
        </section>

        {/* achievements */}
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
                <div className="text-[9px] text-slate-400 leading-tight mt-0.5">{b.unlocked ? "Unlocked" : b.desc}</div>
              </div>
            ))}
          </div>
        </section>

        {/* recent form */}
        <section className="mt-5">
          <div className="text-xs tracking-[0.3em] text-slate-400 mb-2">RECENT FORM</div>
          {recent.length === 0 ? (
            <div className="glass rounded-xl p-4 text-sm text-slate-400 text-center">
              No games yet. Play a match and your results will appear here.
            </div>
          ) : (
            <div className="flex gap-1.5">
              {recent.map((g) => (
                <span
                  key={g.id}
                  title={`${g.result} vs ${g.opponent}`}
                  className={`h-8 w-8 rounded-lg grid place-items-center text-xs font-bold
                    ${g.result === "win" ? "bg-emerald-500/25 text-emerald-300 border border-emerald-400/40"
                      : g.result === "loss" ? "bg-red-500/20 text-red-300 border border-red-400/40"
                      : "bg-slate-500/20 text-slate-300 border border-slate-400/40"}`}
                >
                  {g.result === "win" ? "W" : g.result === "loss" ? "L" : "D"}
                </span>
              ))}
            </div>
          )}
        </section>

        <button
          onClick={() => onNavigate("history")}
          className="mt-5 w-full glass rounded-xl py-3 text-sm text-slate-200 flex items-center justify-center gap-2 hover:border-electric-500/50"
        >
          <WolfIcon className="w-4 h-4 text-cyan-q" /> View full game history
        </button>
      </div>

      <BottomNav active="profile" onNavigate={onNavigate} />
    </div>
  );
}

function StatCard({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className={`glass rounded-xl p-4 ${accent ? "border border-electric-500/40" : ""}`}>
      <div className={`text-2xl font-bold tabular-nums ${accent ? "text-cyan-q" : "text-white"}`}>{value}</div>
      <div className="text-[11px] text-slate-400 mt-1">{label}</div>
    </div>
  );
}

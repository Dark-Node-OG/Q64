"use client";

import { useState } from "react";
import Q64Word from "@/components/ui/Q64Word";
import BottomNav, { type Route } from "@/components/ui/BottomNav";
import { BackIcon } from "@/components/ui/icons";
import { useSettings, useProfile, clearHistory, resetAccount } from "@/lib/store";
import MiniBoard from "@/components/chess/MiniBoard";
import { BOARD_THEMES, THEME_KEYS } from "@/lib/boardThemes";

const PREVIEW_FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

export default function SettingsScreen({ onBack, onNavigate }: { onBack: () => void; onNavigate: (r: Route) => void }) {
  const [settings, setSettings] = useSettings();
  const [profile, setProfile] = useProfile();
  const [cleared, setCleared] = useState(false);

  return (
    <div className="relative min-h-[100dvh] pb-28">
      <div className="absolute inset-0 opacity-30 bg-[url('/bg/home.jpg')] bg-cover bg-center" />
      <div className="absolute inset-0 bg-gradient-to-b from-night-900/90 to-night-900" />

      <div className="relative px-5 pt-6">
        <header className="flex items-center gap-3 mb-6">
          <button onClick={onBack} className="text-slate-300 hover:text-white"><BackIcon /></button>
          <Q64Word size="sm" />
          <span className="text-slate-400 text-sm ml-1">Settings</span>
        </header>

        <Section title="Board Theme">
          {/* live preview of the chosen theme */}
          <div className="py-3 flex gap-4 items-center">
            <div className="w-40 shrink-0">
              <MiniBoard fen={PREVIEW_FEN} theme={settings.boardTheme} />
            </div>
            <div>
              <div className="text-white font-semibold">{BOARD_THEMES[settings.boardTheme].name}</div>
              <div className="text-[11px] text-slate-400 mt-0.5">Live preview — your choice is saved automatically.</div>
            </div>
          </div>

          {/* selectable theme swatches */}
          <div className="py-3 grid grid-cols-4 gap-2">
            {THEME_KEYS.map((th) => {
              const def = BOARD_THEMES[th];
              const active = settings.boardTheme === th;
              return (
                <button
                  key={th}
                  onClick={() => setSettings({ boardTheme: th })}
                  className={`rounded-xl p-1.5 transition ${active ? "ring-2 ring-electric-500 bg-electric-600/20" : "bg-night-600/60 hover:bg-night-500/60"}`}
                  title={def.name}
                >
                  <div className="rounded-md overflow-hidden grid grid-cols-2 h-8 w-full" style={{ background: def.frame }}>
                    <span style={{ background: def.light }} />
                    <span style={{ background: def.dark }} />
                    <span style={{ background: def.dark }} />
                    <span style={{ background: def.light }} />
                  </div>
                  <div className="text-[9px] text-slate-300 mt-1 truncate text-center">{def.name}</div>
                </button>
              );
            })}
          </div>
          <Toggle label="Show coordinates" desc="File and rank labels on the board" value={settings.showCoordinates} onChange={(v) => setSettings({ showCoordinates: v })} />
        </Section>

        <Section title="Gameplay">
          <Toggle label="Sound effects" desc="Move and capture sounds" value={settings.sound} onChange={(v) => setSettings({ sound: v })} />
          <Toggle label="Auto-rotate in local games" desc="Turn the board to the player to move" value={settings.autoRotateLocal} onChange={(v) => setSettings({ autoRotateLocal: v })} />
        </Section>

        <Section title="Account">
          <div className="py-3">
            <div className="text-sm text-slate-200 mb-2">Display name</div>
            <input
              value={profile.name}
              onChange={(e) => setProfile({ ...profile, name: e.target.value })}
              className="w-full bg-night-600 border border-electric-500/25 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-electric-500"
            />
          </div>
          <div className="py-3">
            <div className="text-sm text-slate-200 mb-2">My quote</div>
            <div className="text-[11px] text-slate-400 mb-2">A little word that shows on your card while you play — just like the champions.</div>
            <input
              value={profile.quote ?? ""}
              maxLength={90}
              placeholder="e.g. I don't lose, I learn."
              onChange={(e) => setProfile({ ...profile, quote: e.target.value })}
              className="w-full bg-night-600 border border-electric-500/25 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-electric-500"
            />
          </div>
          <button
            onClick={() => { clearHistory(); setCleared(true); setTimeout(() => setCleared(false), 1500); }}
            className="w-full text-left text-sm text-red-300/90 hover:text-red-300 py-3"
          >
            {cleared ? "Game history cleared ✓" : "Clear game history"}
          </button>
          <button
            onClick={() => {
              if (confirm("Reset your whole account? This wipes your profile, rating, history, career and cups for a fresh start.")) {
                resetAccount();
                window.location.reload();
              }
            }}
            className="w-full text-left text-sm text-red-400 hover:text-red-300 py-3 border-t border-red-500/15"
          >
            Reset account (fresh start)
          </button>
        </Section>

        <div className="text-center text-[11px] text-slate-500 mt-4">Q64 · Dark Node Game Studio</div>
      </div>

      <BottomNav active="settings" onNavigate={onNavigate} />
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="glass rounded-2xl p-4 mb-4">
      <div className="text-xs tracking-[0.3em] text-slate-400 mb-1">{title.toUpperCase()}</div>
      <div className="divide-y divide-white/5">{children}</div>
    </section>
  );
}

function Toggle({ label, desc, value, onChange }: { label: string; desc?: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button onClick={() => onChange(!value)} className="w-full flex items-center justify-between py-3 text-left">
      <span className="flex-1 pr-3">
        <span className="block text-sm text-slate-200">{label}</span>
        {desc && <span className="block text-[11px] text-slate-400">{desc}</span>}
      </span>
      <span className={`h-6 w-11 shrink-0 rounded-full p-0.5 transition ${value ? "bg-electric-500" : "bg-night-500"}`}>
        <span className={`block h-5 w-5 rounded-full bg-white transition ${value ? "translate-x-5" : ""}`} />
      </span>
    </button>
  );
}

"use client";

import { useEffect, useState } from "react";
import DarkNodeIntro from "@/components/boot/DarkNodeIntro";
import LoadingScreen from "@/components/boot/LoadingScreen";
import CreateProfileScreen from "@/components/profile/CreateProfileScreen";
import HomeScreen from "@/components/home/HomeScreen";
import ModePicker, { type MatchConfig } from "@/components/play/ModePicker";
import MatchScreen from "@/components/match/MatchScreen";
import ProfileScreen from "@/components/pages/ProfileScreen";
import HistoryScreen from "@/components/pages/HistoryScreen";
import PuzzlesScreen from "@/components/pages/PuzzlesScreen";
import LearnScreen from "@/components/pages/LearnScreen";
import SettingsScreen from "@/components/pages/SettingsScreen";
import CareerScreen from "@/components/pages/CareerScreen";
import TournamentsScreen from "@/components/pages/TournamentsScreen";
import OnlineScreen from "@/components/online/OnlineScreen";
import type { Route } from "@/components/ui/BottomNav";
import { getProfile } from "@/lib/store";
import { loadSession, saveSession, clearSession, type MatchLive } from "@/lib/session";

type Stage = "intro" | "loading" | "createProfile" | Route;

export default function Page() {
  const [stage, setStage] = useState<Stage>("intro");
  const [config, setConfig] = useState<MatchConfig | null>(null);
  const [matchKey, setMatchKey] = useState(0); // bump to restart a match cleanly (no full reload)
  const [resumeLive, setResumeLive] = useState<MatchLive | undefined>(undefined);
  const [initialGameId, setInitialGameId] = useState<string | null>(null);
  const [player, setPlayer] = useState({ name: "Player", avatar: null as string | null, rating: 1200 });

  // On load, resume an in-progress game if there is one (survives a page refresh).
  useEffect(() => {
    const s = loadSession();
    if (!s) return;
    if (s.kind === "match") { setConfig(s.config); setResumeLive(s.live); setStage("match"); }
    else if (s.kind === "online") { setInitialGameId(s.gameId); setStage("online"); }
  }, []);

  // refresh the cached player details from storage whenever we land on a screen
  useEffect(() => {
    const p = getProfile();
    setPlayer({ name: p.name || "Player", avatar: p.avatar, rating: p.rating });
  }, [stage]);

  // after loading, send first-time players to profile creation
  const afterLoading = () => setStage(getProfile().name ? "home" : "createProfile");

  // start a fresh offline match and remember it so a refresh won't drop out
  const startMatch = (c: MatchConfig) => {
    setResumeLive(undefined);
    setConfig(c);
    saveSession({ kind: "match", config: c });
    setStage("match");
  };
  const leaveMatch = (to: Stage) => { clearSession(); setStage(to); };

  return (
    <main className="q64-frame">
      {stage === "intro" && <DarkNodeIntro onDone={() => setStage("loading")} />}
      {stage === "loading" && <LoadingScreen onDone={afterLoading} />}
      {stage === "createProfile" && <CreateProfileScreen onDone={() => setStage("home")} />}

      {stage === "home" && <HomeScreen player={player} onNavigate={setStage} />}

      {stage === "play" && (
        <ModePicker
          onStart={(c) => { if (c.mode === "online") { setStage("online"); } else { startMatch(c); } }}
          onBack={() => setStage("home")}
        />
      )}

      {stage === "online" && <OnlineScreen onBack={() => leaveMatch("home")} onNavigate={(r) => leaveMatch(r)} initialGameId={initialGameId} />}

      {stage === "career" && (
        <CareerScreen
          onBack={() => setStage("home")}
          onNavigate={setStage}
          onPlay={(lg) => startMatch({ mode: "computer", difficulty: lg.difficulty, playerColor: "w", opponent: lg })}
        />
      )}

      {stage === "tournaments" && (
        <TournamentsScreen
          onBack={() => setStage("home")}
          onNavigate={setStage}
          onPlay={(lg, cupId) => startMatch({ mode: "computer", difficulty: lg.difficulty, playerColor: "w", opponent: lg, tournament: { cupId } })}
        />
      )}

      {stage === "match" && config && (
        <MatchScreen
          key={matchKey}
          player={player}
          config={config}
          resume={resumeLive}
          onExit={() => leaveMatch(config.tournament ? "tournaments" : config.opponent ? "career" : "home")}
          onHome={() => leaveMatch("home")}
          onRematch={() => { setResumeLive(undefined); saveSession({ kind: "match", config }); setMatchKey((k) => k + 1); }}
        />
      )}

      {stage === "puzzles" && <PuzzlesScreen onBack={() => setStage("home")} onNavigate={setStage} />}
      {stage === "learn" && <LearnScreen onBack={() => setStage("home")} onNavigate={setStage} />}
      {stage === "history" && <HistoryScreen onBack={() => setStage("home")} onNavigate={setStage} />}
      {stage === "profile" && <ProfileScreen onBack={() => setStage("home")} onNavigate={setStage} />}
      {stage === "settings" && <SettingsScreen onBack={() => setStage("home")} onNavigate={setStage} />}
    </main>
  );
}

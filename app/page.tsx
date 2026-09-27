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
import type { Route } from "@/components/ui/BottomNav";
import { getProfile } from "@/lib/store";

type Stage = "intro" | "loading" | "createProfile" | Route;

export default function Page() {
  const [stage, setStage] = useState<Stage>("intro");
  const [config, setConfig] = useState<MatchConfig | null>(null);
  const [player, setPlayer] = useState({ name: "Player", avatar: null as string | null, rating: 1200 });

  // refresh the cached player details from storage whenever we land on a screen
  useEffect(() => {
    const p = getProfile();
    setPlayer({ name: p.name || "Player", avatar: p.avatar, rating: p.rating });
  }, [stage]);

  // after loading, send first-time players to profile creation
  const afterLoading = () => setStage(getProfile().name ? "home" : "createProfile");

  return (
    <main className="q64-frame">
      {stage === "intro" && <DarkNodeIntro onDone={() => setStage("loading")} />}
      {stage === "loading" && <LoadingScreen onDone={afterLoading} />}
      {stage === "createProfile" && <CreateProfileScreen onDone={() => setStage("home")} />}

      {stage === "home" && <HomeScreen player={player} onNavigate={setStage} />}

      {stage === "play" && (
        <ModePicker
          onStart={(c) => { setConfig(c); setStage("match"); }}
          onBack={() => setStage("home")}
        />
      )}

      {stage === "career" && (
        <CareerScreen
          onBack={() => setStage("home")}
          onNavigate={setStage}
          onPlay={(lg) => {
            setConfig({ mode: "computer", difficulty: lg.difficulty, playerColor: "w", opponent: lg });
            setStage("match");
          }}
        />
      )}

      {stage === "tournaments" && (
        <TournamentsScreen
          onBack={() => setStage("home")}
          onNavigate={setStage}
          onPlay={(lg, cupId) => {
            setConfig({ mode: "computer", difficulty: lg.difficulty, playerColor: "w", opponent: lg, tournament: { cupId } });
            setStage("match");
          }}
        />
      )}

      {stage === "match" && config && (
        <MatchScreen
          player={player}
          config={config}
          onExit={() => setStage(config.tournament ? "tournaments" : config.opponent ? "career" : "home")}
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

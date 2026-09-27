"use client";

import { useRef, useState } from "react";
import Q64Word from "@/components/ui/Q64Word";
import { ProfileIcon } from "@/components/ui/icons";
import { getProfile, saveProfile, fileToAvatar } from "@/lib/store";

// First-run screen: the player creates a real profile — their own name and photo.
export default function CreateProfileScreen({ onDone }: { onDone: () => void }) {
  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function pickPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) setAvatar(await fileToAvatar(f));
  }

  function save() {
    const clean = name.trim();
    if (!clean) return;
    saveProfile({ ...getProfile(), name: clean, avatar });
    onDone();
  }

  return (
    <div className="relative min-h-[100dvh] flex flex-col items-center justify-center px-6">
      <div className="absolute inset-0 opacity-40 bg-[url('/bg/home.jpg')] bg-cover bg-center" />
      <div className="absolute inset-0 bg-gradient-to-b from-night-900/85 to-night-900" />

      <div className="relative w-full max-w-sm glass-strong edge-glow rounded-3xl p-6 animate-fade-up">
        <div className="flex justify-center mb-2"><Q64Word size="lg" /></div>
        <div className="text-center text-sm text-slate-400 mb-6">Create your profile to start playing</div>

        {/* photo */}
        <div className="flex flex-col items-center mb-5">
          <button
            onClick={() => fileRef.current?.click()}
            className="h-24 w-24 rounded-full overflow-hidden bg-night-600 border-2 border-electric-500/40 shadow-glow flex items-center justify-center text-slate-400 hover:border-electric-500"
          >
            {avatar ? (
              <img src={avatar} alt="avatar" className="h-full w-full object-cover" />
            ) : (
              <ProfileIcon className="w-10 h-10" />
            )}
          </button>
          <button onClick={() => fileRef.current?.click()} className="mt-2 text-xs text-electric-300">
            {avatar ? "Change photo" : "Add photo (optional)"}
          </button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={pickPhoto} />
        </div>

        {/* name */}
        <label className="block text-xs tracking-[0.2em] text-slate-400 mb-2">YOUR NAME</label>
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && save()}
          placeholder="Enter your name"
          className="w-full bg-night-600 border border-electric-500/25 rounded-xl px-4 py-3 text-white outline-none focus:border-electric-500"
        />

        <button
          onClick={save}
          disabled={!name.trim()}
          className="mt-6 w-full rounded-xl py-3.5 font-bold text-white bg-gradient-to-r from-electric-600 to-electric-500 hover:shadow-glow transition disabled:opacity-40"
        >
          Enter Q64
        </button>
      </div>
    </div>
  );
}

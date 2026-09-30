"use client";

// Private one-to-one chat between two friends. Realtime: new messages arrive live.

import { useCallback, useEffect, useRef, useState } from "react";
import Q64Word from "@/components/ui/Q64Word";
import { BackIcon, SendIcon } from "@/components/ui/icons";
import { supabase } from "@/lib/supabaseClient";
import { getConversation, sendDM, markConversationRead, type DM, type OnlineUser } from "@/lib/online";

export default function DMChat({ me, other, onBack }: { me: OnlineUser; other: OnlineUser; onBack: () => void }) {
  const [msgs, setMsgs] = useState<DM[]>([]);
  const [input, setInput] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  const load = useCallback(() => { getConversation(other.id).then(setMsgs); markConversationRead(other.id); }, [other.id]);
  useEffect(() => {
    load();
    const sb = supabase;
    if (!sb) return;
    const ch = sb.channel(`dm:${me.id}:${other.id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "dm_messages" }, (p) => {
        const m = p.new as DM;
        const relevant = (m.from_id === me.id && m.to_id === other.id) || (m.from_id === other.id && m.to_id === me.id);
        if (relevant) setMsgs((c) => (c.some((x) => x.id === m.id) ? c : [...c, m]));
        if (m.from_id === other.id) markConversationRead(other.id);
      })
      .subscribe();
    return () => { sb.removeChannel(ch); };
  }, [me.id, other.id, load]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs]);

  const send = () => {
    const b = input.trim();
    if (!b) return;
    setInput("");
    void sendDM(other.id, b, me.username);
    // optimistic
    setMsgs((c) => [...c, { id: `tmp-${Date.now()}`, from_id: me.id, to_id: other.id, body: b, read: false, created_at: new Date().toISOString() }]);
  };

  return (
    <div className="relative min-h-[100dvh] bg-night-900 flex flex-col">
      <div className="absolute inset-0 opacity-20 bg-[url('/bg/home.jpg')] bg-cover bg-center" />
      <div className="absolute inset-0 bg-gradient-to-b from-night-900/90 to-night-900" />
      <div className="relative flex flex-col h-[100dvh] max-w-[480px] mx-auto w-full">
        <header className="flex items-center gap-3 px-4 pt-5 pb-3 border-b border-electric-500/15">
          <button onClick={onBack} className="text-slate-300 hover:text-white"><BackIcon /></button>
          <div className="h-9 w-9 rounded-full overflow-hidden bg-gradient-to-br from-electric-500 to-violet-q flex items-center justify-center text-sm font-bold text-white">
            {other.avatar ? <img src={other.avatar} alt="" className="h-full w-full object-cover" /> : other.username.slice(0, 1).toUpperCase()}
          </div>
          <div className="flex-1">
            <div className="text-white font-semibold leading-tight">{other.username}</div>
            <div className="text-[11px] text-slate-400">Friend</div>
          </div>
          <Q64Word size="sm" />
        </header>

        <div className="flex-1 overflow-y-auto no-scrollbar p-3 space-y-2">
          {msgs.length === 0 ? (
            <div className="text-center text-sm text-slate-500 mt-8">No messages yet. Say hi.</div>
          ) : msgs.map((m) => {
            const mine = m.from_id === me.id;
            return (
              <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[78%] rounded-2xl px-3 py-2 ${mine ? "bg-electric-600/25 border border-electric-500/30" : "bg-night-600/70 border border-white/5"}`}>
                  <div className="text-sm text-slate-100 whitespace-pre-wrap break-words">{m.body}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5 text-right">{new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</div>
                </div>
              </div>
            );
          })}
          <div ref={endRef} />
        </div>

        <div className="p-3 border-t border-electric-500/15 flex items-center gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            placeholder={`Message ${other.username}…`}
            className="flex-1 bg-night-600 rounded-xl px-3 py-2.5 text-sm text-white outline-none border border-electric-500/20 focus:border-electric-500"
          />
          <button onClick={send} className="text-electric-400 hover:text-cyan-q"><SendIcon className="w-5 h-5" /></button>
        </div>
      </div>
    </div>
  );
}

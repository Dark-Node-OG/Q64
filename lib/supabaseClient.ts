"use client";
// Q64's Supabase browser client — powers the ONLY online parts of the game:
// accounts, the who's-online lobby, and room-code multiplayer. Everything else is offline.
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const onlineEnabled = !!(url && key);
export const supabase = onlineEnabled ? createClient(url!, key!, { auth: { persistSession: true, autoRefreshToken: true } }) : null;

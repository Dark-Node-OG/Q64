import { NextRequest, NextResponse } from "next/server";
import { lupusChessReply, lupusCoachReview, type BrainInput } from "@/lib/lupus/brain";

export const runtime = "nodejs";

// The in-game LUPUS brain. Two jobs:
//  - chat: {fen, question, ...} → LUPUS's reply about the position.
//  - coach: {coach:true, pgn, result, playerName} → a short post-game review.
// If the AI is unavailable we return ok:false and the game handles the fallback,
// so chat and coaching never hard-fail.
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as BrainInput & { coach?: boolean; pgn?: string; result?: string };
    if (body?.coach && body.pgn) {
      const text = await lupusCoachReview(body.pgn, body.result || "draw", body.playerName);
      return NextResponse.json({ ok: true, text });
    }
    if (!body?.fen || !body?.question) return NextResponse.json({ ok: false }, { status: 200 });
    const text = await lupusChessReply(body);
    return NextResponse.json({ ok: true, text });
  } catch {
    return NextResponse.json({ ok: false }, { status: 200 });
  }
}

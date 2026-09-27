// Q64's LUPUS brain — the REAL conversational chess companion during a game.
// Server-side only (keeps the API key secret). Calls Groq with a chess-aware LUPUS
// persona. Throws on failure so the caller can fall back to the offline rule-based
// answer, meaning the chat NEVER breaks even if the AI is unavailable.

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
// Try the smaller model first (faster, lighter limit), then the bigger one.
const MODELS = ["openai/gpt-oss-20b", "openai/gpt-oss-120b"];

export type BrainInput = {
  fen: string;
  question: string;
  history?: string[]; // SAN moves so far
  lastLupusSan?: string;
  playerName?: string;
  evalText?: string; // e.g. "White is slightly better (+0.6)"
};

export async function lupusChessReply(inp: BrainInput): Promise<string> {
  const key = process.env.GROQ_API_KEY;
  if (!key) throw new Error("no key");

  const system = [
    "You are LUPUS, a calm, sharp, loyal AI chess companion inside the game Q64. You are a wolf — confident, warm, and human, never robotic.",
    `You are playing with and coaching ${inp.playerName || "the player"}.`,
    "Speak in simple, easy English: short sentences, plain words. The player's English is not strong, so keep it clear.",
    "Never use markdown symbols like *, _, #, backticks or bullet points. Write clean short prose.",
    "You can see the board from the position given. Answer their question about the position, your moves, or a chess idea. Be specific and genuinely helpful, in 1 to 3 short sentences.",
    "Never invent illegal moves or fake facts. If you are unsure, say so simply.",
  ].join(" ");

  const moves = inp.history && inp.history.length ? `Moves so far: ${inp.history.join(" ")}.` : "The game just started.";
  const user = [
    `Current position in FEN: ${inp.fen}.`,
    moves,
    inp.lastLupusSan ? `Your (LUPUS's) last move was ${inp.lastLupusSan}.` : "",
    inp.evalText ? `Engine read: ${inp.evalText}.` : "",
    `The player asks: "${inp.question}"`,
    "Reply as LUPUS, short and helpful.",
  ]
    .filter(Boolean)
    .join(" ");

  let lastErr: unknown;
  for (const model of MODELS) {
    try {
      const res = await fetch(GROQ_URL, {
        method: "POST",
        headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model,
          messages: [
            { role: "system", content: system },
            { role: "user", content: user },
          ],
          temperature: 0.6,
          max_tokens: 220,
        }),
        signal: AbortSignal.timeout(15000),
      });
      if (!res.ok) {
        lastErr = new Error(`groq ${res.status}`);
        continue; // busy/limited model → try the next
      }
      const data = await res.json();
      const text = (data?.choices?.[0]?.message?.content || "").trim();
      if (text) return scrub(text);
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error("brain unavailable");
}

// Post-game coaching: LUPUS reviews the finished game for the player.
export async function lupusCoachReview(pgn: string, result: string, playerName?: string): Promise<string> {
  const key = process.env.GROQ_API_KEY;
  if (!key) throw new Error("no key");
  const system = [
    "You are LUPUS, a warm but sharp chess coach in the game Q64.",
    "Review the finished game briefly for the player, in simple easy English: short sentences, plain words, no markdown symbols.",
    "Give 2 to 4 short points: one thing they did well, one or two mistakes or missed ideas, and one clear tip to get better.",
    "Be encouraging but honest. Do not list every move. Keep it under 90 words.",
  ].join(" ");
  const user = `The game just finished. Result for ${playerName || "the player"}: ${result}. The game in PGN:\n${pgn}\nGive your short coaching review as LUPUS.`;

  let lastErr: unknown;
  for (const model of MODELS) {
    try {
      const res = await fetch(GROQ_URL, {
        method: "POST",
        headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model, messages: [{ role: "system", content: system }, { role: "user", content: user }], temperature: 0.6, max_tokens: 320 }),
        signal: AbortSignal.timeout(15000),
      });
      if (!res.ok) { lastErr = new Error(`groq ${res.status}`); continue; }
      const data = await res.json();
      const text = (data?.choices?.[0]?.message?.content || "").trim();
      if (text) return scrub(text);
    } catch (e) { lastErr = e; }
  }
  throw lastErr instanceof Error ? lastErr : new Error("brain unavailable");
}

function scrub(t: string): string {
  return t.replace(/[*_#`>~]/g, "").replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim();
}

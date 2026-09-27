// LUPUS Game Agent adapter for Q64.
// Q64 talks to LUPUS only through this module. Today it runs the on-device Q64 engine and
// produces a safe decision summary (never raw chain-of-thought). Later this same interface
// can route to the real LUPUS Model Gateway without changing the game code.

import { Chess, type Move } from "chess.js";
import { searchBestMove, evaluate, cloneGame, type Color } from "@/lib/chess/engine";

export type Difficulty = "casual" | "balanced" | "challenging" | "analysis";

export type LupusDecision = {
  move: Move;
  san: string;
  reason: string;
  considerations: string[];
  confidence: "Low" | "Medium" | "High";
  evalCp: number; // centipawns, from White's perspective
  candidates: { san: string; label: string; evalCp: number }[];
};

const DEPTH: Record<Difficulty, number> = {
  casual: 1,
  balanced: 2,
  challenging: 3,
  analysis: 3,
};

// Persona shown in the match UI.
export const LUPUS_PROFILE = {
  name: "LUPUS",
  title: "Strategist",
  tagline: "Your AI chess companion",
};

// Decide LUPUS's move for the current position.
export function decideMove(fen: string, difficulty: Difficulty): LupusDecision {
  const game = new Chess(fen);
  const side = game.turn() as Color;
  const depth = DEPTH[difficulty];

  const legal = game.moves({ verbose: true }) as Move[];
  // Score the top candidates for the analysis panel.
  const scored = legal
    .map((m) => {
      const g = cloneGame(game);
      g.move(m);
      // score from mover's perspective at shallow depth for candidate list
      const s = -shallow(g, Math.max(0, depth - 1), side === "w" ? "b" : "w");
      return { m, s };
    })
    .sort((a, b) => b.s - a.s);

  const best = scored[0]?.m ?? legal[0];
  const bestScore = scored[0]?.s ?? 0;

  // Play with a touch of variety on casual so it is not robotic.
  let chosen = best;
  if (difficulty === "casual" && scored.length > 2 && Math.random() < 0.35) {
    chosen = scored[Math.min(scored.length - 1, 1 + Math.floor(Math.random() * 2))].m;
  }

  const evalCp = side === "w" ? bestScore : -bestScore;

  return {
    move: chosen,
    san: chosen.san,
    reason: reasonFor(chosen, game),
    considerations: considerationsFor(chosen),
    confidence: confidenceFor(bestScore, scored[1]?.s ?? bestScore),
    evalCp,
    candidates: scored.slice(0, 3).map(({ m, s }) => ({
      san: m.san,
      label: qualityLabel(s, bestScore),
      evalCp: side === "w" ? s : -s,
    })),
  };
}

function shallow(game: Chess, depth: number, side: Color): number {
  if (depth === 0 || game.isGameOver()) return evaluate(game, side);
  const { score } = searchBestMove(game, depth);
  return score;
}

// ---- natural-language decision summary (safe, not chain-of-thought) ----

function reasonFor(m: Move, game: Chess): string {
  const central = ["d4", "e4", "d5", "e5", "c4", "c5"].includes(m.to);
  if (m.san === "O-O" || m.san === "O-O-O") return "Castles to bring the king to safety and connect the rooks.";
  if (m.captured && m.promotion) return "Captures and promotes, converting material into a decisive advantage.";
  if (m.promotion) return "Promotes the pawn, adding a powerful new piece to the attack.";
  if (m.san.includes("#")) return "Delivers checkmate — the game is decided.";
  if (m.san.includes("+") && m.captured) return "Captures with check, winning material while forcing your reply.";
  if (m.san.includes("+")) return "Gives check to seize the initiative and dictate your response.";
  if (m.captured) return `Captures on ${m.to}, winning material and easing the position.`;
  if (m.piece === "n" || m.piece === "b") return `Develops the ${m.piece === "n" ? "knight" : "bishop"} and increases pressure on the centre.`;
  if (m.piece === "p" && central) return "Challenges central control and opens lines for the pieces.";
  if (m.piece === "p") return "A useful pawn move that improves the structure and gains space.";
  if (m.piece === "r") return "Activates the rook onto a more useful file.";
  if (m.piece === "q") return "Improves the queen to a more active and flexible square.";
  return "Improves the position and keeps a flexible, healthy structure.";
}

function considerationsFor(m: Move): string[] {
  const out: string[] = [];
  if (["d4", "e4", "d5", "e5"].includes(m.to)) out.push("centre control");
  if (m.piece === "n" || m.piece === "b") out.push("development");
  if (m.san === "O-O" || m.san === "O-O-O") out.push("king safety");
  if (m.captured) out.push("material");
  if (m.san.includes("+")) out.push("initiative");
  out.push("future pressure");
  return Array.from(new Set(out)).slice(0, 3);
}

function confidenceFor(best: number, second: number): "Low" | "Medium" | "High" {
  const gap = best - second;
  if (best > 500 || gap > 150) return "High";
  if (gap > 40) return "Medium";
  return "Low";
}

function qualityLabel(score: number, best: number): string {
  const diff = best - score;
  if (diff <= 20) return "Strong";
  if (diff <= 80) return "Solid";
  return "Playable";
}

// Answer a free-form player question about the current position (offline, rule-based for now).
export function answerQuestion(fen: string, question: string, lastLupusSan?: string): string {
  const game = new Chess(fen);
  const q = question.toLowerCase();
  const evalCp = evaluate(game, "w");
  const side = evalCp > 40 ? "White" : evalCp < -40 ? "Black" : "neither side";

  if (lastLupusSan && (q.includes("why") || q.includes("that move") || q.includes(lastLupusSan.toLowerCase()))) {
    const mv = { san: lastLupusSan, piece: guessPiece(lastLupusSan), to: lastLupusSan.replace(/[^a-h1-8]/g, "").slice(-2), captured: lastLupusSan.includes("x") ? "p" : undefined, promotion: undefined } as unknown as Move;
    return `${lastLupusSan}: ${reasonFor(mv, game)}`;
  }
  if (q.includes("option") || q.includes("what should") || q.includes("what can i")) {
    const moves = (game.moves({ verbose: true }) as Move[]).slice(0, 4).map((m) => m.san);
    return `A few reasonable ideas here: ${moves.join(", ")}. Look for the move that develops a piece, fights for the centre, or improves your king's safety.`;
  }
  if (q.includes("analy") || q.includes("position") || q.includes("evaluat")) {
    const cp = (Math.abs(evalCp) / 100).toFixed(1);
    return side === "neither side"
      ? "The position is roughly balanced. Focus on activity and don't rush."
      : `${side} is slightly better, around +${cp}. Keep improving your worst-placed piece.`;
  }
  if (q.includes("check") || q.includes("threat") || q.includes("danger")) {
    return game.isCheck()
      ? "You are in check — you must deal with the checking piece first."
      : "No immediate threats to force a response, but watch your undefended pieces and back rank.";
  }
  return "Good question. Aim to develop your pieces, control the centre, and keep your king safe. Ask me 'why did you move that?' for the reasoning behind my last move.";
}

function guessPiece(san: string): string {
  const c = san[0];
  if (c === "N") return "n";
  if (c === "B") return "b";
  if (c === "R") return "r";
  if (c === "Q") return "q";
  if (c === "K") return "k";
  if (c === "O") return "k";
  return "p";
}

// Q64 chess engine wrapper.
// Game rules come from chess.js. Q64 keeps its own thin, UI-friendly layer on top so the
// rest of the app never depends on chess.js internals directly (easy to swap later).

import { Chess, type Square, type Move } from "chess.js";

export type Color = "w" | "b";
export type PieceCode =
  | "wP" | "wN" | "wB" | "wR" | "wQ" | "wK"
  | "bP" | "bN" | "bB" | "bR" | "bQ" | "bK";

export type Cell = {
  square: Square;
  piece: PieceCode | null;
  light: boolean;
};

export type GameStatus =
  | { over: false }
  | { over: true; reason: "checkmate" | "stalemate" | "draw" | "repetition" | "insufficient"; winner: Color | null };

export const FILES = ["a", "b", "c", "d", "e", "f", "g", "h"] as const;
export const RANKS = [8, 7, 6, 5, 4, 3, 2, 1] as const;

// Build an 8x8 grid (rank 8 first) from a chess.js instance.
export function boardCells(game: Chess): Cell[][] {
  const raw = game.board(); // rank 8 -> rank 1, file a -> h
  return raw.map((row, r) =>
    row.map((sq, f) => {
      const square = (FILES[f] + RANKS[r]) as Square;
      const piece = sq ? ((sq.color + sq.type.toUpperCase()) as PieceCode) : null;
      const light = (r + f) % 2 === 0;
      return { square, piece, light };
    })
  );
}

export function legalTargets(game: Chess, from: Square): Square[] {
  return game.moves({ square: from, verbose: true }).map((m) => (m as Move).to);
}

export function statusOf(game: Chess): GameStatus {
  if (!game.isGameOver()) return { over: false };
  if (game.isCheckmate()) {
    // side to move is checkmated, so the other side won
    const winner: Color = game.turn() === "w" ? "b" : "w";
    return { over: true, reason: "checkmate", winner };
  }
  if (game.isStalemate()) return { over: true, reason: "stalemate", winner: null };
  if (game.isThreefoldRepetition()) return { over: true, reason: "repetition", winner: null };
  if (game.isInsufficientMaterial()) return { over: true, reason: "insufficient", winner: null };
  return { over: true, reason: "draw", winner: null };
}

export function newGame(): Chess {
  return new Chess();
}

export function cloneGame(game: Chess): Chess {
  return new Chess(game.fen());
}

// ---- simple evaluation + search (the on-device engine behind LUPUS) ----

const VALUE: Record<string, number> = { p: 100, n: 320, b: 330, r: 500, q: 900, k: 0 };

// Piece-square tables (white perspective). Encourage sensible development / center control.
const PST_PAWN = [
  0, 0, 0, 0, 0, 0, 0, 0,
  50, 50, 50, 50, 50, 50, 50, 50,
  10, 10, 20, 30, 30, 20, 10, 10,
  5, 5, 10, 25, 25, 10, 5, 5,
  0, 0, 0, 20, 20, 0, 0, 0,
  5, -5, -10, 0, 0, -10, -5, 5,
  5, 10, 10, -20, -20, 10, 10, 5,
  0, 0, 0, 0, 0, 0, 0, 0,
];
const PST_KNIGHT = [
  -50, -40, -30, -30, -30, -30, -40, -50,
  -40, -20, 0, 0, 0, 0, -20, -40,
  -30, 0, 10, 15, 15, 10, 0, -30,
  -30, 5, 15, 20, 20, 15, 5, -30,
  -30, 0, 15, 20, 20, 15, 0, -30,
  -30, 5, 10, 15, 15, 10, 5, -30,
  -40, -20, 0, 5, 5, 0, -20, -40,
  -50, -40, -30, -30, -30, -30, -40, -50,
];
const PST_BISHOP = [
  -20, -10, -10, -10, -10, -10, -10, -20,
  -10, 0, 0, 0, 0, 0, 0, -10,
  -10, 0, 5, 10, 10, 5, 0, -10,
  -10, 5, 5, 10, 10, 5, 5, -10,
  -10, 0, 10, 10, 10, 10, 0, -10,
  -10, 10, 10, 10, 10, 10, 10, -10,
  -10, 5, 0, 0, 0, 0, 5, -10,
  -20, -10, -10, -10, -10, -10, -10, -20,
];

function pstFor(type: string): number[] | null {
  if (type === "p") return PST_PAWN;
  if (type === "n") return PST_KNIGHT;
  if (type === "b") return PST_BISHOP;
  return null;
}

// Evaluate from the perspective of the side given. Positive = good for that side.
export function evaluate(game: Chess, forSide: Color): number {
  if (game.isCheckmate()) {
    // side to move is losing
    return game.turn() === forSide ? -100000 : 100000;
  }
  if (game.isDraw() || game.isStalemate()) return 0;

  let score = 0;
  const board = game.board();
  for (let r = 0; r < 8; r++) {
    for (let f = 0; f < 8; f++) {
      const sq = board[r][f];
      if (!sq) continue;
      const base = VALUE[sq.type];
      const pst = pstFor(sq.type);
      // index 0 = a8 for white perspective; mirror for black
      const idx = r * 8 + f;
      const posBonus = pst ? (sq.color === "w" ? pst[idx] : pst[63 - idx]) : 0;
      const total = base + posBonus;
      score += sq.color === forSide ? total : -total;
    }
  }
  return score;
}

// Negamax with alpha-beta. Returns best move + score for the side to move.
export function searchBestMove(
  game: Chess,
  depth: number
): { move: Move | null; score: number } {
  const side = game.turn() as Color;
  let best: Move | null = null;
  let bestScore = -Infinity;

  const moves = orderMoves(game.moves({ verbose: true }) as Move[]);
  for (const m of moves) {
    const g = cloneGame(game);
    g.move(m);
    const score = -negamax(g, depth - 1, -Infinity, Infinity, side === "w" ? "b" : "w");
    if (score > bestScore) {
      bestScore = score;
      best = m;
    }
  }
  return { move: best, score: bestScore };
}

function negamax(game: Chess, depth: number, alpha: number, beta: number, side: Color): number {
  if (depth === 0 || game.isGameOver()) {
    return evaluate(game, side);
  }
  let value = -Infinity;
  const moves = orderMoves(game.moves({ verbose: true }) as Move[]);
  for (const m of moves) {
    const g = cloneGame(game);
    g.move(m);
    const score = -negamax(g, depth - 1, -beta, -alpha, side === "w" ? "b" : "w");
    if (score > value) value = score;
    if (value > alpha) alpha = value;
    if (alpha >= beta) break;
  }
  return value;
}

// Captures first (MVV-LVA-ish) to make alpha-beta prune better.
function orderMoves(moves: Move[]): Move[] {
  return [...moves].sort((a, b) => scoreMove(b) - scoreMove(a));
}
function scoreMove(m: Move): number {
  let s = 0;
  if (m.captured) s += 10 + VALUE[m.captured] / 100;
  if (m.promotion) s += 9;
  if (m.san.includes("+")) s += 1;
  return s;
}

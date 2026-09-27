"use client";

import { useMemo, type CSSProperties } from "react";
import type { Chess, Square } from "chess.js";
import { boardCells, legalTargets, type PieceCode } from "@/lib/chess/engine";
import { BOARD_THEMES, type BoardTheme } from "@/lib/boardThemes";

type Props = {
  game: Chess;
  selected: Square | null;
  lastMove: { from: Square; to: Square } | null;
  interactive: boolean;
  onSquare: (sq: Square) => void;
  orientation?: "w" | "b";
  theme?: BoardTheme;
  showCoordinates?: boolean;
};

export default function Board({
  game, selected, lastMove, interactive, onSquare,
  orientation = "w", theme = "classic", showCoordinates = true,
}: Props) {
  const t = BOARD_THEMES[theme] ?? BOARD_THEMES.classic;

  // NOTE: the Chess object is mutated in place, so memoise on the FEN string
  // (which changes every move) — not the object reference — or the board freezes.
  const fen = game.fen();

  const cells = useMemo(() => {
    const grid = boardCells(game); // rank8..rank1, file a..h
    if (orientation === "b") {
      return [...grid].reverse().map((row) => [...row].reverse());
    }
    return grid;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fen, orientation]);

  const targets = useMemo(
    () => (selected ? new Set(legalTargets(game, selected)) : new Set<Square>()),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [fen, selected]
  );

  // Grid position (row, col) of every square in the CURRENT orientation, so the last-moved
  // piece can slide in from where it came (one cell = 100%).
  const posOf = useMemo(() => {
    const m: Record<string, { r: number; c: number }> = {};
    cells.forEach((row, r) => row.forEach((cc, c) => { m[cc.square] = { r, c }; }));
    return m;
  }, [cells]);

  const inCheckSquare = useMemo(() => {
    if (!game.inCheck()) return null;
    const turn = game.turn();
    for (const row of cells) for (const c of row) if (c.piece === ((turn + "K") as PieceCode)) return c.square;
    return null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fen, cells]);

  return (
    <div className="rounded-xl p-2.5 shadow-panel" style={{ background: t.frame }}>
      <div className="grid grid-cols-8 rounded-md overflow-hidden select-none">
        {cells.flat().map((cell) => {
          const isTarget = targets.has(cell.square);
          const isSelected = selected === cell.square;
          const isLast = lastMove && (lastMove.from === cell.square || lastMove.to === cell.square);
          const isCheck = inCheckSquare === cell.square;
          const file = cell.square[0];
          const rank = cell.square[1];
          const showFile = orientation === "w" ? rank === "1" : rank === "8";
          const showRank = orientation === "w" ? file === "a" : file === "h";
          return (
            <button
              key={cell.square}
              disabled={!interactive}
              onClick={() => onSquare(cell.square)}
              className={`relative aspect-square flex items-center justify-center ${interactive ? "cursor-pointer" : "cursor-default"}`}
              style={{ backgroundColor: cell.light ? t.light : t.dark }}
            >
              {/* highlights */}
              {isLast && <span className="absolute inset-0 bg-yellow-300/35" />}
              {isCheck && <span className="absolute inset-0 bg-red-500/45" />}
              {isSelected && <span className="absolute inset-0 ring-4 ring-inset ring-yellow-400/90 bg-yellow-300/25" />}

              {/* piece — the last-moved piece slides in from its previous square */}
              {cell.piece && (() => {
                const moved = !!lastMove && cell.square === lastMove.to && !!posOf[lastMove.from];
                const from = moved ? posOf[lastMove.from] : null;
                const to = moved ? posOf[lastMove.to] : null;
                const style: CSSProperties = { filter: "drop-shadow(0 3px 3px rgba(0,0,0,0.45))" };
                if (moved && from && to) {
                  (style as Record<string, string | number>)["--dx"] = `${(from.c - to.c) * 100}%`;
                  (style as Record<string, string | number>)["--dy"] = `${(from.r - to.r) * 100}%`;
                }
                return (
                  <img
                    key={moved ? `mv-${fen}` : cell.square}
                    src={`/pieces/${cell.piece}.svg`}
                    alt={cell.piece}
                    draggable={false}
                    className={`relative z-10 w-[86%] h-[86%] pointer-events-none ${moved ? "q64-slide" : ""}`}
                    style={style}
                  />
                );
              })()}

              {/* legal-move markers */}
              {isTarget && !cell.piece && (
                <span className="absolute z-10 h-[28%] w-[28%] rounded-full bg-black/25" />
              )}
              {isTarget && cell.piece && (
                <span className="absolute z-0 inset-0 ring-4 ring-inset ring-black/25" />
              )}

              {/* coordinates */}
              {showCoordinates && showFile && (
                <span className="absolute bottom-0.5 right-1 text-[9px] font-bold" style={{ color: cell.light ? t.dark : t.light, opacity: 0.7 }}>{file}</span>
              )}
              {showCoordinates && showRank && (
                <span className="absolute top-0.5 left-1 text-[9px] font-bold" style={{ color: cell.light ? t.dark : t.light, opacity: 0.7 }}>{rank}</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

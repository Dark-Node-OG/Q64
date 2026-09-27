"use client";

// Small non-interactive board used for lesson diagrams and theme previews.
// Renders a position from a FEN, with optional highlighted squares.

import { Chess } from "chess.js";
import { boardCells, type PieceCode } from "@/lib/chess/engine";
import { BOARD_THEMES, type BoardTheme } from "@/lib/boardThemes";

export default function MiniBoard({
  fen, theme = "classic", highlights = [], className = "",
}: {
  fen: string;
  theme?: BoardTheme;
  highlights?: string[];
  className?: string;
}) {
  const t = BOARD_THEMES[theme] ?? BOARD_THEMES.classic;
  const mark = new Set(highlights);
  let cells;
  try {
    cells = boardCells(new Chess(fen));
  } catch {
    cells = boardCells(new Chess());
  }

  return (
    <div className={`rounded-lg p-1.5 ${className}`} style={{ background: t.frame }}>
      <div className="grid grid-cols-8 rounded overflow-hidden">
        {cells.flat().map((cell) => (
          <div
            key={cell.square}
            className="relative aspect-square flex items-center justify-center"
            style={{ backgroundColor: cell.light ? t.light : t.dark }}
          >
            {mark.has(cell.square) && <span className="absolute inset-0 bg-yellow-300/45" />}
            {cell.piece && (
              <img
                src={`/pieces/${cell.piece as PieceCode}.svg`}
                alt=""
                draggable={false}
                className="relative z-10 w-[84%] h-[84%]"
                style={{ filter: "drop-shadow(0 2px 2px rgba(0,0,0,0.4))" }}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

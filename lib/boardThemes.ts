// Board colour themes, shared by the board, the settings preview and the mini
// diagrams. Add a new entry here and it shows up everywhere automatically.

export type BoardTheme =
  | "classic" | "midnight" | "emerald" | "rosewood"
  | "ocean" | "slate" | "coffee" | "royal";

export type ThemeDef = { name: string; light: string; dark: string; frame: string };

export const BOARD_THEMES: Record<BoardTheme, ThemeDef> = {
  classic: { name: "Classic Wood", light: "#ece0c4", dark: "#2f2823", frame: "#5a3d22" },
  midnight: { name: "Midnight Blue", light: "#c3cbe6", dark: "#2a3560", frame: "#1a2344" },
  emerald: { name: "Emerald", light: "#e7ecd6", dark: "#3a6b52", frame: "#274c3a" },
  rosewood: { name: "Rosewood", light: "#f0d9d2", dark: "#7c3b3b", frame: "#4d2323" },
  ocean: { name: "Ocean", light: "#cfeef0", dark: "#2b7a8c", frame: "#194f5c" },
  slate: { name: "Slate", light: "#cdd3da", dark: "#4a5568", frame: "#2d333f" },
  coffee: { name: "Coffee", light: "#d8c4a8", dark: "#4b3527", frame: "#301f14" },
  royal: { name: "Royal Purple", light: "#e0d4f2", dark: "#4c3079", frame: "#2f1c4d" },
};

export const THEME_KEYS = Object.keys(BOARD_THEMES) as BoardTheme[];

export function themeLabelColor(def: ThemeDef, light: boolean) {
  return light ? def.dark : def.light;
}

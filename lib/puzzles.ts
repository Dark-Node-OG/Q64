// Built-in Q64 tactics puzzles. Each has a FEN, the side to move, and the
// solution move(s) in SAN. Solving is real: the board checks your move.

export type Puzzle = {
  id: string;
  title: string;
  theme: string;
  rating: number;
  fen: string;
  sideToMove: "w" | "b";
  // Accepted first moves (SAN). Most are a single mating/winning move.
  solution: string[];
  hint: string;
};

export const PUZZLES: Puzzle[] = [
  {
    id: "p1",
    title: "Back-Rank Mate",
    theme: "Checkmate",
    rating: 900,
    fen: "6k1/5ppp/8/8/8/8/8/R5K1 w - - 0 1",
    sideToMove: "w",
    solution: ["Ra8#"],
    hint: "The king is trapped by its own pawns. Use the open file.",
  },
  {
    id: "p2",
    title: "Fork the King & Queen",
    theme: "Fork",
    rating: 1050,
    fen: "r1bqkbnr/pppp1ppp/2n5/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 0 1",
    sideToMove: "w",
    solution: ["Ng5"],
    hint: "A knight leap eyes f7 and pressures the weak square.",
  },
  {
    id: "p3",
    title: "Win the Queen",
    theme: "Skewer",
    rating: 1200,
    fen: "3r2k1/5ppp/8/8/8/8/5PPP/3Q2K1 w - - 0 1",
    sideToMove: "w",
    solution: ["Qxd8+"],
    hint: "A trade that isn't a trade — look at the back rank.",
  },
  {
    id: "p4",
    title: "Smothered Idea",
    theme: "Knight Mate",
    rating: 1350,
    fen: "6rk/6pp/8/6N1/8/8/8/6K1 w - - 0 1",
    sideToMove: "w",
    solution: ["Nf7+", "Ne6"],
    hint: "The king is boxed in. A knight check starts the net.",
  },
  {
    id: "p5",
    title: "Pin and Win",
    theme: "Pin",
    rating: 1150,
    fen: "rnbqkbnr/pppp1ppp/8/4p3/6P1/5P2/PPPPP2P/RNBQKBNR b KQkq - 0 1",
    sideToMove: "b",
    solution: ["Qh4#"],
    hint: "White just weakened the king. One diagonal decides it.",
  },
  {
    id: "p6",
    title: "Deflection",
    theme: "Deflection",
    rating: 1500,
    fen: "2r3k1/5ppp/8/8/8/8/5PPP/2R1R1K1 w - - 0 1",
    sideToMove: "w",
    solution: ["Rxc8+"],
    hint: "Remove the defender of the back rank first.",
  },
];

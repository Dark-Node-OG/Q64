// Q64 Learn content. Short, readable lessons, each with a real visual board
// diagram (rendered from the FEN) so learning is not just text.

export type Diagram = { fen: string; caption: string; highlights?: string[] };

export type Lesson = {
  id: string;
  title: string;
  level: "Beginner" | "Intermediate" | "Advanced";
  minutes: number;
  summary: string;
  points: string[];
  diagrams: Diagram[];
};

export const LESSONS: Lesson[] = [
  {
    id: "l1",
    title: "How the Pieces Move",
    level: "Beginner",
    minutes: 5,
    summary: "The foundation: how each of the six pieces travels across the 64 squares.",
    points: [
      "Pawns march forward one square, capture diagonally, and may go two squares on their first move.",
      "Knights jump in an L-shape and are the only piece that can leap over others.",
      "Bishops slide on diagonals, rooks on ranks and files, and the queen does both.",
      "The king moves one square in any direction and must always be kept safe.",
    ],
    diagrams: [
      {
        fen: "4k3/8/8/4N3/8/8/8/4K3 w - - 0 1",
        caption: "The knight on e5 can jump to any of the eight highlighted squares.",
        highlights: ["d7", "f7", "c6", "g6", "c4", "g4", "d3", "f3"],
      },
    ],
  },
  {
    id: "l2",
    title: "Control the Centre",
    level: "Beginner",
    minutes: 6,
    summary: "Why the four central squares decide most games, and how to fight for them.",
    points: [
      "Open with a central pawn (e4 or d4) to claim space immediately.",
      "Develop knights and bishops toward the centre in the first few moves.",
      "A piece in the centre controls more squares than one on the edge.",
      "Do not move the same piece twice in the opening without a reason.",
    ],
    diagrams: [
      {
        fen: "rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2",
        caption: "After 1.e4 e5 both sides fight for the four central squares.",
        highlights: ["d4", "e4", "d5", "e5"],
      },
    ],
  },
  {
    id: "l3",
    title: "King Safety & Castling",
    level: "Beginner",
    minutes: 5,
    summary: "Tuck your king away early so the middlegame does not catch it in the centre.",
    points: [
      "Castle within the first ten moves whenever you can.",
      "Keep the pawns in front of your castled king mostly unmoved.",
      "Trade pieces when you are being attacked to blunt the assault.",
      "Watch for back-rank weaknesses once you have castled.",
    ],
    diagrams: [
      {
        fen: "rnbq1rk1/pppp1ppp/5n2/2b1p3/2B1P3/5N2/PPPP1PPP/RNBQ1RK1 w - - 6 5",
        caption: "Both kings have castled to g8 and g1, safe behind their pawns.",
        highlights: ["g1", "g8"],
      },
    ],
  },
  {
    id: "l4",
    title: "Basic Tactics",
    level: "Intermediate",
    minutes: 8,
    summary: "Forks, pins, and skewers — the patterns that win material in one blow.",
    points: [
      "A fork attacks two pieces at once; knights are the classic forkers.",
      "A pin freezes a piece because moving it would expose a more valuable one.",
      "A skewer forces a valuable piece to move and wins the one behind it.",
      "Before every move, ask: what does my opponent threaten now?",
    ],
    diagrams: [
      {
        fen: "6k1/8/5N2/3q4/8/8/8/6K1 w - - 0 1",
        caption: "The knight on f6 checks the king on g8 and forks the queen on d5.",
        highlights: ["f6", "g8", "d5"],
      },
    ],
  },
  {
    id: "l5",
    title: "Converting an Advantage",
    level: "Intermediate",
    minutes: 7,
    summary: "You are ahead — now trade wisely and turn material into a win.",
    points: [
      "When ahead in material, trade pieces but keep pawns.",
      "Activate your king in the endgame; it becomes a strong piece.",
      "Push passed pawns toward promotion with support.",
      "Avoid unnecessary risks — simplify toward a clearly won position.",
    ],
    diagrams: [
      {
        fen: "4k3/8/4PK2/8/8/8/8/8 w - - 0 1",
        caption: "A passed pawn on e6, shielded by the king, marches to promotion.",
        highlights: ["e6"],
      },
    ],
  },
  {
    id: "l6",
    title: "Thinking Like an Engine",
    level: "Advanced",
    minutes: 10,
    summary: "How LUPUS evaluates a position: material, activity, king safety, structure.",
    points: [
      "Evaluation blends material value with piece placement and mobility.",
      "Candidate moves are searched several moves deep before choosing.",
      "Prune bad lines early to look deeper at the promising ones.",
      "Ask LUPUS 'why did you move that?' during a game to see its reasoning.",
    ],
    diagrams: [
      {
        fen: "r1bqk2r/pppp1ppp/2n2n2/2b1p3/2B1P3/2N2N2/PPPP1PPP/R1BQK2R w KQkq - 6 5",
        caption: "A balanced Italian position — the engine weighs activity and structure here.",
        highlights: ["d4", "e4", "d5", "e5"],
      },
    ],
  },
];

============================================================
Q64 — MASTER GAME BUILD SPECIFICATION
DARK NODE GAME STUDIO
============================================================

PROJECT STATUS:
This is the first official chess game produced by Dark Node.

GAME NAME:
Q64

STUDIO:
Dark Node

Q64 is NOT called "Dark Node Chess."
Dark Node is the development/production studio.
Q64 is its own independent game identity.

------------------------------------------------------------
1. CORE PRODUCT VISION
------------------------------------------------------------

Build Q64 as a complete, polished, standalone chess game.

Do NOT build only a chessboard.

Q64 must feel like a real finished game/product with:

- launch experience
- Dark Node studio intro
- Q64 loading experience
- dedicated Q64 home screen
- player profiles
- game modes
- local games
- online games
- computer games
- LUPUS games
- puzzles
- learning section
- game history
- profile/statistics
- settings
- complete chess gameplay
- Chat system
- Analysis system
- match results
- match review
- persistent game history
- responsive mobile/laptop experience
- PWA installation support
- future LUPUS Game Agent integration

The product should feel premium, intelligent, futuristic, mysterious and polished.

Q64 should NOT feel like a generic chess website.

------------------------------------------------------------
2. VISUAL IDENTITY
------------------------------------------------------------

IMPORTANT:

Use the supplied visual reference images as the primary visual direction.

Do NOT copy another game's branding or UI.

We are taking inspiration from the concept of having a complete game identity, not copying another product.

Q64's visual identity is:

- deep midnight navy
- dark blue
- electric/neon blue
- subtle cyan
- subtle blue-violet where appropriate
- white/cool-white typography
- luminous blue borders
- subtle glass/dark panels
- cinematic sci-fi atmosphere
- premium chess pieces
- controlled glow
- elegant motion

DO NOT turn the interface into:

- pure black everywhere
- gold/brown luxury UI
- green casino-style UI
- cartoon UI
- generic blue website UI
- excessive neon everywhere

The interface must remain dark, but it needs depth.

There must be a clear hierarchy between:

background
→ panels
→ cards
→ controls
→ active states
→ highlights

The earlier Q64 match reference with the dark navy interface and electric blue accents is the visual anchor for the actual game UI.

------------------------------------------------------------
3. REFERENCE IMAGES
------------------------------------------------------------

The supplied reference images represent different parts of Q64.

Use them as design references, not as assets to copy blindly.

REFERENCE A:
Q64 launch/loading/home concept.

REFERENCE B:
Q64 chess gameplay screen with:

- player profiles
- LUPUS profile
- chessboard
- clocks
- Chat tab
- Analysis tab
- dark navy UI
- electric blue accents

REFERENCE C:
Q64 Analysis screen.

REFERENCE D/E:
Cinematic chess backgrounds generated specifically for Q64.

These cinematic backgrounds contain NO UI intentionally.

This is important.

The following must be created by code:

- Q64 logo/text
- Dark Node logo/text
- loading text
- progress bar
- buttons
- status indicators
- navigation
- player information
- menus
- chat
- analysis
- all UI

Do not bake UI text into background images.

------------------------------------------------------------
4. APPLICATION STARTUP FLOW
------------------------------------------------------------

When the user opens Q64, the sequence should be:

STEP 1:
Dark Node launch screen.

STEP 2:
Q64 loading screen.

STEP 3:
Q64 home screen.

The transition should feel like a real game boot sequence.

Do not make the user wait unnecessarily.

The entire startup should be lightweight and fast.

------------------------------------------------------------
5. DARK NODE LAUNCH SCREEN
------------------------------------------------------------

Create a short cinematic studio intro.

This is NOT the Q64 home screen.

Purpose:
Introduce the studio behind the game.

Visual direction:

- deep navy/near-black background
- cinematic blue environment
- blue energy/wave effects
- subtle particles
- subtle atmospheric movement
- elegant Dark Node presentation

The supplied Dark Node cinematic background may be used as the base artwork.

IMPORTANT:
The background is only the visual environment.

Render the actual Dark Node logo and text using code/SVG.

Animation concept:

1. screen begins very dark
2. subtle blue atmospheric movement begins
3. central light slowly appears
4. Dark Node logo fades/scales into view
5. subtle blue light sweep crosses the logo
6. "DARK NODE" appears
7. optional small "GAME STUDIO" subtitle
8. very short hold
9. cinematic fade/transition into Q64

The animation should be approximately 1–2 seconds.

It should feel premium, not annoying.

Do not create a long intro that delays gameplay.

Allow the system to skip or shorten the animation if appropriate.

------------------------------------------------------------
6. Q64 LOADING SCREEN
------------------------------------------------------------

After Dark Node intro, transition into Q64.

Use the supplied Q64 cinematic chess artwork as the visual background.

The image should remain clean.

Do NOT add text directly to the image.

Render the following with code:

Q64 logo
CHESS-related subtitle if desired
loading status
progress bar
loading stages

Example structure:

Q64

CHESS REIMAGINED

INITIALIZING Q64...

[animated progress bar]

Loading game engine...
Preparing board...
Connecting game services...
Preparing Game Agent...
Syncing data...
Almost ready...

Do not necessarily display every status line at once.

The loading system must reflect actual application initialization where practical.

Do not fake a long loading process just for visual effect.

If the app loads instantly, the screen should still have a very short polished transition rather than artificially delaying the user.

Progress bar:

- electric blue/cyan
- subtle glow
- smooth animation
- premium thin design
- no green/orange colors

------------------------------------------------------------
7. Q64 HOME SCREEN
------------------------------------------------------------

After loading, show the main Q64 home screen.

This must feel like the home screen of an actual standalone chess game.

Home screen should include:

TOP AREA:
- Q64 logo
- user profile/avatar
- notification area if needed
- settings

WELCOME AREA:
- user's profile
- LUPUS visual/avatar
- short personalized welcome
- current rating/stat information where available

PRIMARY NAVIGATION:

PLAY
PUZZLES
LEARN
GAME HISTORY
PROFILE
SETTINGS

Also include a clear:

PLAY WITH LUPUS

entry point.

The home screen should NOT be overloaded.

Use clean cards with:

- dark navy surfaces
- subtle blue borders
- blue glow on active/hover/focus
- clean icons
- white typography
- secondary cool-blue text

Mobile-first design.

On larger screens, expand intelligently rather than simply stretching the mobile UI.

------------------------------------------------------------
8. PLAY MENU
------------------------------------------------------------

Use this structure:

PLAY

├── Local
├── Online
├── vs Computer
└── vs LUPUS

These are separate modes.

LOCAL:
Two people can play on the same device.

ONLINE:
Human vs human through the backend.

VS COMPUTER:
Chess engine/computer opponent.

VS LUPUS:
The LUPUS Game Agent plays the game.

The user should also be able to enter VS LUPUS directly from the LUPUS button/card on the home screen.

------------------------------------------------------------
9. FIRST-TIME CHESS SETUP
------------------------------------------------------------

The first time the user chooses to play chess against LUPUS, show a small setup/preferences form.

Do NOT ask these questions every time.

Ask once and save the preferences.

Questions:

1. Which side do you want?

- White
- Black
- Random

2. How should LUPUS play?

- Fast
- Balanced
- Challenging

3. How should LUPUS explain moves?

- Only when I ask
- Explain important moves
- Teach me while we play

Save these preferences per user/per game.

Next time the user says:

"LUPUS, let's play chess."

The system should use the saved preferences automatically.

Allow the user to change them later through settings.

------------------------------------------------------------
10. GAME ACCOUNT / PLAYER PROFILE
------------------------------------------------------------

The game must have a real player profile system.

The human player's actual Q64 account/profile should be used.

Do not create a fake temporary player identity for every match.

Profile should support:

- avatar/profile photo
- display name
- username
- rating
- games played
- wins
- losses
- draws
- achievements
- game history

The LUPUS player should ALSO have a persistent Q64 Gaming Profile.

LUPUS's profile should include:

- LUPUS name
- LUPUS avatar
- AI/player designation
- rating or difficulty representation
- stats
- games played
- wins/losses/draws
- personality/playing style

The match screen should therefore feel like:

HUMAN PLAYER
vs
LUPUS

not simply:

USER
vs COMPUTER

------------------------------------------------------------
11. Q64 MATCH SCREEN
------------------------------------------------------------

This is one of the most important screens.

Use the supplied Q64 match-screen reference as the primary visual reference.

Preserve the visual concept:

- dark navy environment
- electric blue accents
- premium chessboard
- premium 3D chess pieces
- player cards
- clocks
- LUPUS avatar
- human avatar
- Chat tab
- Analysis tab
- bottom controls
- clean spacing
- subtle blue glow

Do NOT redesign this into a completely different style.

------------------------------------------------------------
12. CHESSBOARD
------------------------------------------------------------

Use a proper functional chessboard.

Must support:

- legal movement
- selecting pieces
- moving pieces
- captures
- check
- checkmate
- stalemate
- castling
- en passant
- promotion
- draw conditions
- resignation
- move history
- undo where appropriate for local games
- clocks
- orientation switching
- board coordinates if enabled
- move highlighting
- last-move highlighting
- check highlighting

The chess rules must be correct.

Do not implement fake chess logic.

Use a reliable chess rules library where appropriate rather than reinventing complex rules unnecessarily.

------------------------------------------------------------
13. CHESS ENGINE
------------------------------------------------------------

Do NOT treat LUPUS itself as a replacement for a specialized chess calculation engine.

For VS COMPUTER and LUPUS tactical calculation, use an appropriate chess engine/search system.

LUPUS should sit at a higher intelligence layer.

Conceptually:

Q64
  ↓
Game System
  ↓
Game Agent
  ↓
Chess Intelligence
  ↓
Chess Engine / Search
  ↓
Legal moves / evaluation

LUPUS's role includes:

- understanding game state
- strategic decision making
- player adaptation
- explanation
- game memory
- match analysis
- learning from previous matches

The chess engine handles deep tactical calculation.

This separation must be maintained.

------------------------------------------------------------
14. LUPUS GAME AGENT
------------------------------------------------------------

Q64 must be designed to support the general LUPUS GAME AGENT architecture.

Do NOT hard-code the entire game around LUPUS.

Q64 should remain a standalone game.

LUPUS is an external intelligence/player system connected through a clean Game Agent interface.

Design the game integration around a structured protocol.

Conceptually support operations such as:

get_game_state()
get_legal_moves()
make_move(move)
get_match_history()
get_player_stats()
get_current_position()
get_move_history()
get_game_result()

The actual implementation can use API endpoints, WebSocket events, postMessage/deep links, or another clean mechanism depending on the existing project architecture.

Do not over-engineer this before the core game works.

Build a clean adapter layer so the LUPUS integration can evolve later.

------------------------------------------------------------
15. GAME AGENT ARCHITECTURE
------------------------------------------------------------

The long-term architecture should allow:

GAME AGENT
├── Game Discovery
├── Game Adapter
├── Game State
├── Game Understanding
├── Decision Engine
├── Strategy Engine
├── Action Controller
├── Match Memory
├── Performance Analysis
└── Learning System

Q64 should expose enough structured state for the Game Agent to work without relying primarily on screenshots.

Vision should be a fallback, not the primary integration for our own game.

------------------------------------------------------------
16. LUPUS GAMEPLAY SPEED
------------------------------------------------------------

LUPUS must NOT be unnecessarily slow.

Playing modes:

CASUAL / FAST:
Very quick responses.

BALANCED:
Fast but stronger calculation.

CHALLENGING:
Deeper calculation with reasonable response time.

ANALYSIS:
Can use deeper analysis without practical gameplay time pressure.

Do not force human-like waiting.

LUPUS can think faster than a human.

The user may take as long as they want.

------------------------------------------------------------
17. CHAT SYSTEM
------------------------------------------------------------

Chat is a native part of the Q64 match interface.

It is NOT merely a link that opens the LUPUS app.

Match screen:

CHAT | ANALYSIS

Chat should appear as an integrated game panel/tab.

Human vs human:
Chat connects the two players.

Human vs LUPUS:
Chat connects to the LUPUS Game Agent.

The LUPUS chat context must know:

- current board position
- previous moves
- current match
- previous LUPUS moves
- relevant analysis
- game history
- current player's questions

Example:

User:
"Why did you play ...c5?"

LUPUS:
"That challenges your central control and gives me active development."

The response must be based on the actual game state.

Allow suggested questions such as:

"Why did you move that?"
"What are my options?"
"Can you analyze this position?"

Also support free-form chat.

------------------------------------------------------------
18. VOICE
------------------------------------------------------------

Design the architecture so the Q64 chat can eventually support voice.

The user should be able to speak to LUPUS during a match.

Examples:

"Why did you play that?"
"What should I watch for?"
"Explain this position."

Do not make voice mandatory for the first implementation if the required LUPUS voice infrastructure is not yet available.

Build the interface so it can be plugged in later.

------------------------------------------------------------
19. ANALYSIS SYSTEM
------------------------------------------------------------

The Analysis tab is a separate experience from Chat.

Use the supplied Analysis visual reference.

Possible sections:

OVERVIEW
MOVES
VARIATIONS
GAME REVIEW

Overview should show things such as:

- position evaluation
- evaluation bar
- best move
- LUPUS move
- reason summary
- player position status
- king safety
- center control
- development
- tactical threats
- candidate moves
- move timeline

Do NOT expose hidden chain-of-thought.

Instead show a safe decision summary.

Example:

MOVE:
...c5

REASON:
Challenges central control and creates active counterplay.

CONSIDERATIONS:
- center control
- development
- future pressure

CONFIDENCE:
High

Do not display private internal reasoning traces.

------------------------------------------------------------
20. GAME DECISION LOG
------------------------------------------------------------

For LUPUS matches, maintain structured decision records.

Each decision can contain:

- game ID
- move number
- board position
- candidate moves
- selected move
- evaluation
- reason summary
- confidence
- timestamp
- engine analysis reference

This allows later review without exposing private chain-of-thought.

------------------------------------------------------------
21. GAME LEARNING
------------------------------------------------------------

After a match ends:

MATCH FINISHED
↓
Replay / Analyze
↓
Identify mistakes and successful decisions
↓
Compare against previous games
↓
Generate learning records
↓
Store meaningful game-related memory

Important:

Saving a game does NOT automatically mean LUPUS learned from it.

The match must be analyzed.

LUPUS should learn from:

- wins
- losses
- draws
- mistakes
- successful patterns
- repeated mistakes
- tactical patterns
- strategic patterns
- opponent behavior
- adaptation

Do not treat one lucky result as a permanent strategy.

Distinguish repeated patterns from noise.

------------------------------------------------------------
22. THREE TYPES OF GAME INTELLIGENCE
------------------------------------------------------------

Support these conceptual categories:

A. GAME KNOWLEDGE

Permanent general knowledge:

- chess rules
- openings
- tactics
- endgames
- strategic principles

B. GAME EXPERIENCE

What LUPUS personally experienced:

- previous games
- previous opponents
- mistakes
- successful decisions
- recurring situations

C. GAME STRATEGY

Current beliefs about what tends to work.

Decision concept:

KNOWLEDGE + EXPERIENCE + STRATEGY

Do not permanently rewrite general knowledge from one match.

------------------------------------------------------------
23. MATCH HISTORY
------------------------------------------------------------

Every completed match should be saved.

Use structured data.

Do NOT use Markdown as the primary database format.

Use structured records such as:

- JSON
- PGN
- database records

Store:

- match ID
- players
- result
- date/time
- moves
- clocks
- game mode
- opening information
- analysis
- decisions
- chat context where appropriate
- lessons learned
- game version
- opponent information

Markdown reports can be generated for human-readable summaries.

------------------------------------------------------------
24. GAME HISTORY IN Q64
------------------------------------------------------------

Create a Game History section.

Example:

GAME HISTORY

vs LUPUS
Win
Today
34 moves

vs LUPUS
Loss
Yesterday
42 moves

Online
Draw
Sep 18
57 moves

Tapping a match should open a review screen.

Review should show:

- board replay
- move list
- analysis
- critical moments
- mistakes
- successful decisions
- result
- relevant chat
- lessons

------------------------------------------------------------
25. LUPUS MEMORY AFTER CLOSING Q64
------------------------------------------------------------

The match must not disappear when the user closes the game.

The user should later be able to open LUPUS and say:

"Let's talk about that chess game we played."

LUPUS should be able to retrieve the relevant match.

It should know:

- which match
- date
- opponent
- moves
- result
- analysis
- decisions
- lessons
- relevant chat

This requires proper persistent match identifiers and backend storage.

Do not pretend this exists if the backend integration is not yet connected.

Create the architecture cleanly so it can be connected.

------------------------------------------------------------
26. RESUME MATCHES
------------------------------------------------------------

Matches should be server-backed/account-backed where online persistence is available.

The game should not permanently tie a match to one physical device.

The user should eventually be able to:

start on phone
→ close
→ open laptop
→ authenticate
→ continue the same match

For offline/local games, use local persistence.

------------------------------------------------------------
27. PWA
------------------------------------------------------------

Q64 should be installable as a Progressive Web App.

Support:

- mobile installation
- laptop/desktop installation where supported
- app-like experience
- responsive layout
- proper manifest
- icons
- splash configuration where supported
- offline shell where practical
- fast loading
- persistent session

The game must work well on:

- Android phone
- laptop/desktop browser

Do not create separate codebases unless absolutely necessary.

Use a responsive architecture.

------------------------------------------------------------
28. MOBILE-FIRST DESIGN
------------------------------------------------------------

Q64 must look excellent on a phone.

Primary mobile experience:

portrait orientation.

The chessboard should have enough space to play comfortably.

Chat/Analysis should open as a panel/tab without destroying the board experience.

On wider screens:

- use additional space intelligently
- allow board + analysis/chat side-by-side
- do not simply stretch everything

Maintain the same visual identity on all sizes.

------------------------------------------------------------
29. NAVIGATION
------------------------------------------------------------

Suggested bottom navigation:

HOME
PLAY
PUZZLES
LEARN
SETTINGS

Game History and Profile can be accessible from Home/profile/navigation.

Do not clutter the bottom navigation.

------------------------------------------------------------
30. PROFILE
------------------------------------------------------------

Player profile should show:

- avatar
- name
- username
- rating
- games
- wins
- losses
- draws
- performance statistics
- achievements
- recent games

Future-ready for:

- rankings
- friends
- online status
- tournaments
- badges

Do not build unnecessary social features before the core game is finished.

------------------------------------------------------------
31. PUZZLES
------------------------------------------------------------

Create a dedicated Puzzles section.

Initial implementation can use a clean placeholder architecture if the puzzle database is not ready.

The structure should support:

- puzzle position
- objective
- solution
- rating/difficulty
- result
- puzzle history

------------------------------------------------------------
32. LEARN
------------------------------------------------------------

Create a Learn section.

Initial architecture should support future chess lessons.

Possible categories:

- basics
- openings
- tactics
- strategy
- endgames
- checkmate patterns

Do not spend more time here than necessary before core gameplay works.

------------------------------------------------------------
33. SETTINGS
------------------------------------------------------------

Settings should include relevant Q64 controls.

Examples:

- sound
- music
- vibration
- board theme
- piece style
- clock preferences
- notation
- coordinates
- animation intensity
- accessibility
- LUPUS gameplay settings
- explanation preferences
- account
- privacy
- data

Respect the user's saved LUPUS preferences.

------------------------------------------------------------
34. ANIMATION SYSTEM
------------------------------------------------------------

Animation is an important part of Q64.

Use animation deliberately.

Do NOT animate everything.

Use subtle animation for:

- Dark Node intro
- Q64 loading
- logo reveal
- blue energy
- background atmosphere
- buttons
- transitions
- chess move feedback
- active states
- panel transitions
- loading progress
- notification indicators

The cinematic background images are static assets.

Use code to animate additional layers above them.

Possible technologies:

- CSS animation
- SVG animation
- Canvas
- WebGL
- Framer Motion or another suitable lightweight animation system

Choose the simplest technology that achieves the required result.

Performance is more important than unnecessary technical complexity.

------------------------------------------------------------
35. CINEMATIC BACKGROUND IMPLEMENTATION
------------------------------------------------------------

The supplied cinematic images should be treated as artwork.

Do NOT attempt to recreate every detail of those images with CSS.

Instead:

BACKGROUND IMAGE
+
CODED LIGHT/ENERGY EFFECTS
+
CODED LOGO
+
CODED UI
+
CODED TRANSITIONS

This hybrid approach is intentional.

If possible, add subtle parallax/scale/movement to the background so it feels alive.

Do not distort the image.

------------------------------------------------------------
36. PERFORMANCE
------------------------------------------------------------

Q64 must remain lightweight.

Important:

- optimize image assets
- lazy-load non-critical screens
- compress backgrounds
- avoid huge JavaScript bundles
- avoid unnecessary animation loops
- pause expensive animation when not visible
- optimize mobile rendering
- avoid excessive WebGL if CSS/SVG is sufficient
- maintain smooth scrolling
- keep startup fast

The cinematic visuals must NOT make the game unusable on a normal Android phone.

------------------------------------------------------------
37. ACCESSIBILITY
------------------------------------------------------------

Support:

- readable text
- sufficient contrast
- large touch targets
- keyboard support where appropriate
- screen-reader-friendly labels
- visible focus states
- reduced-motion preference

If the user enables reduced motion, simplify animations.

------------------------------------------------------------
38. TECHNICAL ARCHITECTURE
------------------------------------------------------------

Use the existing project architecture where appropriate.

Do not unnecessarily rewrite the entire project if a working foundation already exists.

Preferred web architecture:

- React/Next.js or the project's established framework
- TypeScript
- component-based UI
- reusable design system
- chess rules library
- chess engine integration
- backend/API abstraction
- PWA support

Keep game logic separate from UI.

Suggested structure:

/app
/components
/game
/game-engine
/game-agent
/chess
/analysis
/chat
/profile
/history
/puzzles
/learn
/settings
/lib
/api
/assets
/styles

Adapt this to the existing repository rather than blindly creating duplicate architecture.

------------------------------------------------------------
39. DATA MODEL
------------------------------------------------------------

Design clean entities for:

User
Profile
Game
Match
Move
Player
GameAnalysis
Decision
ChatMessage
LearningRecord
GamePreference
GameSettings

Every match should have a unique ID.

Every move should belong to a match.

Every analysis record should reference a match/move.

Every LUPUS decision should reference a match/move.

This is essential for future memory retrieval.

------------------------------------------------------------
40. SECURITY
------------------------------------------------------------

Do not expose secrets in frontend code.

Use environment variables.

Do not put API keys directly into React components.

Validate server requests.

Authenticate user-specific match data.

Do not allow a client to arbitrarily modify protected match results.

Separate public game state from private LUPUS/system information.

------------------------------------------------------------
41. LUPUS PRIVACY / REASONING
------------------------------------------------------------

Never expose hidden chain-of-thought.

The Q64 interface may display:

- move explanation
- strategic summary
- evaluation
- candidate moves
- confidence
- important considerations

But never display private internal reasoning traces.

------------------------------------------------------------
42. GAME RESULT SCREEN
------------------------------------------------------------

When a game ends, show a polished result screen.

Example:

CHECKMATE

BILAL
vs
LUPUS

1 — 0

Then show:

- result
- number of moves
- key moments
- performance summary
- review button
- rematch
- return home

For a LUPUS match:

REVIEW GAME
ANALYZE
REMATCH
HOME

The result screen should visually belong to Q64.

------------------------------------------------------------
43. MATCH REVIEW
------------------------------------------------------------

After a game:

- replay board
- move timeline
- important moments
- mistakes
- strong moves
- position evaluation
- LUPUS explanations
- lessons

Allow the user to ask LUPUS questions about the finished match.

------------------------------------------------------------
44. GAME CHAT PERSISTENCE
------------------------------------------------------------

Relevant game chat should be associated with the match.

After the game, the user should be able to review relevant chat.

Do not necessarily store every trivial UI event.

Store useful conversational context.

------------------------------------------------------------
45. LUPUS DIRECT COMMAND FLOW
------------------------------------------------------------

The eventual experience should support:

User opens LUPUS.

User says:

"LUPUS, let's play chess."

LUPUS recognizes the request.

LUPUS:

1. identifies chess
2. retrieves saved chess preferences
3. creates/resumes a Q64 match
4. establishes Game Agent connection
5. opens Q64
6. prepares the board
7. uses the user's Q64 account
8. uses the persistent LUPUS Gaming Profile
9. starts the match

If deep-link/PWA launching is supported by the environment, use it.

Do not assume arbitrary OS-level app launching is always possible.

Build the architecture so this can be supported progressively.

------------------------------------------------------------
46. GAME-TO-LUPUS CONNECTION
------------------------------------------------------------

Q64 owns:

- board
- rules
- match state
- account
- chat UI
- history UI
- gameplay

LUPUS owns:

- intelligence
- strategy
- decision making
- explanation
- memory
- learning
- Game Agent

This separation must remain clear.

------------------------------------------------------------
47. FUTURE GAME AGENT COMPATIBILITY
------------------------------------------------------------

Do not build Q64 in a way that makes the Game Agent chess-specific.

Dark Node will eventually create other games.

The LUPUS Game Agent should eventually support:

- Q64
- other Dark Node games
- third-party games
- browser games
- API-connected games
- native games
- vision-based games

Q64 is the first implementation.

The game adapter architecture should therefore be reusable.

------------------------------------------------------------
48. DARK NODE BRANDING
------------------------------------------------------------

Dark Node should appear as the studio identity.

Q64 should remain the product identity.

Do not repeatedly place "Dark Node" throughout the Q64 UI.

The relationship should feel like:

DARK NODE
Game Studio

↓

Q64
Chess Game

This allows Dark Node to release future independent games.

------------------------------------------------------------
49. WHAT NOT TO DO
------------------------------------------------------------

DO NOT:

- copy the reference game's branding
- copy another game's buttons
- use gold/brown as Q64's main theme
- make everything pure black
- generate UI text inside background artwork
- generate fake loading delays
- expose chain-of-thought
- make LUPUS unnecessarily slow
- hard-code Q64 directly into the entire LUPUS architecture
- make the game dependent on screenshots when structured game state is available
- create a fake "AI" that cannot actually play chess
- sacrifice gameplay performance for visual effects
- build dozens of unfinished features before core gameplay works

------------------------------------------------------------
50. IMPLEMENTATION PRIORITY
------------------------------------------------------------

Build in this order.

PHASE 1:
Foundation

- project setup
- routing
- design system
- responsive layout
- PWA foundation
- asset system

PHASE 2:
Startup Experience

- Dark Node launch screen
- animation
- Q64 loading screen
- loading logic
- transitions

PHASE 3:
Home

- Q64 home
- navigation
- profile
- play
- settings
- history
- puzzles
- learn

PHASE 4:
Chess Core

- board
- pieces
- rules
- moves
- captures
- check/checkmate
- clocks
- notation
- result

PHASE 5:
Game Modes

- Local
- Online architecture
- Computer
- LUPUS

PHASE 6:
LUPUS Game Agent

- game state adapter
- legal move interface
- action interface
- decision interface
- engine connection
- LUPUS profile

PHASE 7:
Chat

- game-native chat
- LUPUS context
- human-to-human chat architecture
- voice-ready interface

PHASE 8:
Analysis

- evaluation
- best move
- candidate moves
- variations
- move timeline
- game review
- decision summaries

PHASE 9:
Persistence

- accounts
- match history
- game records
- chat records
- analysis
- learning records

PHASE 10:
Learning

- post-game analysis
- learning records
- repeated pattern detection
- LUPUS memory integration

PHASE 11:
Polish

- animations
- transitions
- responsive refinement
- performance
- accessibility
- error handling
- loading states
- empty states

------------------------------------------------------------
51. DEVELOPMENT METHOD
------------------------------------------------------------

Do NOT attempt to blindly generate the entire application in one giant uncontrolled implementation.

First inspect the existing repository.

Identify:

- framework
- package manager
- current architecture
- existing components
- backend
- database
- authentication
- deployment configuration

Then produce a concise implementation plan.

Then build incrementally.

After each major phase:

- run the app
- test functionality
- check mobile layout
- check desktop layout
- fix errors
- verify existing functionality has not broken

Do not replace working architecture without a reason.

------------------------------------------------------------
52. VISUAL QUALITY STANDARD
------------------------------------------------------------

The final result should look like a serious commercial game prototype.

The user should feel:

"This is Q64."

Not:

"This is a React chess template."

Every screen should belong to the same world.

The visual relationship should be:

DARK NODE:
mysterious futuristic studio

Q64:
premium futuristic chess world

LUPUS:
intelligent AI chess opponent

------------------------------------------------------------
53. FINAL EXPERIENCE
------------------------------------------------------------

The intended user journey is:

OPEN Q64
↓
DARK NODE cinematic intro
↓
Q64 cinematic loading
↓
Q64 HOME
↓
PLAY
↓
VS LUPUS
↓
saved preferences automatically applied
↓
Q64 MATCH
↓
user plays
↓
LUPUS responds quickly
↓
CHAT available during game
↓
ANALYSIS available during game
↓
GAME ENDS
↓
RESULT
↓
GAME REVIEW
↓
ANALYSIS
↓
LEARNING RECORD
↓
MATCH SAVED
↓
LUPUS MEMORY UPDATED
↓
later user can ask LUPUS about the game
↓
LUPUS retrieves the match and continues the conversation

------------------------------------------------------------
54. FINAL INSTRUCTION
------------------------------------------------------------

Treat this document as the master product specification for Q64.

Do not omit major systems because they are not needed for the first prototype.

However, implement them in sensible phases.

Prioritize a working, beautiful core over unfinished complexity.

Use the supplied images as visual references.

The images intentionally separate:

1. cinematic artwork
2. coded UI
3. coded animation

Maintain that separation.

The generated cinematic backgrounds should be used as visual assets.

All important text, logos, buttons, progress bars, navigation, chat, analysis and interactive UI must be rendered by the application.

The Q64 interface must preserve the established dark navy + electric blue visual language.

The chess gameplay screen should remain visually close to the supplied Q64 match reference.

Do not drift into a pure-black or gold/brown visual style.

Do not replace Q64's identity with generic chess UI.

Build Q64 as a real standalone game created by Dark Node and designed from the beginning to integrate with the LUPUS Game Agent.

Before writing significant code, inspect the repository and explain the implementation plan.

Then begin implementation.

============================================================
END OF Q64 MASTER SPECIFICATION
============================================================
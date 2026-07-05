# UI/UX Design — Nex Staff

## Design Philosophy

### Two main screens

Nex Staff has **two complementary views** — not a traditional dashboard:

| View | Role | Game reference |
|------|------|----------------|
| **Workspace** | Top-down office floor — walk around, see staff, document room | Stardew Valley interior, Habbo room, old Sim office |
| **Dialogue** | NPC conversation when interacting with an agent | Pokémon, Final Fantasy dialogue box |

The user **explores the workspace** like a pixel office → **clicks a desk/NPC** → switches to dialogue mode.

### NPC Dialogue (not traditional chat)

All interaction mimics **conversation with an NPC in an 8-bit RPG** — no scrollable bubble chat like Messenger/ChatGPT. The user stands before a character (Assistant or Staff), reads the dialogue box at the bottom of the screen, and taps to continue or choose an option.

Visual references: Pokémon, Final Fantasy, Undertale, Stardew Valley dialogue system.

### Game-like

The user is the "boss" in a pixel office. Assistant = always-present NPC receptionist/coordinator. Staff = specialist NPCs who appear when called or when reporting finished work. Hire = recruit a character to the roster. Delegate = assign a quest.

### 8-bit retro aesthetic

Pixel art scene, sprite portraits, classic dialogue box, typewriter text, chiptune SFX (Phase 3). Core product identity — not a skin on a chat app.

### Unified rules (implementation contract)

Every screen and component must follow **one design system** — see issue [#16](https://github.com/tihado/nex-staff/issues/16) and `src/components/pixel/`.

| Layer | Rule |
|-------|------|
| **Tokens** | Use only palette/fonts in this doc — no one-off hardcoded colors |
| **Components** | Overlay, button, dialogue, notification → shared `Pixel*` components |
| **Patterns** | Workspace home + dialogue overlay — no extra dashboard/list views |
| **Assets** | Missing sprite → emoji fallback, but **chrome stays pixel** (border, font, HUD) |
| **shadcn** | Not for main UI; settings/admin only if needed |

**Review gate:** New UI PRs must pass the anti-patterns checklist at the end of this doc before merge.

---

## Core Pattern: RPG Dialogue System

```mermaid
stateDiagram-v2
    [*] --> NpcSpeaking: Agent response arrives
    NpcSpeaking --> WaitingAdvance: Typewriter complete
    WaitingAdvance --> NpcSpeaking: User presses advance, more text
    WaitingAdvance --> PlayerChoice: Choices offered
    WaitingAdvance --> PlayerInput: Free text needed
    WaitingAdvance --> Idle: Dialogue line done
    PlayerChoice --> NpcSpeaking: Choice selected
    PlayerInput --> NpcSpeaking: Text submitted
    Idle --> NpcSpeaking: New message / notification
```

**Golden rule (Dialogue):** Only **one active dialogue box** at a time — no scrollable history like a chat app. History is available via optional "Log" overlay.

---

## App Navigation

```mermaid
stateDiagram-v2
    [*] --> Workspace: Login / default home
    Workspace --> Dialogue: Click NPC desk / Reception
    Workspace --> ArchiveRoom: Click Archive room
    Workspace --> TaskBoard: Click Bulletin board
    Dialogue --> Workspace: Esc / "Back to workspace"
    ArchiveRoom --> Workspace: Close overlay
    TaskBoard --> Workspace: Close overlay
    Dialogue --> Dialogue: Switch speaker (staff cutscene)
```

| Action | From | To |
|--------|------|-----|
| Login | — | Workspace (spawn at Boss desk) |
| Click Reception | Workspace | Dialogue with Assistant |
| Click Staff desk | Workspace | Dialogue with that Staff member |
| Click Empty desk | Workspace | Hire flow (dialogue + choices) |
| Click Archive room | Workspace | Archive overlay |
| Click Task board | Workspace | Active tasks overlay |
| `Esc` / Back | Dialogue | Workspace |
| Task complete notification | Any | Workspace highlight desk + optional cutscene |

**Default home screen = Workspace** — not dialogue. Dialogue is the deep interaction mode.

---

## Workspace View

### Concept

Top-down (or slight isometric) pixel office the user can **walk around** and **interact** with zones. Each staff member has their own desk; status is shown visually (sitting, working, empty desk). Not a list/table — an **explorable space**.

### Floor Plan

```
┌─────────────────────────────────────────────────────────────────┐
│  ■ NEX STAFF — WORKSPACE              Floor 1    [?] [⚙]        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   ┌─────────────┐                        ┌──────────────────┐   │
│   │  ARCHIVE    │                        │   TASK BOARD     │   │
│   │  ROOM 📚    │                        │   📋 2 active    │   │
│   │  (documents)│                        │                  │   │
│   └─────────────┘                        └──────────────────┘   │
│                                                                 │
│         ┌────────┐  ┌────────┐  ┌────────┐  ┌────────┐         │
│         │ DESK   │  │ DESK   │  │ DESK   │  │ EMPTY  │         │
│         │ Alex   │  │ Sam    │  │ ◉ work │  │ + Hire │         │
│         │ Writer │  │Research│  │ Kim    │  │        │         │
│         │ ● idle │  │ ● idle │  │Analyst │  │        │         │
│         └────────┘  └────────┘  └────────┘  └────────┘         │
│                                                                 │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │              RECEPTION — Assistant 🤖                    │   │
│   │              "Hi boss! Click to talk"                     │   │
│   └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│                              ┌────────┐                         │
│                              │  BOSS  │  ← Player spawn        │
│                              │  DESK  │                         │
│                              │  👤    │                         │
│                              └────────┘                         │
│                                                                 │
│  [WASD / click-to-move]              [Talk: Enter / Click NPC] │
└─────────────────────────────────────────────────────────────────┘
```

### Zones (interactive areas)

| Zone | Location | Interaction | Opens |
|------|----------|-------------|-------|
| **Reception** | Bottom-center | Talk to Assistant | Dialogue mode |
| **Staff desks** | Open floor grid | Talk to staff / view status | Dialogue mode |
| **Empty desks** | Unhired slots | Hire new staff | Hire dialogue flow |
| **Archive Room** | Top-left | Manage documents | Archive overlay |
| **Task Board** | Top-right | View running tasks | Task board overlay |
| **Boss Desk** | Bottom | Spawn point; click = quick menu | Quick menu overlay |

### Desk States (visual)

| State | Visual | Animation |
|-------|--------|-----------|
| `idle` | NPC at desk, green status dot | 2-frame typing idle |
| `working` | NPC + papers/screen glow, yellow dot | Fast typing, occasional sparkle |
| `done` | `!` emote bubble above head | Bounce until user clicks |
| `empty` | Desk + chair, "FOR HIRE" sign | Subtle blink on sign |
| `offline` | Desk empty, grayed out | None |

```typescript
interface WorkspaceDesk {
  id: string;
  staffId?: string;          // null = empty desk
  gridPosition: { x: number; y: number };
  state: "idle" | "working" | "done" | "empty" | "offline";
  label: string;             // "Alex — Writer"
}
```

### Player Movement

**Desktop:**
- **Click-to-move**: click tile → player sprite pathfinds there (A* on grid)
- **WASD / Arrow keys**: move in 4 directions (grid-based, 16px per step)
- Stand next to interactive zone + **Enter** or **click zone** → activate

**Mobile:**
- Tap zone directly (no walk required — auto pathfind)
- Virtual D-pad optional

```typescript
interface WorkspacePlayer {
  position: { x: number; y: number };  // grid coords
  direction: "up" | "down" | "left" | "right";
  sprite: string;
}
```

### Archive Room

Overlay styled as a **game storage room** — pixel bookshelves, each document = one item on a shelf.

```
╔═ ARCHIVE ROOM ═══════════════════════════════════ [X] ═╗
║                                                        ║
║   ┌────┐  ┌────┐  ┌────┐  ┌────┐  ┌────┐             ║
║   │PDF │  │ MD │  │PDF │  │ +  │  │    │   ← shelves  ║
║   │spec│  │readme│ │report│ │upload│       row 1    ║
║   └────┘  └────┘  └────┘  └────┘  └────┘             ║
║                                                        ║
║   ┌────┐  ┌────┐                                       ║
║   │URL │  │    │                          row 2       ║
║   │clip│  │    │                                       ║
║   └────┘  └────┘                                       ║
║                                                        ║
║  Selected: product-spec.pdf (12 chunks)  [Delete] [Assign staff] ║
╚════════════════════════════════════════════════════════╝
```

**Actions:**
- Click item → preview metadata + chunk count
- `+` slot → upload (file picker or URL paste)
- "Assign staff" → choose which staff can access this document
- Drag item to staff desk (Phase 2) — visual document linking

### Task Board

Bulletin board — sticky notes show **real-time progress** from `task.progress` SSE.

```
╔═ TASK BOARD ═══════════════════════════════════════ [X] ═╗
║  ┌──────────────┐  ┌──────────────┐                       ║
║  │ ▶ Write blog │  │ ◉ Research   │                       ║
║  │ Alex         │  │ Sam          │                       ║
║  │ ████░░ 45%   │  │ ██░░░░ 30%   │  ← progress bar      ║
║  │ Writing...   │  │ Searching... │  ← currentStep       ║
║  └──────────────┘  └──────────────┘                       ║
╚══════════════════════════════════════════════════════════╝
```

Click sticky note → dialogue with that staff member or preview overlay (`get_task_preview`).

### Workspace → Dialogue Transition

When the user activates an NPC (Reception or desk):

1. Camera **zoom/pan** to NPC (300ms step animation, no smooth ease — retro cut)
2. Dialogue box **slides up** from bottom
3. Workspace still visible behind (dimmed 50%) or frozen
4. `Esc` → dialogue closes, camera pans back to player position

```typescript
type AppView = "workspace" | "dialogue" | "overlay";

interface AppState {
  view: AppView;
  overlay?: "archive" | "task-board" | "deliverable" | "party-roster" | "log";
  dialogueTarget?: { type: "assistant" } | { type: "staff"; staffId: string };
  player: WorkspacePlayer;
  desks: WorkspaceDesk[];
}
```

### Workspace Component Tree

```
<WorkspaceScreen>
  <WorkspaceHUD />                    // floor label, staff count
  <WorkspaceFloor map={officeMap} />  // tilemap renderer
  <WorkspaceDesks desks={desks} />    // interactive desk zones
  <WorkspaceNPCs />                   // staff + assistant sprites
  <WorkspacePlayer />                 // boss sprite, movement
  <WorkspaceZones />                  // archive, task board hit areas
  {view === "dialogue" && (
    <DialogueOverlay dimmed>
      <DialogueBox ... />
      <ChoiceMenu ... />
    </DialogueOverlay>
  )}
  {overlay === "archive" && <ArchiveRoomOverlay />}
  {overlay === "task-board" && <TaskBoardOverlay />}
</WorkspaceScreen>
```

### Tilemap Spec

| Layer | Content |
|-------|---------|
| `floor` | Carpet/wood tiles |
| `walls` | Office walls, windows |
| `furniture` | Desks, chairs, shelves (non-interactive) |
| `interactive` | Click zones (invisible or highlighted on hover) |
| `entities` | Player + NPC sprites (rendered above) |

- Tile size: **16×16px**
- Map size: **32×24 tiles** (512×384 native, scaled to fit viewport)
- Format: JSON tilemap (Tiled editor) or 2D array in code

### Hire Flow on Workspace

1. User clicks **Empty desk** or "FOR HIRE" sign
2. Camera pans to desk
3. Dialogue: Assistant appears (walks from reception) — "Who should we hire for this desk?"
4. After successful hire:
   - Desk state: `empty` → `idle`
   - NPC sprite spawns in chair
   - Particle effect "✨ New hire!"
   - Quest banner: "{name} joined the team!"

---

## Visual Language

### Typography

| Use              | Font           | Fallback  |
| ---------------- | -------------- | --------- |
| NPC name plate   | Press Start 2P | monospace |
| Dialogue body    | VT323          | monospace |
| Choice menu      | Press Start 2P | monospace |
| Code/deliverable | JetBrains Mono | monospace |

```css
@import url("https://fonts.googleapis.com/css2?family=Press+Start+2P&family=VT323&display=swap");

:root {
  --font-pixel: "Press Start 2P", monospace;
  --font-body: "VT323", monospace;
  --font-size-dialogue: 22px;
  --font-size-nameplate: 10px;
  --line-height: 1.5;
}
```

### Color Palette

| Token               | Hex       | Usage                               |
| ------------------- | --------- | ----------------------------------- |
| `--bg-scene`        | `#1A0F3D` | Office/scene background             |
| `--bg-dialogue`     | `#0F0829` | Dialogue box fill                   |
| `--border-dialogue` | `#F0F0F0` | Dialogue box border (classic white) |
| `--accent`          | `#7EC8E3` | Choice highlight, active cursor     |
| `--highlight`       | `#FFE66D` | Important words, quest items        |
| `--success`         | `#4ECDC4` | Quest complete, staff idle          |
| `--alert`           | `#FF6B6B` | Errors, exclamation                 |
| `--text-primary`    | `#F0F0F0` | Dialogue text                       |
| `--text-muted`      | `#8888AA` | Secondary, log entries              |
| `--nameplate-bg`    | `#2D1B69` | NPC name tab background             |
| `--choice-bg`       | `#1E3A5F` | Choice button default               |
| `--choice-hover`    | `#7EC8E3` | Choice button selected              |

> **Removed** `--bubble-user/assistant/staff` — chat bubbles are not used.

### Sprites

| Asset            | Size                          | Usage                                 |
| ---------------- | ----------------------------- | ------------------------------------- |
| Scene background | 320×180 or 480×270 (scaled) | Pixel office interior                 |
| NPC portrait     | 96×96 or 128×128            | In dialogue box, overlapping left edge |
| NPC overworld    | 32×32 or 48×48              | Workspace floor + dialogue scene |
| Emote icons      | 16×16                         | `!` `?` `♪` when staff report in      |

```css
.sprite,
.portrait {
  image-rendering: pixelated;
  image-rendering: crisp-edges;
}
```

---

## Dialogue Overlay Layout

Dialogue appears as an **overlay on the Workspace** (workspace dimmed 50% behind). Not a separate full screen.

### Desktop — Dialogue overlay

```
┌─────────────────────────────────────────────────────────────┐
│  ■ NEX STAFF — WORKSPACE (dimmed)           [Log]  [⚙]     │
├─────────────────────────────────────────────────────────────┤
│  ... workspace floor visible but dimmed ...                 │
│              ┌────┐                                         │
│              │ 🤖 │  ← zoomed NPC                           │
│              └────┘                                         │
│  ┌────────┐ ┌─────────────────────────────────────────────┐ │
│  │Portrait│ │ ▼ Assistant                                 │ │
│  │ 96×96  │ │ Hi boss! What do you need today?█  ▼ Continue │ │
│  └────────┘ └─────────────────────────────────────────────┘ │
│  [ Choice A ]  [ Choice B ]              [Esc: Back]        │
└─────────────────────────────────────────────────────────────┘
```

### Dialogue Box Anatomy

```
┌──────────────────────────────────────────────────┐
│┌──────────┐                                     │
││          │  ┌─ Assistant ─────────────────────┐ │  ← Name plate (attached to top edge)
││ Portrait │  │                                 │ │
││          │  │  Dialogue text types here...    │ │  ← Body (2-4 lines visible)
││  96×96   │  │  with typewriter effect.█       │ │
││          │  │                                 │ │
│└──────────┘  │                    ▼ Continue  │ │  ← Blinking advance prompt
│              └─────────────────────────────────┘ │
└──────────────────────────────────────────────────┘
     ↑ 4px white border + 4px dark shadow (classic RPG)
```

### Mobile — Workspace

- Tilemap scroll/pinch; tap zone to interact
- Overlays full-screen
- Dialogue overlay: portrait 64×64, choices stack vertical

### Mobile — Dialogue overlay

- Portrait 64×64
- Choices stack vertical full-width
- Tap dialogue box = advance

---

## Dialogue States

### 1. `npc-speaking`

NPC is "speaking". Text streamed from AI is buffered into **lines** (split by sentence / 80 characters), shown sequentially with typewriter effect.

```typescript
interface DialogueLine {
  speakerId: string; // "assistant" | staff uuid
  speakerName: string;
  speakerRole?: string;
  portraitSprite: string;
  text: string;
  emotion?: "neutral" | "happy" | "think" | "alert";
}
```

- Streaming from AI: buffer tokens → on `.` `!` `?` or 80 chars → push new line
- Each line: typewriter 30-40 chars/sec
- Portrait can change expression per `emotion`

### 2. `waiting-advance`

Typewriter finished. Blinking `▼ Continue` in bottom-right corner.

- **Click / Enter / Space** → next line or state change
- Sound: blip SFX (Phase 3)

### 3. `player-choice`

Instead of free text — show RPG-style choice menu.

**Use when:**

- Hire flow: "Yes / No / Tell me more"
- Delegate confirm: "Delegate to Alex / Hire new / Not now"
- Deliverable: "View result / Delegate more / Dismiss"
- Quick actions: preset intents

```
┌─────────────────────────────────┐
│  ▶ Yes, hire Content Writer     │  ← Cursor selectable (arrow ▶)
│    Not now                       │
│    Tell me more about this role  │
└─────────────────────────────────┘
```

- **Arrow keys / W-S** navigate
- **Enter** confirm
- Selected choice highlighted `--choice-hover`

### 4. `player-input`

When free text is needed (project description, task brief, custom answer).

Dialogue box switches to input mode — **not a separate input bar**:

```
┌──────────────────────────────────────────────────┐
│  ▼ Boss                                          │
│                                                  │
│  Write a blog about AI agents for founders█     │  ← Blinking cursor
│                                                  │
│                              [Send ▶]  [📎]       │
└──────────────────────────────────────────────────┘
```

- Name plate shows "Boss" or user name
- Portrait = player sprite (or no portrait)
- Submit → short line in log → back to `npc-speaking`

### 5. `cutscene-notify`

Staff completes task — NPC "walks in" with emote.

```
Scene: Alex sprite walks in from right + "!" emote bubble
Dialogue box switches to Alex portrait:
  "Boss! The blog post is done!"
Choices: [ View result ] [ Thanks ]
```

---

## Components

### 1. WorkspaceFloor

Tilemap renderer — top-down office floor with desks, zones, player movement.

```typescript
interface WorkspaceFloorProps {
  tilemap: TilemapData;
  desks: WorkspaceDesk[];
  player: WorkspacePlayer;
  onZoneActivate: (zone: WorkspaceZone) => void;
}
```

### 2. WorkspacePlayer

Boss sprite — grid movement, click-to-move pathfinding.

### 3. WorkspaceDesk

Interactive desk entity — staff sprite, status indicator, click handler.

### 4. DialogueBox

Central component — fully replaces ChatMessage list.

```typescript
interface DialogueBoxProps {
  state:
    | "npc-speaking"
    | "waiting-advance"
    | "player-choice"
    | "player-input"
    | "idle";
  line?: DialogueLine;
  choices?: DialogueChoice[];
  onAdvance: () => void;
  onChoice: (choiceId: string) => void;
  onSubmit: (text: string) => void;
}

interface DialogueChoice {
  id: string;
  label: string;
  shortcut?: string; // "A", "B", "C"
}
```

**Typewriter implementation:**

```tsx
function TypewriterText({
  text,
  onComplete,
}: {
  text: string;
  onComplete: () => void;
}) {
  const [displayed, setDisplayed] = useState("");
  // Advance 1 char per 25ms; onComplete when done
  return (
    <span>
      {displayed}
      <span className="cursor-blink">█</span>
    </span>
  );
}
```

### 3. Portrait

NPC portrait at left of dialogue box, overlapping border.

- Swap sprite when speaker changes
- Subtle bounce on speaker change
- Expression variants: `neutral`, `happy`, `think`, `alert` (4 frames per NPC)

### 4. ChoiceMenu

Vertical list of pixel buttons in/below dialogue box.

- Keyboard navigable
- Max 4 choices visible (scroll if more)
- Hire flow uses choices instead of free text when possible

### 5. DialogueInput

Embedded input in dialogue box (`player-input` state).

- No separate input bar at bottom
- `📎` attach in dialogue box corner
- Enter submit, Shift+Enter newline
- **Voice (planned):** push-to-talk mic `[🎤]` — see [Voice in Dialogue](#voice-in-dialogue-planned)

### Voice in Dialogue (planned)

Voice complements RPG dialogue — does **not** replace scroll chat. Details: [VOICE-CHAT.md](VOICE-CHAT.md).

| Mode | Input | Output |
| ---- | ----- | ------ |
| V1 (Phase 2) | Hold mic → STT → text in box → Send | NPC line TTS after typewriter (toggle) |
| V2 (Phase 3) | Streaming partial transcript; voice choices | Sentence-chunk TTS + chiptune mic SFX |

**States:**

```
player-input + mic hold  →  listening (pulse border)
release                  →  transcribing (mic spinner)
success                  →  text in dialogue box → user confirms Send
npc-speaking + TTS on    →  play audio after typewriter; skip on advance
```

**Rules:**

- Mic **disabled** when `isBusy` (Assistant streaming)
- Task Board / Archive overlays **text-only** in V1
- Transcript always visible in dialogue box / Log (captions)

**Component (planned):** `VoiceControl` — pixel mic button, composes into `DialogueInput`.

### 6. DialogueLog (overlay)

Optional scrollable history — open via `[Log]` on HUD.

```
┌─ LOG ──────────────────────────────── [X] ─┐
│ Assistant: Hi boss!                        │
│ Boss: Write a blog about AI agents         │
│ Assistant: Delegated to Alex!              │
│ Alex: The blog post is done!               │
└────────────────────────────────────────────┘
```

- This is the **only** place to see full history as a list
- Hidden by default — preserves RPG immersion

### 7. ArchiveRoomOverlay

Archive Room — pixel bookshelves, upload, assign staff. See [Workspace View](#archive-room).

### 8. TaskBoardOverlay

Bulletin board sticky notes for active tasks.

### 9. StaffRosterPanel

Party menu overlay — grid of StaffCards (from earlier design).

```
╔═ PARTY ═══════════════════════╗
║ ┌────┐ Alex    Writer  ●idle ║
║ ┌────┐ Sam     Researcher    ║
║ [+ Hire new member]          ║
╚══════════════════════════════╝
```

### 8. DeliverablePreview

Not inline in dialogue scroll — opens as **item inspect screen** (game inventory style).

```
╔═ DELIVERABLE ════════════════════════════╗
║  AI Agents Blog Post                      ║
║  ─────────────────────────────────────   ║
║  # AI Agents                              ║
║  Lorem ipsum...                           ║
║                                           ║
║  [Copy]  [Download]  [Close]             ║
╚═══════════════════════════════════════════╝
```

### 9. QuestNotification

Staff task complete = RPG quest complete banner.

```
┌────────────────────────────────┐
│ ★ QUEST COMPLETE ★             │
│ "Write a blog about AI agents" │
│ Alex completed the task!       │
└────────────────────────────────┘
```

- Slide down from top, pixel font
- Auto-trigger `cutscene-notify` dialogue after 1.5s

---

## Interaction Mapping

| User action | UI pattern | Do not use |
| --- | --- | --- |
| Explore office | Workspace tilemap + walk/click | Dashboard sidebar |
| Talk to Assistant | Click Reception → dialogue overlay | Chat bubble |
| Talk to Staff | Click desk → dialogue overlay | Chat bubble |
| Hire staff | Click empty desk → hire dialogue | Form modal |
| View documents | Archive Room overlay | File manager table |
| View tasks | Task Board overlay | Task list table |
| Delegate work | Dialogue `player-choice` | Inline bubble |
| Receive results | Desk `!` emote + cutscene dialogue | Toast chat message |
| Upload file | Archive Room `+` slot | Drag-drop zone |
| View history | Log overlay | Scroll chat |

---

## Hire Flow (NPC style)

```
[Assistant portrait]
"You need someone to write a blog. Want to hire a Content Writer?"

Choices:
  ▶ Yes, hire now!
    Tell me more first
    Not now

→ User chooses "Yes, hire now!"

[Assistant portrait, think expression]
"What writing tone should they use?"

Choices:
  ▶ Casual — startup founders
    Formal — enterprise
    Technical — developers
    Describe it yourself...

→ User chooses or types input

[Cutscene: Alex walks in]

[Alex portrait]
"Hi boss! I'm Alex, Content Writer. Ready to write!"

[Quest banner: "Alex joined the party!"]
```

---

## Data Flow (UI layer)

`useChat` still powers the backend — UI layer transforms messages into dialogue sequence:

```typescript
function useDialogueEngine(messages: UIMessage[]) {
  // 1. Buffer assistant stream → DialogueLines
  // 2. Track current line index
  // 3. Expose state machine: speaking | advance | choice | input
  // 4. On user submit → sendMessage via useChat
  // 5. Parse tool results → auto-generate choices
  //    e.g. hire_staff proposed → inject Yes/No choices
}
```

**Tool result → Choice mapping:**

| Tool result             | Auto choices                                 |
| ----------------------- | -------------------------------------------- |
| `delegate_task` success | "Continue with something else" / "View task status" |
| `hire_staff` proposed   | "Hire" / "Tell me more" / "Cancel"           |
| `task.completed` SSE    | "View result" / "Thanks"                     |
| `list_staff`            | Staff names as choices → `/status`           |

---

## Slash Commands

Still supported but **hidden** — power users only. In `player-input`, typing `/` opens a game-style cheat command palette:

| Command        | Effect                        |
| -------------- | ----------------------------- |
| `/staff`       | Open party roster overlay     |
| `/hire [role]` | Trigger hire dialogue         |
| `/tasks`       | Quest log overlay             |
| `/docs`        | Inventory-style document list |
| `/log`         | Open dialogue history         |
| `/help`        | Tutorial dialogue sequence    |

---

## Animations

| Animation      | Trigger           | Style                         |
| -------------- | ----------------- | ----------------------------- |
| Typewriter     | `npc-speaking`    | 25ms/char, cursor blink       |
| Advance prompt | `waiting-advance` | `▼` blink 500ms step          |
| Portrait swap  | Speaker change    | 1-frame cut + bounce          |
| Walk-in        | Staff cutscene    | 8-frame slide from edge       |
| Choice cursor  | `player-choice`   | `▶` slide between options     |
| Quest complete | Task done         | Banner slide + star particles |
| Scene idle     | Background        | 2-frame assistant bob loop    |

```css
@keyframes blink {
  0%,
  50% {
    opacity: 1;
  }
  51%,
  100% {
    opacity: 0;
  }
}

@keyframes advance-prompt {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(3px);
  }
}

.cursor-blink,
.advance-indicator {
  animation: blink 1s step-end infinite;
}
```

---

## Responsive

| Breakpoint   | Scene                      | Dialogue box | Portrait               |
| ------------ | -------------------------- | ------------ | ---------------------- |
| `≥ 1024px`   | 60% height, 480×270 scaled | 40% height   | 96×96                  |
| `768–1023px` | 50%                        | 50%          | 80×80                  |
| `< 768px`    | 35% (minimal)              | 55%          | 64×64, overlap reduced |

---

## Asset Requirements

### Workspace tilemap

| Asset | Spec |
|-------|------|
| Floor tiles | 16×16 carpet, wood, tile variants |
| Wall tiles | 16×16 walls, windows, doors |
| Desk furniture | 32×32 desk + chair sets (4 orientations) |
| Archive shelves | 32×48 bookshelf sprites |
| Task board | 48×32 bulletin board + sticky note 16×16 |
| Reception counter | 64×32 |
| Empty desk sign | 16×16 "FOR HIRE" |
| Zone highlight | 16×16 semi-transparent tile (hover) |

### Scene (dialogue overlay)

| Asset             | Spec                                  |
| ----------------- | ------------------------------------- |
| Office background | 480×270px, parallax layers optional   |
| Reception desk    | Part of background or separate sprite |

### Portraits (per NPC)

| NPC         | Expressions needed           |
| ----------- | ---------------------------- |
| Assistant   | neutral, happy, think, alert |
| Writer      | neutral, happy, think        |
| Researcher  | neutral, think, alert        |
| Analyst     | neutral, think               |
| Player/Boss | neutral only (optional)      |

### UI Chrome

- Dialogue box 9-slice border (scalable pixel border)
- Name plate tab sprite
- Choice button states (default, hover, selected)
- Quest complete banner
- Advance `▼` indicator
- Emote bubbles (`!`, `?`, `♪`, `★`)

### Audio (Phase 3)

- Text blip (per char or per word)
- Menu move / select
- Quest complete jingle
- Walk-in footstep

---

## Accessibility

- Dialogue box: `role="dialog"`, `aria-live="polite"` for typewriter text
- Choices: `role="menu"`, arrow key navigation, `aria-selected`
- `prefers-reduced-motion`: skip typewriter (show full text instantly), no walk-in
- High contrast mode: thicker dialogue border
- Keyboard: Space/Enter advance, Esc close overlays

---

## Phase 0 Fallback

**Workspace:**
- Grid CSS instead of tilemap (colored cells)
- Emoji for NPCs at desk positions
- Click zones as dashed borders
- No walk animation — click zone = instant interact

**Dialogue:**

- Scene: solid color `#1A0F3D` + emoji NPC in center
- Portrait: 64px emoji in box
- Dialogue box: CSS pixel border (no 9-slice sprite needed)
- Typewriter still works — core experience does not depend on assets

---

## Anti-patterns

| Do not do                                | Reason                                  |
| ---------------------------------------- | --------------------------------------- |
| Scrollable message list as main UI       | Breaks RPG immersion                    |
| Fixed input bar separate from dialogue box | Does not feel like 8-bit game          |
| Left/right chat bubbles                  | Chat app, not NPC dialogue              |
| Small 32px avatar in bubble              | Use 96px portrait overlapping box       |
| Dashboard sidebar / data tables | Breaks game immersion |
| List view as home screen | Workspace tilemap is home |

---

## Related docs

- [PRD.md](PRD.md) — User stories
- [API.md](API.md) — SSE events trigger cutscene-notify
- [ROADMAP.md](ROADMAP.md) — Phase 1: dialogue system + 8-bit assets

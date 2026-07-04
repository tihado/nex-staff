import { MAX_STAFF_PER_USER } from "@/lib/staff/constants";

export type AgentEmote =
  | "thinking"
  | "idea"
  | "done"
  | "notify"
  | "failed"
  | null;

export type AgentLocation = "desk" | "pantry" | "roaming";

export type DeskState =
  | "empty"
  | "idle"
  | "working"
  | "done"
  | "failed"
  | "offline";

/** Sprite scale for desks and staff on the workspace floor. */
export const WORKSPACE_DESK_SPRITE_SIZE = 84;
export const WORKSPACE_AGENT_SPRITE_SIZE = 64;

/** Percentage anchor (of the floor container) used for absolute positioning. */
export interface FloorAnchor {
  left: number;
  top: number;
}

export interface DeskSlot {
  /** Character anchor when seated (toward viewer / below desk). */
  agentAnchor: FloorAnchor;
  /** Desk furniture anchor in the work area. */
  anchor: FloorAnchor;
  /** Logical grid coordinate (kept for the issue's WorkspaceDesk contract). */
  gridPosition: { x: number; y: number };
  id: string;
}

export interface WorkspaceDesk {
  avatarSprite?: string;
  emote: AgentEmote;
  gridPosition: { x: number; y: number };
  id: string;
  label: string;
  location: AgentLocation;
  /** Task awaiting user review — set when desk state is `done`. */
  pendingTaskId?: string | null;
  progress: number;
  role?: string;
  staffId?: string;
  state: DeskState;
}

/** Archive filing-room alcove in the top-left work area. */
export const ARCHIVE_ROOM = {
  anchor: { left: 14, top: 18 },
  bounds: { left: 4, top: 6, width: 22, height: 22 },
  props: [
    { id: "archive-cabinet-1", left: 6, top: 10 },
    { id: "archive-cabinet-2", left: 12, top: 10 },
    { id: "archive-shelf-1", left: 18, top: 8 },
    { id: "archive-shelf-2", left: 24, top: 8 },
    { id: "archive-partition", left: 26, top: 14 },
  ],
} as const;

/** Keep desk rows outside the archive alcove (bounds end ~26% left, ~28% top). */
export const WORK_AREA_DESK_BOUNDS = {
  minLeft: 32,
  maxLeft: 54,
  minTop: 34,
} as const;

/** Task board whiteboard on the upper-right work-area wall. */
export const TASK_BOARD_ZONE = {
  anchor: { left: 48, top: 14 },
  wallAnchor: { left: 52, top: 10 },
} as const;

/** Roam zones for idle staff — random jitter within each zone avoids overlap. */
export interface OfficeWanderZone {
  center: FloorAnchor;
  radius: { left: number; top: number };
}

export const OFFICE_WANDER_BOUNDS = {
  minLeft: WORK_AREA_DESK_BOUNDS.minLeft,
  maxLeft: WORK_AREA_DESK_BOUNDS.maxLeft,
  minTop: WORK_AREA_DESK_BOUNDS.minTop,
  maxTop: 72,
} as const;

export const STAFF_WANDER_MIN_DISTANCE = 5;

/** Vertical gap between staggered desk rows (% of floor height). */
const DESK_ROW_STEP = 11;
const DESK_ROW_TOP_START = WORK_AREA_DESK_BOUNDS.minTop;
const DESK_AGENT_TOP_OFFSET = 6;

/** Five brick rows × two desks — offset rows, clear of archive on the left. */
const DESK_ROW_LAYOUT = [
  { lefts: [32, 48] },
  { lefts: [40, 54] },
  { lefts: [32, 48] },
  { lefts: [40, 54] },
  { lefts: [32, 48] },
] as const;

function buildWorkspaceDeskSlots(): DeskSlot[] {
  const slots: DeskSlot[] = [];
  let deskIndex = 0;

  for (let row = 0; row < DESK_ROW_LAYOUT.length; row += 1) {
    const { lefts } = DESK_ROW_LAYOUT[row];
    const top = DESK_ROW_TOP_START + row * DESK_ROW_STEP;

    for (let col = 0; col < lefts.length; col += 1) {
      deskIndex += 1;
      const left = lefts[col];

      slots.push({
        id: `desk-${deskIndex}`,
        gridPosition: { x: col, y: row },
        anchor: { left, top },
        agentAnchor: { left, top: top + DESK_AGENT_TOP_OFFSET },
      });
    }
  }

  return slots.slice(0, MAX_STAFF_PER_USER);
}

/**
 * Staff desk slots — multi-row brick layout across the work area (10 desks max).
 */
export const WORKSPACE_DESK_SLOTS: DeskSlot[] = buildWorkspaceDeskSlots();

export const OFFICE_WANDER_ZONES: OfficeWanderZone[] = WORKSPACE_DESK_SLOTS.map(
  (slot) => ({
    center: slot.agentAnchor,
    radius: { left: 2.5, top: 2.5 },
  })
);

export function workspaceDeskSlot(deskId: string): DeskSlot | undefined {
  return WORKSPACE_DESK_SLOTS.find((slot) => slot.id === deskId);
}

/** Bookshelves along the upper work-area wall — spaced apart, clear of archive & desks. */
export const WORKSPACE_BOOKSHELVES: Array<
  FloorAnchor & { id: string; size: number }
> = [
  { id: "shelf-a", left: 34, top: 11, size: 38 },
  { id: "shelf-b", left: 42, top: 11, size: 38 },
];

/** Waypoints for the office cat — aisles between staggered desk rows. */
export const CAT_WANDER_ANCHORS: FloorAnchor[] = [
  { left: 12, top: 48 },
  { left: 28, top: 48 },
  { left: 36, top: 42 },
  { left: 50, top: 40 },
  { left: 40, top: 54 },
  { left: 36, top: 62 },
  { left: 50, top: 60 },
  { left: 44, top: 72 },
];

export function catAnchorForIndex(index: number): FloorAnchor {
  return CAT_WANDER_ANCHORS[index % CAT_WANDER_ANCHORS.length];
}

/** Corridor plants — left aisle between archive/meeting and desk grid. */
export const WORKSPACE_CORRIDOR_PROPS: Array<
  FloorAnchor & { id: string; type: "plant" }
> = [
  { id: "corridor-plant-1", left: 28, top: 52, type: "plant" },
  { id: "corridor-plant-2", left: 28, top: 66, type: "plant" },
];

/** Pantry cafe tables + surrounding chairs. */
export interface PantryCafeCluster {
  chairs: Array<FloorAnchor & { id: string; size?: number }>;
  id: string;
  table: FloorAnchor & { size: number };
}

export const PANTRY_CAFE_CLUSTERS: PantryCafeCluster[] = [
  {
    id: "cafe-left",
    table: { left: 68, top: 28, size: 44 },
    chairs: [
      { id: "cafe-left-1", left: 63, top: 31, size: 28 },
      { id: "cafe-left-2", left: 73, top: 31, size: 28 },
    ],
  },
  {
    id: "cafe-right",
    table: { left: 88, top: 28, size: 44 },
    chairs: [
      { id: "cafe-right-1", left: 83, top: 31, size: 28 },
      { id: "cafe-right-2", left: 93, top: 31, size: 28 },
    ],
  },
];

/** Extra pantry decor along the lower pantry edge. */
export const PANTRY_LOWER_PROPS: Array<
  FloorAnchor & { id: string; type: "chair" | "mug" | "plant" }
> = [
  { id: "pantry-chair-1", left: 72, top: 38, type: "chair" },
  { id: "pantry-chair-2", left: 84, top: 38, type: "chair" },
  { id: "pantry-mug-1", left: 78, top: 36, type: "mug" },
  { id: "pantry-plant-1", left: 66, top: 39, type: "plant" },
  { id: "pantry-plant-2", left: 90, top: 39, type: "plant" },
];

/** Hangout zone in the pantry — agents stand in the aisle between cafe clusters. */
export const PANTRY_ANCHORS: FloorAnchor[] = [
  { left: 78, top: 30 },
  { left: 74, top: 33 },
  { left: 82, top: 33 },
  { left: 70, top: 35 },
  { left: 86, top: 35 },
  { left: 76, top: 37 },
  { left: 80, top: 37 },
  { left: 72, top: 38 },
  { left: 84, top: 38 },
  { left: 88, top: 36 },
];

/** Small meeting-room alcove — left column below archive, clear of desk grid. */
export const MEETING_ROOM = {
  /** Click target at the room entrance (sign sits above, not on furniture). */
  anchor: { left: 14, top: 36 },
  bounds: { left: 4, top: 35, width: 22, height: 22 },
  table: { left: 14, top: 47 },
  chairs: [
    { id: "meet-chair-1", left: 9, top: 44 },
    { id: "meet-chair-2", left: 19, top: 44 },
    { id: "meet-chair-3", left: 9, top: 51 },
    { id: "meet-chair-4", left: 19, top: 51 },
  ],
  props: [
    { id: "meet-partition", left: 25, top: 46, type: "partition" as const },
    { id: "meet-plant", left: 7, top: 53, type: "plant" as const },
  ],
  rug: { left: 14, top: 47, size: 52 },
} as const;

/** Reception — centered desk + cohesive waiting lounge. */
export const RECEPTION_ROOM = {
  /** Visual center of the reception zone (58–100% left, 42–100% top). */
  center: { left: 79, top: 74 },
  desk: { left: 79, top: 64 },
  assistantAnchor: { left: 79, top: 71 },
  /** Waiting lounge stacked on one rug, centered below the desk. */
  waiting: {
    anchor: { left: 79, top: 82 },
    rug: { size: 84 },
    sofa: { size: 56 },
    teaTable: { size: 36 },
  },
  props: [
    {
      id: "reception-shelf-left",
      left: 64,
      top: 60,
      type: "bookshelf" as const,
    },
    {
      id: "reception-shelf-right",
      left: 94,
      top: 60,
      type: "bookshelf" as const,
    },
    { id: "reception-plant-left", left: 62, top: 92, type: "plant" as const },
    { id: "reception-plant-right", left: 96, top: 92, type: "plant" as const },
  ],
} as const;

export const RECEPTION_ANCHOR: FloorAnchor = RECEPTION_ROOM.assistantAnchor;

export function pantryAnchorForIndex(index: number): FloorAnchor {
  return PANTRY_ANCHORS[index % PANTRY_ANCHORS.length];
}

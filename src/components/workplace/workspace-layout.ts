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
export const WORKSPACE_DESK_SPRITE_SIZE = 100;
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
    { id: "archive-cabinet-1", left: 7, top: 12 },
    { id: "archive-cabinet-2", left: 11, top: 11 },
    { id: "archive-shelf-1", left: 16, top: 10 },
    { id: "archive-shelf-2", left: 20, top: 11 },
    { id: "archive-partition", left: 26, top: 16 },
  ],
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
  minLeft: 12,
  maxLeft: 54,
  minTop: 32,
  maxTop: 74,
} as const;

export const STAFF_WANDER_MIN_DISTANCE = 5;

export const OFFICE_WANDER_ZONES: OfficeWanderZone[] = [
  { center: { left: 20, top: 40 }, radius: { left: 3.5, top: 3.5 } },
  { center: { left: 32, top: 48 }, radius: { left: 3.5, top: 3.5 } },
  { center: { left: 16, top: 58 }, radius: { left: 3, top: 3 } },
  { center: { left: 40, top: 36 }, radius: { left: 3.5, top: 3 } },
  { center: { left: 28, top: 66 }, radius: { left: 3, top: 3 } },
  { center: { left: 46, top: 52 }, radius: { left: 3, top: 3 } },
  { center: { left: 24, top: 72 }, radius: { left: 2.5, top: 2.5 } },
];

/**
 * Staff desk slots — 3×2 grid in the work area. Supports up to MAX_STAFF_PER_USER.
 */
export const WORKSPACE_DESK_SLOTS: DeskSlot[] = [
  {
    id: "desk-1",
    gridPosition: { x: 0, y: 0 },
    anchor: { left: 16, top: 34 },
    agentAnchor: { left: 16, top: 47 },
  },
  {
    id: "desk-2",
    gridPosition: { x: 1, y: 0 },
    anchor: { left: 30, top: 34 },
    agentAnchor: { left: 30, top: 47 },
  },
  {
    id: "desk-3",
    gridPosition: { x: 2, y: 0 },
    anchor: { left: 44, top: 34 },
    agentAnchor: { left: 44, top: 47 },
  },
  {
    id: "desk-4",
    gridPosition: { x: 0, y: 1 },
    anchor: { left: 16, top: 50 },
    agentAnchor: { left: 16, top: 63 },
  },
  {
    id: "desk-5",
    gridPosition: { x: 1, y: 1 },
    anchor: { left: 30, top: 50 },
    agentAnchor: { left: 30, top: 63 },
  },
].slice(0, MAX_STAFF_PER_USER);

/** Bookshelves along work-area walls — clear of archive alcove. */
export const WORKSPACE_BOOKSHELVES: Array<
  FloorAnchor & { id: string; size: number }
> = [
  { id: "shelf-a", left: 34, top: 26, size: 48 },
  { id: "shelf-b", left: 42, top: 24, size: 52 },
  { id: "shelf-c", left: 50, top: 26, size: 48 },
];

/** Waypoints for the office cat — low-traffic floor paths. */
export const CAT_WANDER_ANCHORS: FloorAnchor[] = [
  { left: 22, top: 58 },
  { left: 30, top: 66 },
  { left: 18, top: 70 },
  { left: 36, top: 72 },
  { left: 26, top: 60 },
  { left: 40, top: 64 },
  { left: 24, top: 74 },
];

export function catAnchorForIndex(index: number): FloorAnchor {
  return CAT_WANDER_ANCHORS[index % CAT_WANDER_ANCHORS.length];
}

/** Corridor decor between archive and desk row. */
export const WORKSPACE_CORRIDOR_PROPS: Array<
  FloorAnchor & { id: string; type: "plant" }
> = [
  { id: "corridor-plant-1", left: 28, top: 68, type: "plant" },
  { id: "corridor-plant-2", left: 38, top: 72, type: "plant" },
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
];

/** Reception meeting area (center) and assistant anchor (bottom). */
export const RECEPTION_MEETING = {
  chairs: [
    { id: "meet-chair-1", left: 72, top: 58 },
    { id: "meet-chair-2", left: 88, top: 58 },
    { id: "meet-chair-3", left: 72, top: 68 },
    { id: "meet-chair-4", left: 88, top: 68 },
  ],
  table: { left: 80, top: 63 },
};

export const RECEPTION_ANCHOR: FloorAnchor = { left: 80, top: 82 };

export const RECEPTION_EXTRA_PROPS: Array<
  FloorAnchor & { id: string; type: "bookshelf" | "plant" }
> = [
  { id: "reception-shelf", left: 92, top: 72, type: "bookshelf" },
  { id: "reception-plant", left: 66, top: 78, type: "plant" },
];

export function pantryAnchorForIndex(index: number): FloorAnchor {
  return PANTRY_ANCHORS[index % PANTRY_ANCHORS.length];
}

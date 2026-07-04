import { MAX_STAFF_PER_USER } from "@/lib/staff/constants";

export type AgentEmote = "thinking" | "idea" | "done" | "notify" | null;

export type AgentLocation = "desk" | "pantry";

export type DeskState = "empty" | "idle" | "working" | "done" | "offline";

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
  /** Progress of the active/most-recent task, 0-100. */
  progress: number;
  role?: string;
  staffId?: string;
  state: DeskState;
}

/**
 * Staff desk slots — 3×2 grid in the work area. Supports up to MAX_STAFF_PER_USER.
 */
export const WORKSPACE_DESK_SLOTS: DeskSlot[] = [
  {
    id: "desk-1",
    gridPosition: { x: 0, y: 0 },
    anchor: { left: 12, top: 28 },
    agentAnchor: { left: 12, top: 38 },
  },
  {
    id: "desk-2",
    gridPosition: { x: 1, y: 0 },
    anchor: { left: 28, top: 28 },
    agentAnchor: { left: 28, top: 38 },
  },
  {
    id: "desk-3",
    gridPosition: { x: 2, y: 0 },
    anchor: { left: 44, top: 28 },
    agentAnchor: { left: 44, top: 38 },
  },
  {
    id: "desk-4",
    gridPosition: { x: 0, y: 1 },
    anchor: { left: 12, top: 48 },
    agentAnchor: { left: 12, top: 58 },
  },
  {
    id: "desk-5",
    gridPosition: { x: 1, y: 1 },
    anchor: { left: 28, top: 48 },
    agentAnchor: { left: 28, top: 58 },
  },
].slice(0, MAX_STAFF_PER_USER);

/** Extra empty desks — always show "For hire", open hire flow on click. */
export const WORKSPACE_EXTRA_HIRE_DESKS: Array<FloorAnchor & { id: string }> = [
  { id: "hire-desk-a", left: 44, top: 48 },
  { id: "hire-desk-b", left: 8, top: 48 },
  { id: "hire-desk-c", left: 52, top: 38 },
  { id: "hire-desk-d", left: 12, top: 68 },
  { id: "hire-desk-e", left: 28, top: 68 },
  { id: "hire-desk-f", left: 44, top: 68 },
  { id: "hire-desk-g", left: 20, top: 78 },
  { id: "hire-desk-h", left: 36, top: 78 },
];

/** Bookshelves along work-area walls — kept clear of Archive / Task Board zones. */
export const WORKSPACE_BOOKSHELVES: Array<
  FloorAnchor & { id: string; size: number }
> = [
  { id: "shelf-a", left: 6, top: 12, size: 56 },
  { id: "shelf-b", left: 14, top: 14, size: 64 },
  { id: "shelf-c", left: 22, top: 12, size: 60 },
  { id: "shelf-d", left: 30, top: 14, size: 56 },
  { id: "shelf-e", left: 10, top: 24, size: 52 },
  { id: "shelf-f", left: 4, top: 32, size: 48 },
  { id: "shelf-g", left: 6, top: 52, size: 44 },
  { id: "shelf-h", left: 48, top: 62, size: 44 },
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

/** Hangout zone in the pantry — agents stand in the aisle between cafe clusters. */
export const PANTRY_ANCHORS: FloorAnchor[] = [
  { left: 78, top: 30 },
  { left: 74, top: 33 },
  { left: 82, top: 33 },
  { left: 70, top: 35 },
  { left: 86, top: 35 },
];

/** Reception / meeting room (bottom-right) — where the Assistant waits. */
export const RECEPTION_ANCHOR: FloorAnchor = { left: 80, top: 74 };

export function pantryAnchorForIndex(index: number): FloorAnchor {
  return PANTRY_ANCHORS[index % PANTRY_ANCHORS.length];
}

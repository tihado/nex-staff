import { findFirstEmptyDeskSlotId } from "@/lib/staff/desk-slots";

const STORAGE_KEY = "nex-staff-desk-assignments";

export type DeskAssignments = Record<string, string>;

export function readDeskAssignments(): DeskAssignments {
  if (typeof window === "undefined") {
    return {};
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);

    if (!raw) {
      return {};
    }

    const parsed: unknown = JSON.parse(raw);

    if (!parsed || typeof parsed !== "object") {
      return {};
    }

    return parsed as DeskAssignments;
  } catch {
    return {};
  }
}

export function writeDeskAssignments(assignments: DeskAssignments): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(assignments));
}

export function assignStaffToDesk(staffId: string, deskSlotId: string): void {
  const assignments = readDeskAssignments();

  for (const [existingStaffId, slotId] of Object.entries(assignments)) {
    if (slotId === deskSlotId && existingStaffId !== staffId) {
      delete assignments[existingStaffId];
    }
  }

  assignments[staffId] = deskSlotId;
  writeDeskAssignments(assignments);
}

export function getOccupiedDeskSlotIds(): string[] {
  return Object.values(readDeskAssignments());
}

export function pruneDeskAssignments(activeStaffIds: string[]): void {
  const assignments = readDeskAssignments();
  const active = new Set(activeStaffIds);
  let changed = false;

  for (const staffId of Object.keys(assignments)) {
    if (!active.has(staffId)) {
      delete assignments[staffId];
      changed = true;
    }
  }

  if (changed) {
    writeDeskAssignments(assignments);
  }
}

export function resolveDeskSlotForNewStaff(
  requestedDeskSlotId?: string
): string | undefined {
  const occupied = new Set(getOccupiedDeskSlotIds());

  if (requestedDeskSlotId && !occupied.has(requestedDeskSlotId)) {
    return requestedDeskSlotId;
  }

  return findFirstEmptyDeskSlotId(occupied);
}

export function assignNewStaffToDesk(
  staffId: string,
  requestedDeskSlotId?: string
): string | undefined {
  const slotId = resolveDeskSlotForNewStaff(requestedDeskSlotId);

  if (!slotId) {
    return;
  }

  assignStaffToDesk(staffId, slotId);
  return slotId;
}

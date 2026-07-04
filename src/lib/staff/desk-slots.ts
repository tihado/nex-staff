import { WORKSPACE_DESK_SLOTS } from "@/components/workplace/workspace-layout";

export function isStaffDeskSlotId(deskId: string): boolean {
  return WORKSPACE_DESK_SLOTS.some((slot) => slot.id === deskId);
}

export function resolveStaffDeskSlotId(
  clickedDeskId: string,
  occupiedSlotIds: Iterable<string>
): string | undefined {
  const occupied = new Set(occupiedSlotIds);

  if (isStaffDeskSlotId(clickedDeskId) && !occupied.has(clickedDeskId)) {
    return clickedDeskId;
  }

  return WORKSPACE_DESK_SLOTS.find((slot) => !occupied.has(slot.id))?.id;
}

export function findFirstEmptyDeskSlotId(
  occupiedSlotIds: Iterable<string>
): string | undefined {
  const occupied = new Set(occupiedSlotIds);

  return WORKSPACE_DESK_SLOTS.find((slot) => !occupied.has(slot.id))?.id;
}

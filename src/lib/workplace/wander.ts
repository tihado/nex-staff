import type { FloorAnchor } from "@/components/workplace/workspace-layout";
import {
  OFFICE_WANDER_BOUNDS,
  OFFICE_WANDER_ZONES,
  STAFF_WANDER_MIN_DISTANCE,
} from "@/components/workplace/workspace-layout";
import { anchorDistance } from "@/lib/workplace/agent-motion";

function hashStaffId(staffId: string): number {
  let hash = 0;
  for (const char of staffId) {
    hash = Math.imul(hash, 31) + char.charCodeAt(0);
  }
  return Math.abs(hash);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function clampWanderAnchor(anchor: FloorAnchor): FloorAnchor {
  return {
    left: clamp(
      anchor.left,
      OFFICE_WANDER_BOUNDS.minLeft,
      OFFICE_WANDER_BOUNDS.maxLeft
    ),
    top: clamp(
      anchor.top,
      OFFICE_WANDER_BOUNDS.minTop,
      OFFICE_WANDER_BOUNDS.maxTop
    ),
  };
}

function jitterWithinZone(seed: number): FloorAnchor {
  const zone = OFFICE_WANDER_ZONES[seed % OFFICE_WANDER_ZONES.length];
  const leftJitter = ((seed % 100) / 100) * 2 - 1;
  const topJitter = ((Math.floor(seed / 100) % 100) / 100) * 2 - 1;

  return clampWanderAnchor({
    left: zone.center.left + leftJitter * zone.radius.left,
    top: zone.center.top + topJitter * zone.radius.top,
  });
}

function randomJitterInZone(): FloorAnchor {
  const zone =
    OFFICE_WANDER_ZONES[Math.floor(Math.random() * OFFICE_WANDER_ZONES.length)];
  const leftJitter = Math.random() * 2 - 1;
  const topJitter = Math.random() * 2 - 1;

  return clampWanderAnchor({
    left: zone.center.left + leftJitter * zone.radius.left,
    top: zone.center.top + topJitter * zone.radius.top,
  });
}

function isFarEnoughFromOthers(
  candidate: FloorAnchor,
  staffId: string,
  occupied: Record<string, FloorAnchor>
): boolean {
  for (const [id, anchor] of Object.entries(occupied)) {
    if (id === staffId) {
      continue;
    }
    if (anchorDistance(anchor, candidate) < STAFF_WANDER_MIN_DISTANCE) {
      return false;
    }
  }
  return true;
}

export function initialWanderAnchorForStaff(staffId: string): FloorAnchor {
  return jitterWithinZone(hashStaffId(staffId));
}

/** Pick a random roam point that stays in bounds and away from other staff. */
export function pickNextWanderAnchor(
  staffId: string,
  current: FloorAnchor,
  occupied: Record<string, FloorAnchor>
): FloorAnchor {
  const minMoveDistance = 3;

  for (let attempt = 0; attempt < 24; attempt += 1) {
    const candidate = randomJitterInZone();
    const movedEnough = anchorDistance(current, candidate) >= minMoveDistance;
    if (movedEnough && isFarEnoughFromOthers(candidate, staffId, occupied)) {
      return candidate;
    }
  }

  const fallback = clampWanderAnchor({
    left: current.left + (Math.random() - 0.5) * 6,
    top: current.top + (Math.random() - 0.5) * 6,
  });

  if (isFarEnoughFromOthers(fallback, staffId, occupied)) {
    return fallback;
  }

  return {
    left: current.left + STAFF_WANDER_MIN_DISTANCE,
    top: current.top,
  };
}

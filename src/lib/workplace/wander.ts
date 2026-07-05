import type {
  FloorAnchor,
  OfficeWanderZone,
} from "@/components/workplace/workspace-layout";
import {
  OFFICE_WANDER_BOUNDS,
  OFFICE_WANDER_ZONES,
  PANTRY_WANDER_BOUNDS,
  PANTRY_WANDER_ZONES,
  STAFF_WANDER_MIN_DISTANCE,
} from "@/components/workplace/workspace-layout";
import { anchorDistance } from "@/lib/workplace/agent-motion";

export interface WanderConfig {
  bounds: {
    minLeft: number;
    maxLeft: number;
    minTop: number;
    maxTop: number;
  };
  zones: OfficeWanderZone[];
}

export const OFFICE_WANDER_CONFIG: WanderConfig = {
  bounds: OFFICE_WANDER_BOUNDS,
  zones: OFFICE_WANDER_ZONES,
};

export const PANTRY_WANDER_CONFIG: WanderConfig = {
  bounds: PANTRY_WANDER_BOUNDS,
  zones: PANTRY_WANDER_ZONES,
};

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

export function clampWanderAnchor(
  anchor: FloorAnchor,
  config: WanderConfig = OFFICE_WANDER_CONFIG
): FloorAnchor {
  return {
    left: clamp(anchor.left, config.bounds.minLeft, config.bounds.maxLeft),
    top: clamp(anchor.top, config.bounds.minTop, config.bounds.maxTop),
  };
}

function jitterWithinZone(seed: number, config: WanderConfig): FloorAnchor {
  const zone = config.zones[seed % config.zones.length];
  const leftJitter = ((seed % 100) / 100) * 2 - 1;
  const topJitter = ((Math.floor(seed / 100) % 100) / 100) * 2 - 1;

  return clampWanderAnchor(
    {
      left: zone.center.left + leftJitter * zone.radius.left,
      top: zone.center.top + topJitter * zone.radius.top,
    },
    config
  );
}

function randomJitterInZone(config: WanderConfig): FloorAnchor {
  const zone = config.zones[Math.floor(Math.random() * config.zones.length)];
  const leftJitter = Math.random() * 2 - 1;
  const topJitter = Math.random() * 2 - 1;

  return clampWanderAnchor(
    {
      left: zone.center.left + leftJitter * zone.radius.left,
      top: zone.center.top + topJitter * zone.radius.top,
    },
    config
  );
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

export function initialWanderAnchorForStaff(
  staffId: string,
  config: WanderConfig = OFFICE_WANDER_CONFIG
): FloorAnchor {
  return jitterWithinZone(hashStaffId(staffId), config);
}

/** Pick a random roam point that stays in bounds and away from other staff. */
export function pickNextWanderAnchor(
  staffId: string,
  current: FloorAnchor,
  occupied: Record<string, FloorAnchor>,
  config: WanderConfig = OFFICE_WANDER_CONFIG
): FloorAnchor {
  const minMoveDistance = 3;

  for (let attempt = 0; attempt < 24; attempt += 1) {
    const candidate = randomJitterInZone(config);
    const movedEnough = anchorDistance(current, candidate) >= minMoveDistance;
    if (movedEnough && isFarEnoughFromOthers(candidate, staffId, occupied)) {
      return candidate;
    }
  }

  const fallback = clampWanderAnchor(
    {
      left: current.left + (Math.random() - 0.5) * 6,
      top: current.top + (Math.random() - 0.5) * 6,
    },
    config
  );

  if (isFarEnoughFromOthers(fallback, staffId, occupied)) {
    return fallback;
  }

  return {
    left: current.left + STAFF_WANDER_MIN_DISTANCE,
    top: current.top,
  };
}

import type { FloorAnchor } from "@/components/workplace/workspace-layout";

export interface WalkSpeedProfile {
  maxWalkMs: number;
  minWalkMs: number;
  msPerPercent: number;
}

export const STAFF_WALK_SPEED: WalkSpeedProfile = {
  maxWalkMs: 4800,
  minWalkMs: 900,
  msPerPercent: 90,
};

export const CAT_WALK_SPEED: WalkSpeedProfile = {
  maxWalkMs: 9000,
  minWalkMs: 1600,
  msPerPercent: 165,
};

export function anchorDistance(from: FloorAnchor, to: FloorAnchor): number {
  return Math.hypot(to.left - from.left, to.top - from.top);
}

/** Constant walking speed — longer paths take more time. */
export function walkDurationMs(
  distance: number,
  profile: WalkSpeedProfile = STAFF_WALK_SPEED
): number {
  return Math.min(
    profile.maxWalkMs,
    Math.max(profile.minWalkMs, Math.round(distance * profile.msPerPercent))
  );
}

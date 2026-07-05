"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { FloorAnchor } from "@/components/workplace/workspace-layout";
import {
  initialWanderAnchorForStaff,
  OFFICE_WANDER_CONFIG,
  pickNextWanderAnchor,
  type WanderConfig,
} from "@/lib/workplace/wander";
import { STAFF_WANDER_MOVE_CHANCE } from "@/lib/workplace/wander-config";

const WANDER_PAUSE_MIN_MS = 6000;
const WANDER_PAUSE_JITTER_MS = 6000;

function buildInitialAnchors(
  staffIds: string[],
  wanderConfig: WanderConfig
): Record<string, FloorAnchor> {
  const initial: Record<string, FloorAnchor> = {};
  for (const id of staffIds) {
    initial[id] = initialWanderAnchorForStaff(id, wanderConfig);
  }
  return initial;
}

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(query.matches);

    const handler = (event: MediaQueryListEvent) => setReduced(event.matches);
    query.addEventListener("change", handler);

    return () => query.removeEventListener("change", handler);
  }, []);

  return reduced;
}

/**
 * Roaming anchors for idle staff. After each walk completes, staff pause 6–12s
 * then ~70% chance to walk to a new point inside a roam zone.
 */
export function useAgentWander(
  roamingStaffIds: string[],
  wanderConfig: WanderConfig = OFFICE_WANDER_CONFIG
): {
  onStaffArrived: (staffId: string) => void;
  reducedMotion: boolean;
  wanderAnchors: Record<string, FloorAnchor>;
} {
  const reducedMotion = usePrefersReducedMotion();
  const [anchors, setAnchors] = useState<Record<string, FloorAnchor>>(() =>
    buildInitialAnchors(roamingStaffIds, wanderConfig)
  );

  const timeoutsRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const kickstartedRef = useRef<Set<string>>(new Set());
  const scheduleNextMoveRef = useRef<(staffId: string) => void>(() => {
    /* assigned below */
  });

  const clearStaffTimeout = useCallback((staffId: string) => {
    const timeout = timeoutsRef.current[staffId];
    if (timeout) {
      clearTimeout(timeout);
      delete timeoutsRef.current[staffId];
    }
  }, []);

  const scheduleNextMove = useCallback(
    (staffId: string) => {
      if (reducedMotion) {
        return;
      }

      clearStaffTimeout(staffId);

      const delay =
        WANDER_PAUSE_MIN_MS + Math.random() * WANDER_PAUSE_JITTER_MS;
      timeoutsRef.current[staffId] = setTimeout(() => {
        delete timeoutsRef.current[staffId];

        if (Math.random() >= STAFF_WANDER_MOVE_CHANCE) {
          queueMicrotask(() => scheduleNextMoveRef.current(staffId));
          return;
        }

        setAnchors((current) => {
          const currentAnchor =
            current[staffId] ??
            initialWanderAnchorForStaff(staffId, wanderConfig);
          const nextAnchor = pickNextWanderAnchor(
            staffId,
            currentAnchor,
            current,
            wanderConfig
          );
          if (
            nextAnchor.left === currentAnchor.left &&
            nextAnchor.top === currentAnchor.top
          ) {
            queueMicrotask(() => scheduleNextMoveRef.current(staffId));
            return current;
          }
          return { ...current, [staffId]: nextAnchor };
        });
      }, delay);
    },
    [clearStaffTimeout, reducedMotion, wanderConfig]
  );

  scheduleNextMoveRef.current = scheduleNextMove;

  useEffect(() => {
    setAnchors((current) => {
      const next = { ...current };
      for (const id of roamingStaffIds) {
        if (next[id] === undefined) {
          next[id] = initialWanderAnchorForStaff(id, wanderConfig);
        }
      }
      return next;
    });
  }, [roamingStaffIds, wanderConfig]);

  useEffect(() => {
    const active = new Set(roamingStaffIds);
    for (const staffId of Object.keys(timeoutsRef.current)) {
      if (!active.has(staffId)) {
        clearStaffTimeout(staffId);
      }
    }
    for (const staffId of kickstartedRef.current) {
      if (!active.has(staffId)) {
        kickstartedRef.current.delete(staffId);
      }
    }
  }, [clearStaffTimeout, roamingStaffIds]);

  useEffect(() => {
    if (reducedMotion) {
      return;
    }

    for (const staffId of roamingStaffIds) {
      if (kickstartedRef.current.has(staffId)) {
        continue;
      }
      kickstartedRef.current.add(staffId);
      scheduleNextMove(staffId);
    }
  }, [reducedMotion, roamingStaffIds, scheduleNextMove]);

  useEffect(
    () => () => {
      for (const staffId of Object.keys(timeoutsRef.current)) {
        clearStaffTimeout(staffId);
      }
    },
    [clearStaffTimeout]
  );

  return {
    onStaffArrived: scheduleNextMove,
    wanderAnchors: anchors,
    reducedMotion,
  };
}

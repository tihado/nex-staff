"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { FloorAnchor } from "@/components/workplace/workspace-layout";
import {
  initialWanderAnchorForStaff,
  pickNextWanderAnchor,
} from "@/lib/workplace/wander";

const WANDER_PAUSE_MIN_MS = 6000;
const WANDER_PAUSE_JITTER_MS = 6000;

function buildInitialAnchors(staffIds: string[]): Record<string, FloorAnchor> {
  const initial: Record<string, FloorAnchor> = {};
  for (const id of staffIds) {
    initial[id] = initialWanderAnchorForStaff(id);
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
 * then pick a new random point inside a roam zone, avoiding other staff.
 */
export function useAgentWander(roamingStaffIds: string[]): {
  onStaffArrived: (staffId: string) => void;
  reducedMotion: boolean;
  wanderAnchors: Record<string, FloorAnchor>;
} {
  const reducedMotion = usePrefersReducedMotion();
  const [anchors, setAnchors] = useState<Record<string, FloorAnchor>>(() =>
    buildInitialAnchors(roamingStaffIds)
  );

  const timeoutsRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
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
        setAnchors((current) => {
          const currentAnchor =
            current[staffId] ?? initialWanderAnchorForStaff(staffId);
          const nextAnchor = pickNextWanderAnchor(
            staffId,
            currentAnchor,
            current
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
    [clearStaffTimeout, reducedMotion]
  );

  scheduleNextMoveRef.current = scheduleNextMove;

  useEffect(() => {
    setAnchors((current) => {
      const next = { ...current };
      for (const id of roamingStaffIds) {
        if (next[id] === undefined) {
          next[id] = initialWanderAnchorForStaff(id);
        }
      }
      return next;
    });
  }, [roamingStaffIds]);

  useEffect(() => {
    const active = new Set(roamingStaffIds);
    for (const staffId of Object.keys(timeoutsRef.current)) {
      if (!active.has(staffId)) {
        clearStaffTimeout(staffId);
      }
    }
  }, [clearStaffTimeout, roamingStaffIds]);

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

"use client";

import { useEffect, useState } from "react";
import { OFFICE_WANDER_ANCHORS } from "@/components/workplace/workspace-layout";

const WANDER_MIN_MS = 2500;
const WANDER_JITTER_MS = 2000;

function hashStaffId(staffId: string): number {
  let hash = 0;
  for (const char of staffId) {
    hash = Math.imul(hash, 31) + char.charCodeAt(0);
  }
  return Math.abs(hash);
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

function buildInitialIndices(staffIds: string[]): Record<string, number> {
  const initial: Record<string, number> = {};
  for (const id of staffIds) {
    initial[id] = hashStaffId(id) % OFFICE_WANDER_ANCHORS.length;
  }
  return initial;
}

/**
 * Advances waypoint indices for idle roaming staff on a staggered timer.
 * Returns staffId → anchor index into OFFICE_WANDER_ANCHORS.
 */
export function useAgentWander(roamingStaffIds: string[]): {
  reducedMotion: boolean;
  wanderIndices: Record<string, number>;
} {
  const reducedMotion = usePrefersReducedMotion();

  const [indices, setIndices] = useState<Record<string, number>>(() =>
    buildInitialIndices(roamingStaffIds)
  );

  useEffect(() => {
    setIndices((current) => {
      const next = { ...current };
      for (const id of roamingStaffIds) {
        if (next[id] === undefined) {
          next[id] = hashStaffId(id) % OFFICE_WANDER_ANCHORS.length;
        }
      }
      return next;
    });
  }, [roamingStaffIds]);

  useEffect(() => {
    if (reducedMotion || roamingStaffIds.length === 0) {
      return;
    }

    const timeouts: ReturnType<typeof setTimeout>[] = [];

    for (const staffId of roamingStaffIds) {
      const scheduleTick = () => {
        const delay = WANDER_MIN_MS + Math.random() * WANDER_JITTER_MS;
        const timeout = setTimeout(() => {
          setIndices((current) => {
            const currentIndex = current[staffId] ?? 0;
            const nextIndex = (currentIndex + 1) % OFFICE_WANDER_ANCHORS.length;
            return { ...current, [staffId]: nextIndex };
          });
          scheduleTick();
        }, delay);
        timeouts.push(timeout);
      };

      scheduleTick();
    }

    return () => {
      for (const timeout of timeouts) {
        clearTimeout(timeout);
      }
    };
  }, [reducedMotion, roamingStaffIds]);

  return { wanderIndices: indices, reducedMotion };
}

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

export type IdleWanderZone = "pantry" | "workplace";

export interface AgentWanderOptions {
  /** Secondary roam area (e.g. work area while idling in pantry). */
  alternateConfig?: WanderConfig;
  /** Per tick, chance to switch from primary to alternate zone. */
  alternateVisitChance?: number;
  /** Per tick while in alternate, chance to return to primary zone. */
  primaryReturnChance?: number;
}

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

function buildInitialZones(staffIds: string[]): Record<string, IdleWanderZone> {
  const initial: Record<string, IdleWanderZone> = {};
  for (const id of staffIds) {
    initial[id] = "pantry";
  }
  return initial;
}

function resolveWanderZone(
  staffId: string,
  primaryConfig: WanderConfig,
  options: AgentWanderOptions | undefined,
  zones: Record<string, IdleWanderZone>
): { config: WanderConfig; zone: IdleWanderZone } {
  const alternateConfig = options?.alternateConfig;
  const currentZone = zones[staffId] ?? "pantry";

  if (!alternateConfig) {
    return { config: primaryConfig, zone: "pantry" };
  }

  if (
    currentZone === "pantry" &&
    Math.random() < (options.alternateVisitChance ?? 0)
  ) {
    return { config: alternateConfig, zone: "workplace" };
  }

  if (
    currentZone === "workplace" &&
    Math.random() < (options.primaryReturnChance ?? 0)
  ) {
    return { config: primaryConfig, zone: "pantry" };
  }

  return {
    config: currentZone === "workplace" ? alternateConfig : primaryConfig,
    zone: currentZone,
  };
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
  wanderConfig: WanderConfig = OFFICE_WANDER_CONFIG,
  options?: AgentWanderOptions
): {
  onStaffArrived: (staffId: string) => void;
  reducedMotion: boolean;
  wanderAnchors: Record<string, FloorAnchor>;
  wanderZones: Record<string, IdleWanderZone>;
} {
  const reducedMotion = usePrefersReducedMotion();
  const [anchors, setAnchors] = useState<Record<string, FloorAnchor>>(() =>
    buildInitialAnchors(roamingStaffIds, wanderConfig)
  );
  const [zones, setZones] = useState<Record<string, IdleWanderZone>>(() =>
    buildInitialZones(roamingStaffIds)
  );

  const zonesRef = useRef(zones);
  zonesRef.current = zones;

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
          const currentZone = zonesRef.current[staffId] ?? "pantry";
          const currentAnchor =
            current[staffId] ??
            initialWanderAnchorForStaff(
              staffId,
              currentZone === "workplace" && options?.alternateConfig
                ? options.alternateConfig
                : wanderConfig
            );

          const { config: nextConfig, zone: nextZone } = resolveWanderZone(
            staffId,
            wanderConfig,
            options,
            zonesRef.current
          );

          const nextAnchor = pickNextWanderAnchor(
            staffId,
            currentAnchor,
            current,
            nextConfig
          );

          if (
            nextAnchor.left === currentAnchor.left &&
            nextAnchor.top === currentAnchor.top &&
            nextZone === currentZone
          ) {
            queueMicrotask(() => scheduleNextMoveRef.current(staffId));
            return current;
          }

          if (nextZone !== currentZone) {
            const nextZones = { ...zonesRef.current, [staffId]: nextZone };
            zonesRef.current = nextZones;
            setZones(nextZones);
          }

          return { ...current, [staffId]: nextAnchor };
        });
      }, delay);
    },
    [clearStaffTimeout, options, reducedMotion, wanderConfig]
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

    setZones((current) => {
      const next = { ...current };
      for (const id of roamingStaffIds) {
        if (next[id] === undefined) {
          next[id] = "pantry";
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
    wanderZones: zones,
    reducedMotion,
  };
}

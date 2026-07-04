"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { FloorAnchor } from "@/components/workplace/workspace-layout";
import type { WalkSpeedProfile } from "@/lib/workplace/agent-motion";
import {
  anchorDistance,
  STAFF_WALK_SPEED,
  walkDurationMs,
} from "@/lib/workplace/agent-motion";

interface AgentWalkState {
  displayAnchor: FloorAnchor;
  durationMs: number;
  isWalking: boolean;
  onMoveTransitionEnd: (event: React.TransitionEvent<HTMLElement>) => void;
  walkGeneration: number;
}

interface UseAgentWalkOptions {
  onArrived?: () => void;
  /** First transition animates from here instead of snapping to `anchor`. */
  walkOriginAnchor?: FloorAnchor;
}

function anchorsEqual(a: FloorAnchor, b: FloorAnchor): boolean {
  return a.left === b.left && a.top === b.top;
}

export function useAgentWalk(
  anchor: FloorAnchor,
  motionEnabled: boolean,
  speedProfile: WalkSpeedProfile = STAFF_WALK_SPEED,
  options?: UseAgentWalkOptions
): AgentWalkState {
  const { onArrived, walkOriginAnchor } = options ?? {};
  const onArrivedRef = useRef(onArrived);
  onArrivedRef.current = onArrived;

  const settledAnchorRef = useRef<FloorAnchor | null>(null);
  const targetAnchorRef = useRef(anchor);
  const arrivalFiredRef = useRef(false);
  const walkOriginRef = useRef(walkOriginAnchor);
  walkOriginRef.current = walkOriginAnchor;

  const [durationMs, setDurationMs] = useState(700);
  const [isWalking, setIsWalking] = useState(false);
  const [walkGeneration, setWalkGeneration] = useState(0);
  const [displayAnchor, setDisplayAnchor] = useState<FloorAnchor>(
    () => walkOriginAnchor ?? anchor
  );
  const displayAnchorRef = useRef(displayAnchor);
  displayAnchorRef.current = displayAnchor;

  const anchorLeft = anchor.left;
  const anchorTop = anchor.top;

  useEffect(() => {
    const target = { left: anchorLeft, top: anchorTop };

    if (!motionEnabled) {
      settledAnchorRef.current = target;
      setDisplayAnchor(target);
      setIsWalking(false);
      return;
    }

    const previous =
      settledAnchorRef.current ??
      walkOriginRef.current ??
      displayAnchorRef.current;
    targetAnchorRef.current = target;

    if (anchorsEqual(previous, target)) {
      settledAnchorRef.current = target;
      setDisplayAnchor(target);
      setIsWalking(false);
      return;
    }

    const distance = anchorDistance(previous, target);
    setDurationMs(walkDurationMs(distance, speedProfile));
    arrivalFiredRef.current = false;
    setIsWalking(false);
    setDisplayAnchor(previous);

    let innerFrame = 0;
    let cancelled = false;
    const outerFrame = requestAnimationFrame(() => {
      innerFrame = requestAnimationFrame(() => {
        if (cancelled) {
          return;
        }
        setDisplayAnchor(target);
        setIsWalking(true);
        setWalkGeneration((value) => value + 1);
      });
    });

    return () => {
      cancelled = true;
      cancelAnimationFrame(outerFrame);
      cancelAnimationFrame(innerFrame);
    };
  }, [anchorLeft, anchorTop, motionEnabled, speedProfile]);

  const onMoveTransitionEnd = useCallback(
    (event: React.TransitionEvent<HTMLElement>) => {
      if (event.propertyName !== "top" && event.propertyName !== "left") {
        return;
      }
      if (arrivalFiredRef.current) {
        return;
      }

      setIsWalking((walking) => {
        if (!walking) {
          return false;
        }

        arrivalFiredRef.current = true;
        settledAnchorRef.current = targetAnchorRef.current;
        onArrivedRef.current?.();
        return false;
      });
    },
    []
  );

  return {
    displayAnchor,
    durationMs,
    isWalking,
    onMoveTransitionEnd,
    walkGeneration,
  };
}

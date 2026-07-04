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
  durationMs: number;
  isWalking: boolean;
  onMoveTransitionEnd: (event: React.TransitionEvent<HTMLElement>) => void;
}

export function useAgentWalk(
  anchor: FloorAnchor,
  motionEnabled: boolean,
  speedProfile: WalkSpeedProfile = STAFF_WALK_SPEED
): AgentWalkState {
  const prevAnchorRef = useRef(anchor);
  const [durationMs, setDurationMs] = useState(700);
  const [isWalking, setIsWalking] = useState(false);

  useEffect(() => {
    if (!motionEnabled) {
      prevAnchorRef.current = anchor;
      setIsWalking(false);
      return;
    }

    const previous = prevAnchorRef.current;
    if (previous.left === anchor.left && previous.top === anchor.top) {
      return;
    }

    const distance = anchorDistance(previous, anchor);
    setDurationMs(walkDurationMs(distance, speedProfile));
    setIsWalking(true);
    prevAnchorRef.current = anchor;
  }, [anchor, motionEnabled, speedProfile]);

  const onMoveTransitionEnd = useCallback(
    (event: React.TransitionEvent<HTMLElement>) => {
      if (event.propertyName !== "left" && event.propertyName !== "top") {
        return;
      }
      setIsWalking(false);
    },
    []
  );

  return {
    durationMs,
    isWalking,
    onMoveTransitionEnd,
  };
}

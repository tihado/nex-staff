"use client";

import { useRef } from "react";
import { useAgentWalk } from "@/hooks/use-agent-walk";
import { useCatWalkMeow } from "@/hooks/use-cat-walk-meow";
import { useOfficeCatWander } from "@/hooks/use-office-cat-wander";
import { volumeForFloorAnchor } from "@/lib/audio/workplace-audio-volume";
import { cn } from "@/lib/utils";
import { CAT_WALK_SPEED } from "@/lib/workplace/agent-motion";
import { PixelCatIso } from "./office-sprites-iso";

interface WorkspaceOfficeCatProps {
  motionEnabled?: boolean;
}

/** Office cat that slowly wanders the work area, pantry, and reception. */
export function WorkspaceOfficeCat({
  motionEnabled = true,
}: WorkspaceOfficeCatProps) {
  const walkBobRef = useRef<HTMLSpanElement>(null);

  const { anchor, reducedMotion } = useOfficeCatWander(motionEnabled);
  const walkEnabled = motionEnabled && !reducedMotion;
  const { displayAnchor, durationMs, isWalking, onMoveTransitionEnd } =
    useAgentWalk(anchor, walkEnabled, CAT_WALK_SPEED);

  useCatWalkMeow({
    isWalking: walkEnabled && isWalking,
    volumeScale: volumeForFloorAnchor(displayAnchor),
  });

  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 select-none",
        isWalking && "will-change-[left,top]"
      )}
      onTransitionEnd={onMoveTransitionEnd}
      style={{
        left: `${displayAnchor.left}%`,
        top: `${displayAnchor.top}%`,
        zIndex: Math.round(displayAnchor.left + displayAnchor.top) + 8,
        transitionDuration:
          walkEnabled && isWalking ? `${durationMs}ms` : "0ms",
        transitionProperty: "left, top",
        transitionTimingFunction: "linear",
      }}
    >
      <span
        className={cn("relative", isWalking && "agent-walk-bob-slow")}
        ref={walkBobRef}
      >
        {isWalking ? (
          <span
            aria-hidden
            className="agent-walk-shadow pointer-events-none absolute -bottom-0.5 left-1/2 h-1 w-6 -translate-x-1/2 rounded-full bg-black/20"
          />
        ) : null}
        <PixelCatIso size={30} />
      </span>
    </div>
  );
}

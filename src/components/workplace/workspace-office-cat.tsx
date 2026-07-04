"use client";

import { useAgentWalk } from "@/hooks/use-agent-walk";
import { useOfficeCatWander } from "@/hooks/use-office-cat-wander";
import { cn } from "@/lib/utils";
import { CAT_WALK_SPEED } from "@/lib/workplace/agent-motion";
import { PixelCatIso } from "./office-sprites-iso";

interface WorkspaceOfficeCatProps {
  motionEnabled?: boolean;
}

/** Office cat that slowly wanders the work-area floor. */
export function WorkspaceOfficeCat({
  motionEnabled = true,
}: WorkspaceOfficeCatProps) {
  const { anchor, reducedMotion } = useOfficeCatWander(motionEnabled);
  const walkEnabled = motionEnabled && !reducedMotion;
  const { displayAnchor, durationMs, isWalking, onMoveTransitionEnd } =
    useAgentWalk(anchor, walkEnabled, CAT_WALK_SPEED);

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
        transitionDuration: walkEnabled ? `${durationMs}ms` : "0ms",
        transitionProperty: "left, top",
        transitionTimingFunction: "linear",
      }}
    >
      <span className={cn("relative", isWalking && "agent-walk-bob-slow")}>
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

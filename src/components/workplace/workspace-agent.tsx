"use client";

import { useCallback, useRef, useState } from "react";
import { PixelIcon } from "@/components/pixel";
import { StaffAvatar } from "@/components/staff/staff-avatar";
import { useAgentWalk } from "@/hooks/use-agent-walk";
import { EmoteBubbleAudio } from "@/hooks/use-emote-vocal";
import { volumeForFloorAnchor } from "@/lib/audio/workplace-audio-volume";
import { cn } from "@/lib/utils";
import { PixelCharacterIso } from "./office-sprites-iso";
import { WorkspaceAgentAudio } from "./workspace-agent-audio";
import {
  type FloorAnchor,
  WORKSPACE_AGENT_SPRITE_SIZE,
  type WorkspaceDesk,
} from "./workspace-layout";

const EMOTE_ICON = {
  thinking: "more-horizontal",
  idea: "lightbulb-on",
  done: "check",
  notify: "warning-box",
  failed: "warning-box",
} as const;

const EMOTE_LABEL = {
  thinking: "Thinking",
  idea: "Got an idea",
  done: "Done",
  notify: "Task ready",
  failed: "Task failed",
} as const;

const STATUS_DOT: Record<WorkspaceDesk["state"], string> = {
  idle: "bg-leaf",
  working: "bg-sun",
  done: "bg-success",
  failed: "bg-pixel-alert",
  empty: "bg-ink-muted",
  offline: "bg-ink-muted",
};

interface WorkspaceAgentProps {
  anchor: FloorAnchor;
  desk: WorkspaceDesk;
  layout?: "floor" | "desk";
  motionEnabled?: boolean;
  onSelect: (desk: WorkspaceDesk) => void;
  onStaffArrived?: (staffId: string) => void;
  variant: number;
  walkOriginAnchor?: FloorAnchor;
}

interface WorkspaceAgentFigureProps {
  desk: WorkspaceDesk;
  isWalking?: boolean;
  location: WorkspaceDesk["location"];
  staffId?: string;
  variant: number;
  volumeScale?: number;
}

function WorkspaceAgentFigure({
  desk,
  isWalking = false,
  location,
  staffId,
  variant,
  volumeScale = 1,
}: WorkspaceAgentFigureProps) {
  const emote = desk.emote;

  return (
    <>
      {emote ? (
        <>
          <EmoteBubbleAudio
            emote={emote}
            isWalking={isWalking}
            location={location}
            staffId={staffId}
            volumeScale={volumeScale}
          />
          <span
            className={cn(
              "advance-indicator absolute -top-5 left-1/2 flex size-6 -translate-x-1/2 items-center justify-center border-2 border-wood bg-panel text-ink",
              emote === "notify" && "animate-bounce"
            )}
            title={EMOTE_LABEL[emote]}
          >
            <PixelIcon
              className={cn(
                emote === "idea" && "text-pixel-accent",
                (emote === "done" || emote === "notify") && "text-success"
              )}
              label={EMOTE_LABEL[emote]}
              name={EMOTE_ICON[emote]}
              size={16}
            />
          </span>
        </>
      ) : null}

      <span className="relative transition-transform group-hover:scale-110">
        {desk.avatarSprite ? (
          <StaffAvatar
            size={WORKSPACE_AGENT_SPRITE_SIZE}
            spriteId={desk.avatarSprite}
            staffId={desk.staffId}
          />
        ) : (
          <PixelCharacterIso
            size={WORKSPACE_AGENT_SPRITE_SIZE}
            variant={variant}
          />
        )}
        <span
          className={cn(
            "absolute -top-1 -right-1 size-3 border border-wood-dark",
            STATUS_DOT[desk.state],
            desk.state === "working" &&
              "shadow-[0_0_6px_1px_var(--color-sun-glow)]"
          )}
        />
      </span>

      <span className="max-w-[88px] truncate border border-wood bg-panel/85 px-1.5 font-[family-name:var(--font-pixel)] text-[8px] text-ink uppercase tracking-wide">
        {desk.label}
      </span>
    </>
  );
}

/**
 * A seated/standing agent avatar with a status dot and a head emote bubble.
 * Floor layout uses absolute anchors; desk layout nests under the workstation sprite.
 */
export function WorkspaceAgent({
  anchor,
  desk,
  layout = "floor",
  motionEnabled = true,
  onStaffArrived,
  onSelect,
  variant,
  walkOriginAnchor,
}: WorkspaceAgentProps) {
  const walkBobRef = useRef<HTMLSpanElement>(null);
  const [arrivalSignal, setArrivalSignal] = useState(0);
  const arrivalHandledRef = useRef(false);

  const handleArrived = useCallback(() => {
    if (desk.staffId) {
      onStaffArrived?.(desk.staffId);
    }
  }, [desk.staffId, onStaffArrived]);

  const {
    displayAnchor,
    durationMs,
    isWalking,
    onMoveTransitionEnd,
    walkGeneration,
  } = useAgentWalk(anchor, motionEnabled && layout === "floor", undefined, {
    onArrived: handleArrived,
    walkOriginAnchor,
  });

  const walkGenerationRef = useRef(walkGeneration);
  if (walkGenerationRef.current !== walkGeneration) {
    walkGenerationRef.current = walkGeneration;
    arrivalHandledRef.current = false;
  }

  const handleTransitionEnd = useCallback(
    (event: React.TransitionEvent<HTMLElement>) => {
      const wasWalking = isWalking;
      onMoveTransitionEnd(event);
      if (
        (event.propertyName === "top" || event.propertyName === "left") &&
        wasWalking &&
        !arrivalHandledRef.current
      ) {
        arrivalHandledRef.current = true;
        setArrivalSignal((value) => value + 1);
      }
    },
    [isWalking, onMoveTransitionEnd]
  );

  if (layout === "desk") {
    return (
      <>
        <WorkspaceAgentAudio
          arrivalSignal={0}
          desk={desk}
          durationMs={0}
          isWalking={false}
          positionAnchor={anchor}
          walkGeneration={0}
        />
        <button
          aria-label={`Talk to ${desk.label}${desk.role ? ` (${desk.role})` : ""}`}
          className="group relative z-10 mt-1 flex flex-col items-center gap-0.5 focus-visible:outline-2 focus-visible:outline-pixel-accent focus-visible:outline-offset-2"
          onClick={() => onSelect(desk)}
          type="button"
        >
          <WorkspaceAgentFigure
            desk={desk}
            location={desk.location}
            staffId={desk.staffId}
            variant={variant}
            volumeScale={volumeForFloorAnchor(anchor)}
          />
        </button>
      </>
    );
  }

  return (
    <>
      <WorkspaceAgentAudio
        arrivalSignal={arrivalSignal}
        desk={desk}
        durationMs={durationMs}
        isWalking={isWalking}
        positionAnchor={displayAnchor}
        walkGeneration={walkGeneration}
      />
      <button
        aria-label={`Talk to ${desk.label}${desk.role ? ` (${desk.role})` : ""}`}
        className={cn(
          "group absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-0.5 focus-visible:outline-2 focus-visible:outline-pixel-accent focus-visible:outline-offset-2",
          isWalking && "will-change-[left,top]"
        )}
        onClick={() => onSelect(desk)}
        onTransitionEnd={handleTransitionEnd}
        style={{
          left: `${displayAnchor.left}%`,
          top: `${displayAnchor.top}%`,
          zIndex: Math.round(displayAnchor.left + displayAnchor.top) + 10,
          transitionDuration:
            motionEnabled && isWalking ? `${durationMs}ms` : "0ms",
          transitionProperty: "left, top",
          transitionTimingFunction: "linear",
        }}
        type="button"
      >
        <span
          className={cn(
            "relative flex flex-col items-center gap-0.5",
            isWalking && "agent-walk-bob"
          )}
          ref={walkBobRef}
        >
          {isWalking ? (
            <span
              aria-hidden
              className="agent-walk-shadow pointer-events-none absolute -bottom-1 left-1/2 h-1.5 w-8 -translate-x-1/2 rounded-full bg-black/25"
            />
          ) : null}
          <WorkspaceAgentFigure
            desk={desk}
            isWalking={isWalking}
            location={desk.location}
            staffId={desk.staffId}
            variant={variant}
            volumeScale={volumeForFloorAnchor(displayAnchor)}
          />
        </span>
      </button>
    </>
  );
}

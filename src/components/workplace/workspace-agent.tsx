"use client";

import { useCallback } from "react";
import { PixelIcon } from "@/components/pixel";
import { StaffAvatar } from "@/components/staff/staff-avatar";
import { useAgentWalk } from "@/hooks/use-agent-walk";
import { cn } from "@/lib/utils";
import { PixelCharacterIso } from "./office-sprites-iso";
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
} as const;

const EMOTE_LABEL = {
  thinking: "Thinking",
  idea: "Got an idea",
  done: "Done",
  notify: "Task ready",
} as const;

const STATUS_DOT: Record<WorkspaceDesk["state"], string> = {
  idle: "bg-leaf",
  working: "bg-sun",
  done: "bg-success",
  empty: "bg-ink-muted",
  offline: "bg-ink-muted",
};

interface WorkspaceAgentProps {
  anchor: FloorAnchor;
  desk: WorkspaceDesk;
  motionEnabled?: boolean;
  onSelect: (desk: WorkspaceDesk) => void;
  onStaffArrived?: (staffId: string) => void;
  variant: number;
  walkOriginAnchor?: FloorAnchor;
}

/**
 * A seated/standing agent avatar with a status dot and a head emote bubble.
 * Positioned absolutely by `anchor` with distance-based walk transitions.
 */
export function WorkspaceAgent({
  anchor,
  desk,
  motionEnabled = true,
  onStaffArrived,
  onSelect,
  variant,
  walkOriginAnchor,
}: WorkspaceAgentProps) {
  const emote = desk.emote;
  const handleArrived = useCallback(() => {
    if (desk.staffId && desk.location === "roaming") {
      onStaffArrived?.(desk.staffId);
    }
  }, [desk.location, desk.staffId, onStaffArrived]);

  const { displayAnchor, durationMs, isWalking, onMoveTransitionEnd } =
    useAgentWalk(anchor, motionEnabled, undefined, {
      onArrived: handleArrived,
      walkOriginAnchor,
    });

  return (
    <button
      aria-label={`View ${desk.label} status${desk.role ? ` (${desk.role})` : ""}`}
      className={cn(
        "group absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-0.5 focus-visible:outline-2 focus-visible:outline-pixel-accent focus-visible:outline-offset-2",
        isWalking && "will-change-[left,top]"
      )}
      onClick={() => onSelect(desk)}
      onTransitionEnd={onMoveTransitionEnd}
      style={{
        left: `${displayAnchor.left}%`,
        top: `${displayAnchor.top}%`,
        zIndex: Math.round(displayAnchor.left + displayAnchor.top) + 10,
        transitionDuration: motionEnabled ? `${durationMs}ms` : "0ms",
        transitionProperty: "left, top",
        transitionTimingFunction: "linear",
      }}
      type="button"
    >
      {emote ? (
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
      ) : null}

      <span
        className={cn(
          "relative transition-transform group-hover:scale-110",
          isWalking && "agent-walk-bob"
        )}
      >
        {isWalking ? (
          <span
            aria-hidden
            className="agent-walk-shadow pointer-events-none absolute -bottom-1 left-1/2 h-1.5 w-8 -translate-x-1/2 rounded-full bg-black/25"
          />
        ) : null}
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
    </button>
  );
}

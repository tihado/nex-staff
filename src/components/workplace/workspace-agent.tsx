"use client";

import { PixelIcon } from "@/components/pixel";
import { cn } from "@/lib/utils";
import { PixelCharacterIso } from "./office-sprites-iso";
import type { FloorAnchor, WorkspaceDesk } from "./workspace-layout";

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
  onSelect: (desk: WorkspaceDesk) => void;
  variant: number;
}

/**
 * A seated/standing agent avatar with a status dot and a head emote bubble.
 * Positioned absolutely by `anchor` so it smoothly walks between its desk and
 * the pantry when the underlying task state changes.
 */
export function WorkspaceAgent({
  anchor,
  desk,
  onSelect,
  variant,
}: WorkspaceAgentProps) {
  const emote = desk.emote;

  return (
    <button
      aria-label={`Talk to ${desk.label}${desk.role ? ` (${desk.role})` : ""}`}
      className="group absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-0.5 transition-[left,top] duration-700 ease-in-out focus-visible:outline-2 focus-visible:outline-pixel-accent focus-visible:outline-offset-2"
      onClick={() => onSelect(desk)}
      style={{
        left: `${anchor.left}%`,
        top: `${anchor.top}%`,
        zIndex: Math.round(anchor.left + anchor.top) + 10,
      }}
      type="button"
    >
      {/* Head emote bubble */}
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
            size={14}
          />
        </span>
      ) : null}

      <span className="relative transition-transform group-hover:scale-110">
        <PixelCharacterIso size={44} variant={variant} />
        {/* Status dot */}
        <span
          className={cn(
            "absolute -top-1 -right-1 size-2.5 border border-wood-dark",
            STATUS_DOT[desk.state],
            desk.state === "working" &&
              "shadow-[0_0_6px_1px_var(--color-sun-glow)]"
          )}
        />
      </span>

      <span className="max-w-[72px] truncate border border-wood bg-panel/85 px-1 font-[family-name:var(--font-pixel)] text-[7px] text-ink uppercase tracking-wide">
        {desk.label}
      </span>
    </button>
  );
}

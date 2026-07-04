"use client";

import { cn } from "@/lib/utils";
import { PixelDeskIso, PixelHireDeskIso } from "./office-sprites-iso";
import { WorkspaceAgent } from "./workspace-agent";
import {
  type FloorAnchor,
  WORKSPACE_DESK_SPRITE_SIZE,
  type WorkspaceDesk,
} from "./workspace-layout";

interface WorkspaceDeskCellProps {
  anchor: FloorAnchor;
  desk: WorkspaceDesk;
  onHire: (deskId: string) => void;
  onSelectAgent: (desk: WorkspaceDesk) => void;
  variant: number;
}

/**
 * Static desk furniture for a slot. Occupied desks are decorative (the agent
 * layer sits on top); empty desks become a "FOR HIRE" call-to-action.
 */
export function WorkspaceDeskCell({
  anchor,
  desk,
  onHire,
  onSelectAgent,
  variant,
}: WorkspaceDeskCellProps) {
  if (desk.state === "empty") {
    return (
      <WorkspaceHireDeskCell anchor={anchor} deskId={desk.id} onHire={onHire} />
    );
  }

  const positionStyle = {
    left: `${anchor.left}%`,
    top: `${anchor.top}%`,
    zIndex: Math.round(anchor.left + anchor.top),
  };

  const showAgentAtDesk = Boolean(desk.staffId) && desk.location === "desk";

  return (
    <div
      className={cn(
        "absolute flex -translate-x-1/2 -translate-y-[78%] flex-col items-center",
        !showAgentAtDesk && "pointer-events-none"
      )}
      style={positionStyle}
    >
      <PixelDeskIso size={WORKSPACE_DESK_SPRITE_SIZE} />
      {showAgentAtDesk ? (
        <WorkspaceAgent
          anchor={anchor}
          desk={desk}
          layout="desk"
          onSelect={onSelectAgent}
          variant={variant}
        />
      ) : null}
    </div>
  );
}

interface WorkspaceHireDeskCellProps {
  anchor: FloorAnchor;
  deskId: string;
  onHire: (deskId: string) => void;
}

/** Extra desk slot — always empty, opens hire flow. */
export function WorkspaceHireDeskCell({
  anchor,
  deskId,
  onHire,
}: WorkspaceHireDeskCellProps) {
  const positionStyle = {
    left: `${anchor.left}%`,
    top: `${anchor.top}%`,
    zIndex: Math.round(anchor.left + anchor.top),
  };

  return (
    <button
      aria-label="Open Assistant to hire for this empty desk"
      className="group absolute flex -translate-x-1/2 -translate-y-[78%] flex-col items-center gap-1 focus-visible:outline-2 focus-visible:outline-pixel-accent focus-visible:outline-offset-2"
      onClick={() => onHire(deskId)}
      style={positionStyle}
      type="button"
    >
      <PixelHireDeskIso
        className="opacity-70 transition-opacity group-hover:opacity-100"
        size={WORKSPACE_DESK_SPRITE_SIZE}
      />
      <span className="border-2 border-wood border-dashed bg-panel/80 px-1.5 py-0.5 font-[family-name:var(--font-pixel)] text-[9px] text-ink uppercase tracking-widest group-hover:bg-choice-hover">
        For hire
      </span>
    </button>
  );
}

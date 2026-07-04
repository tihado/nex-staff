"use client";

import { cn } from "@/lib/utils";
import { PixelDeskIso } from "./office-sprites-iso";
import type { FloorAnchor, WorkspaceDesk } from "./workspace-layout";

interface WorkspaceDeskCellProps {
  anchor: FloorAnchor;
  desk: WorkspaceDesk;
  onHire: (deskId: string) => void;
}

/**
 * Static desk furniture for a slot. Occupied desks are decorative (the agent
 * layer sits on top); empty desks become a "FOR HIRE" call-to-action.
 */
export function WorkspaceDeskCell({
  anchor,
  desk,
  onHire,
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

  return (
    <div
      aria-hidden
      className={cn("absolute -translate-x-1/2 -translate-y-[78%]")}
      style={positionStyle}
    >
      <PixelDeskIso size={72} />
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
      aria-label="Hire a new agent for this empty desk"
      className="group absolute flex -translate-x-1/2 -translate-y-[78%] flex-col items-center gap-1 focus-visible:outline-2 focus-visible:outline-pixel-accent focus-visible:outline-offset-2"
      onClick={() => onHire(deskId)}
      style={positionStyle}
      type="button"
    >
      <PixelDeskIso
        className="opacity-70 transition-opacity group-hover:opacity-100"
        size={72}
      />
      <span className="border-2 border-wood border-dashed bg-panel/80 px-1 py-0.5 font-[family-name:var(--font-pixel)] text-[8px] text-ink uppercase tracking-widest group-hover:bg-choice-hover">
        For hire
      </span>
    </button>
  );
}

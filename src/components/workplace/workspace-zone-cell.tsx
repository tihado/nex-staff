"use client";

import type { ReactNode } from "react";
import { PixelWoodSign } from "@/components/workplace/office-sprites";
import type { FloorAnchor } from "@/components/workplace/workspace-layout";
import { cn } from "@/lib/utils";

interface WorkspaceZoneCellProps {
  anchor: FloorAnchor;
  ariaLabel: string;
  badge?: boolean;
  children: ReactNode;
  label: string;
  onClick: () => void;
}

/**
 * Clickable zone on the floor (archive alcove, task board wall, etc.)
 * with a wooden sign and optional alert badge.
 */
export function WorkspaceZoneCell({
  anchor,
  ariaLabel,
  badge = false,
  children,
  label,
  onClick,
}: WorkspaceZoneCellProps) {
  return (
    <button
      aria-label={ariaLabel}
      className={cn(
        "group absolute z-[50] flex -translate-x-1/2 -translate-y-[78%] flex-col items-center gap-1",
        "rounded-sm border-2 border-transparent p-1 transition-colors",
        "hover:border-wood hover:bg-black/20 focus-visible:outline-2 focus-visible:outline-pixel-accent"
      )}
      onClick={onClick}
      style={{
        left: `${anchor.left}%`,
        top: `${anchor.top}%`,
      }}
      type="button"
    >
      <span className="relative transition-transform group-hover:scale-105">
        {children}
        {badge ? (
          <span
            aria-hidden
            className="absolute -top-1 -right-1 flex size-5 animate-bounce items-center justify-center rounded-full border-2 border-wood bg-alert font-[family-name:var(--font-pixel)] text-[10px] text-white"
          >
            !
          </span>
        ) : null}
      </span>
      <PixelWoodSign label={label} />
    </button>
  );
}

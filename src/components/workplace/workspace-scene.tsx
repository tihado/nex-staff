"use client";

import type { ReactNode } from "react";

/** Matches workspace floor base. */
const SCENE_BG = "#121218";

interface WorkspaceSceneProps {
  children: ReactNode;
}

/**
 * Full-bleed scene container. Depth comes from iso sprites — no CSS plane tilt,
 * so the floor stays aligned with the GameShell frame and HUD.
 */
export function WorkspaceScene({ children }: WorkspaceSceneProps) {
  return (
    <div
      className="relative h-full w-full overflow-hidden"
      style={{ backgroundColor: SCENE_BG }}
    >
      {children}
    </div>
  );
}

/** Extruded vertical wall between rooms. */
export function ExtrudedWallVertical({
  left,
  height = "100%",
}: {
  left: string;
  height?: string;
}) {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute top-0 w-3 shadow-[4px_0_10px_rgba(0,0,0,0.45)]"
      style={{
        background:
          "linear-gradient(90deg, #3a4558 0%, #1a2030 55%, #0a0c12 100%)",
        height,
        left,
      }}
    />
  );
}

/** Extruded horizontal wall between stacked rooms. */
export function ExtrudedWallHorizontal({
  left,
  top,
  width,
}: {
  left: string;
  top: string;
  width: string;
}) {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute h-3 shadow-[0_4px_10px_rgba(0,0,0,0.45)]"
      style={{
        background:
          "linear-gradient(180deg, #3a4558 0%, #1a2030 55%, #0a0c12 100%)",
        left,
        top,
        width,
      }}
    />
  );
}

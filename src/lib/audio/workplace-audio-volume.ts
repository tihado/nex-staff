import type { FloorAnchor } from "@/components/workplace/workspace-layout";

/** Iso depth proxy — agents closer to the viewer (higher left+top) play louder. */
export function volumeForFloorAnchor(anchor: FloorAnchor): number {
  const depth = (anchor.left + anchor.top) / 200;
  return 0.55 + Math.min(1, Math.max(0, depth)) * 0.45;
}

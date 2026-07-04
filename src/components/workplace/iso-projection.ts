/** Depth sort key — higher = drawn in front (closer to viewer). */
export function depthZ(left: number, top: number): number {
  return Math.round(left + top);
}

export interface ObliqueAnchor {
  left: number;
  /** Visual lift in px (negative = toward viewer / lower on screen). */
  lift?: number;
  top: number;
  z: number;
}

export function anchorWithDepth(
  left: number,
  top: number,
  lift = 0
): ObliqueAnchor {
  return { left, top, lift, z: depthZ(left, top) };
}

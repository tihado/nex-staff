"use client";

import { cn } from "@/lib/utils";
import type { FloorAnchor } from "./workspace-layout";

interface HireSparkleProps {
  anchor: FloorAnchor;
  visible: boolean;
}

export function HireSparkle({ anchor, visible }: HireSparkleProps) {
  if (!visible) {
    return null;
  }

  const positionStyle = {
    left: `${anchor.left}%`,
    top: `${anchor.top}%`,
    zIndex: Math.round(anchor.left + anchor.top) + 200,
  };

  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none absolute -translate-x-1/2 -translate-y-full",
        "hire-sparkle-animate"
      )}
      style={positionStyle}
    >
      <span className="font-[family-name:var(--font-pixel)] text-[10px] text-highlight drop-shadow-sm">
        ✨ New hire!
      </span>
    </div>
  );
}

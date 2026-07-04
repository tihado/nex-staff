"use client";

import type { ReactNode } from "react";
import { useId } from "react";
import { cn } from "@/lib/utils";

interface FantasyScrollFrameProps {
  children: ReactNode;
  className?: string;
}

const SCROLL_WIDTH = 640;

/** Wavy parchment silhouette — curved fantasy scroll edges. */
const WAVY_CLIP_PATH = `
  M 0.06 0
  C 0.0 0.05, 0.1 0.1, 0.03 0.15
  C 0.0 0.2, 0.09 0.25, 0.04 0.3
  C 0.0 0.35, 0.1 0.4, 0.03 0.45
  C 0.0 0.5, 0.09 0.55, 0.04 0.6
  C 0.0 0.65, 0.1 0.7, 0.03 0.75
  C 0.0 0.8, 0.09 0.85, 0.04 0.9
  C 0.0 0.95, 0.08 0.99, 0.06 1
  L 0.94 1
  C 0.92 0.99, 1.0 0.95, 0.96 0.9
  C 1.0 0.85, 0.91 0.8, 0.96 0.75
  C 1.0 0.7, 0.9 0.65, 0.96 0.6
  C 1.0 0.55, 0.91 0.5, 0.97 0.45
  C 1.0 0.4, 0.9 0.35, 0.96 0.3
  C 1.0 0.25, 0.91 0.2, 0.97 0.15
  C 1.0 0.1, 0.9 0.05, 0.94 0
  Z
`;

function ScrollTopRoller() {
  return (
    <svg
      aria-hidden
      className="block w-full"
      height="64"
      viewBox="0 0 640 64"
      xmlns="http://www.w3.org/2000/svg"
    >
      <title>Scroll top roller</title>
      <ellipse cx="36" cy="32" fill="#3D2010" rx="28" ry="28" />
      <ellipse cx="36" cy="32" fill="#5C3318" rx="20" ry="20" />
      <ellipse cx="36" cy="29" fill="#8B5A3C" rx="12" ry="12" />
      <ellipse cx="604" cy="32" fill="#3D2010" rx="28" ry="28" />
      <ellipse cx="604" cy="32" fill="#5C3318" rx="20" ry="20" />
      <ellipse cx="604" cy="29" fill="#8B5A3C" rx="12" ry="12" />
      <rect fill="#4A2A14" height="22" width="528" x="56" y="21" />
      <rect fill="#6B3A22" height="14" width="516" x="62" y="25" />
      <rect fill="#9C6B3B" height="5" width="504" x="68" y="30" />
      <path
        d="M56 43 C140 54, 220 58, 320 58 C420 58, 500 54, 584 43 L584 64 L56 64 Z"
        fill="#EAD7B0"
      />
      <path
        d="M56 43 C140 54, 220 58, 320 58 C420 58, 500 54, 584 43"
        fill="none"
        opacity="0.4"
        stroke="#A8843A"
        strokeWidth="1.5"
      />
    </svg>
  );
}

function ScrollBottomRoller() {
  return (
    <svg
      aria-hidden
      className="block w-full"
      height="64"
      viewBox="0 0 640 64"
      xmlns="http://www.w3.org/2000/svg"
    >
      <title>Scroll bottom roller</title>
      <path
        d="M56 0 C140 10, 220 14, 320 14 C420 14, 500 10, 584 0 L584 21 L56 21 Z"
        fill="#EAD7B0"
      />
      <rect fill="#4A2A14" height="22" width="528" x="56" y="21" />
      <rect fill="#6B3A22" height="14" width="516" x="62" y="25" />
      <rect fill="#9C6B3B" height="5" width="504" x="68" y="30" />
      <ellipse cx="36" cy="32" fill="#3D2010" rx="28" ry="28" />
      <ellipse cx="36" cy="32" fill="#5C3318" rx="20" ry="20" />
      <ellipse cx="36" cy="35" fill="#8B5A3C" rx="12" ry="12" />
      <ellipse cx="604" cy="32" fill="#3D2010" rx="28" ry="28" />
      <ellipse cx="604" cy="32" fill="#5C3318" rx="20" ry="20" />
      <ellipse cx="604" cy="35" fill="#8B5A3C" rx="12" ry="12" />
    </svg>
  );
}

export function FantasyScrollFrame({
  children,
  className,
}: FantasyScrollFrameProps) {
  const clipId = useId();

  return (
    <div
      className={cn(
        "archive-scroll-shell flex w-full flex-col items-center",
        className
      )}
      style={{ maxWidth: SCROLL_WIDTH, perspective: "1400px" }}
    >
      <svg aria-hidden className="absolute h-0 w-0">
        <title>Scroll shape clip</title>
        <defs>
          <clipPath clipPathUnits="objectBoundingBox" id={clipId}>
            <path d={WAVY_CLIP_PATH} />
          </clipPath>
        </defs>
      </svg>

      <div className="w-full [transform:rotateX(2deg)]">
        <ScrollTopRoller />

        <div className="relative -mt-0.5 -mb-0.5 w-full">
          <div
            className="scroll-parchment relative min-h-[420px]"
            style={{ clipPath: `url(#${clipId})` }}
          >
            <div
              aria-hidden
              className="pointer-events-none absolute inset-y-0 left-0 w-[14%] bg-[linear-gradient(90deg,rgba(120,78,36,0.22)_0%,transparent_100%)]"
            />
            <div
              aria-hidden
              className="pointer-events-none absolute inset-y-0 right-0 w-[14%] bg-[linear-gradient(270deg,rgba(120,78,36,0.22)_0%,transparent_100%)]"
            />
            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-[8%] top-0 h-16 bg-[linear-gradient(180deg,rgba(120,78,36,0.18)_0%,transparent_100%)]"
            />
            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-[8%] bottom-0 h-16 bg-[linear-gradient(0deg,rgba(120,78,36,0.18)_0%,transparent_100%)]"
            />
            {children}
          </div>
        </div>

        <ScrollBottomRoller />
      </div>
    </div>
  );
}

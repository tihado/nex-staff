"use client";

import { useEffect, useState } from "react";
import {
  CAT_WANDER_ANCHORS,
  catAnchorForIndex,
  type FloorAnchor,
} from "@/components/workplace/workspace-layout";

const CAT_WANDER_MIN_MS = 5500;
const CAT_WANDER_JITTER_MS = 4500;

export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(query.matches);

    const handler = (event: MediaQueryListEvent) => setReduced(event.matches);
    query.addEventListener("change", handler);

    return () => query.removeEventListener("change", handler);
  }, []);

  return reduced;
}

function pickNextCatAnchorIndex(current: number): number {
  const count = CAT_WANDER_ANCHORS.length;
  if (count <= 1) {
    return 0;
  }

  let next = current;
  while (next === current) {
    next = Math.floor(Math.random() * count);
  }
  return next;
}

export function useOfficeCatWander(enabled = true): {
  anchor: FloorAnchor;
  reducedMotion: boolean;
} {
  const reducedMotion = usePrefersReducedMotion();
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (reducedMotion || !enabled) {
      return;
    }

    const timeouts: ReturnType<typeof setTimeout>[] = [];

    const scheduleTick = () => {
      const delay = CAT_WANDER_MIN_MS + Math.random() * CAT_WANDER_JITTER_MS;
      const timeout = setTimeout(() => {
        setIndex((current) => pickNextCatAnchorIndex(current));
        scheduleTick();
      }, delay);
      timeouts.push(timeout);
    };

    scheduleTick();

    return () => {
      for (const timeout of timeouts) {
        clearTimeout(timeout);
      }
    };
  }, [enabled, reducedMotion]);

  return {
    anchor: catAnchorForIndex(index),
    reducedMotion,
  };
}

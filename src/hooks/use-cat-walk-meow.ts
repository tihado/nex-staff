"use client";

import { useEffect, useRef } from "react";
import { useWorkplaceAudioOptional } from "@/components/workplace/workplace-audio-provider";
import { CAT_MEOW_ON_WALK_CHANCE } from "@/lib/audio/cat-meow-config";

interface UseCatWalkMeowOptions {
  isWalking: boolean;
  volumeScale?: number;
}

/** Occasionally plays a long "meooo" when the office cat starts walking. */
export function useCatWalkMeow({
  isWalking,
  volumeScale = 1,
}: UseCatWalkMeowOptions): void {
  const audio = useWorkplaceAudioOptional();
  const walkHandledRef = useRef(false);
  const audioReady = Boolean(audio?.enabled && audio.unlocked);

  useEffect(() => {
    if (!isWalking) {
      walkHandledRef.current = false;
      return;
    }

    if (!audioReady || walkHandledRef.current) {
      return;
    }

    walkHandledRef.current = true;

    if (Math.random() >= CAT_MEOW_ON_WALK_CHANCE) {
      return;
    }

    audio?.playCue("cat-meow", {
      volume: 0.44 * volumeScale,
      pitch: 0.94 + Math.random() * 0.12,
    });
  }, [audio, audioReady, isWalking, volumeScale]);
}

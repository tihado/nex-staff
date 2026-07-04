"use client";

import { useCallback, useEffect, useRef } from "react";
import { useWorkplaceAudioOptional } from "@/components/workplace/workplace-audio-provider";

interface UseWalkFootstepsOptions {
  arrivalSignal?: number;
  bobIntervalMs: number;
  durationMs: number;
  isWalking: boolean;
  volumeScale?: number;
  walkGeneration: number;
}

/** Discrete footsteps every half walk-bob cycle; landing on arrival. */
export function useWalkFootsteps({
  arrivalSignal = 0,
  bobIntervalMs,
  durationMs,
  isWalking,
  volumeScale = 1,
  walkGeneration,
}: UseWalkFootstepsOptions): void {
  const audio = useWorkplaceAudioOptional();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const stopTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const playStepRef = useRef<(() => void) | null>(null);
  playStepRef.current = () => {
    audio?.playCue("footstep-staff", { volume: 0.3 * volumeScale });
  };

  const stopSteps = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (stopTimerRef.current) {
      clearTimeout(stopTimerRef.current);
      stopTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (walkGeneration === 0 || !audio?.enabled) {
      return;
    }

    let cancelled = false;
    const walkEndsAt = Date.now() + durationMs;

    const startSteps = async () => {
      if (!audio.unlocked) {
        await audio.unlock();
      }
      if (cancelled) {
        return;
      }

      stopSteps();

      const remainingMs = walkEndsAt - Date.now();
      if (remainingMs <= 0) {
        return;
      }

      playStepRef.current?.();

      const halfCycleMs = bobIntervalMs / 2;
      intervalRef.current = setInterval(() => {
        if (Date.now() >= walkEndsAt) {
          stopSteps();
          return;
        }
        playStepRef.current?.();
      }, halfCycleMs);

      stopTimerRef.current = setTimeout(stopSteps, remainingMs);
    };

    startSteps().catch(() => undefined);

    return () => {
      cancelled = true;
      stopSteps();
    };
  }, [audio, bobIntervalMs, durationMs, stopSteps, walkGeneration]);

  useEffect(() => {
    if (!isWalking) {
      stopSteps();
    }
  }, [isWalking, stopSteps]);

  useEffect(() => {
    if (!(audio?.enabled && audio.unlocked) || arrivalSignal === 0) {
      return;
    }

    stopSteps();
    audio.playCue("footstep-landing", { volume: 0.25 * volumeScale });
  }, [arrivalSignal, audio, stopSteps, volumeScale]);
}

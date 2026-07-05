"use client";

import { useMemo } from "react";
import { useEmoteVocal } from "@/hooks/use-emote-vocal";
import { useWalkFootsteps } from "@/hooks/use-walk-footsteps";
import { volumeForFloorAnchor } from "@/lib/audio/workplace-audio-volume";
import type { FloorAnchor, WorkspaceDesk } from "./workspace-layout";

interface WorkspaceAgentAudioProps {
  arrivalSignal: number;
  bobIntervalMs?: number;
  desk: WorkspaceDesk;
  durationMs: number;
  isWalking: boolean;
  positionAnchor: FloorAnchor;
  walkGeneration: number;
}

/** Invisible audio layer — footsteps + arrival vocals. */
export function WorkspaceAgentAudio({
  arrivalSignal,
  bobIntervalMs = 500,
  desk,
  durationMs,
  isWalking,
  positionAnchor,
  walkGeneration,
}: WorkspaceAgentAudioProps) {
  const volumeScale = useMemo(
    () => volumeForFloorAnchor(positionAnchor),
    [positionAnchor]
  );

  useWalkFootsteps({
    arrivalSignal,
    bobIntervalMs,
    durationMs,
    isWalking,
    volumeScale,
    walkGeneration,
  });

  useEmoteVocal({
    arrivalSignal,
    location: desk.location,
    playPantryArrivalVocal: desk.state === "done",
    volumeScale,
  });

  return null;
}

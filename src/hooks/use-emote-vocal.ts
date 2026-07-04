"use client";

import { useLayoutEffect, useRef } from "react";
import { useWorkplaceAudioOptional } from "@/components/workplace/workplace-audio-provider";
import type {
  AgentEmote,
  AgentLocation,
} from "@/components/workplace/workspace-layout";
import type { VocalCue } from "@/lib/audio/workplace-audio-types";

const EMOTE_DEBOUNCE_MS = 8000;

function vocalForEmote(
  emote: AgentEmote,
  location: AgentLocation
): VocalCue | null {
  switch (emote) {
    case "thinking":
      return "vocal-hmm";
    case "idea":
      return "vocal-gasp";
    case "notify":
      return location === "pantry" ? null : "vocal-relief";
    default:
      return null;
  }
}

interface EmoteBubbleAudioProps {
  emote: AgentEmote;
  isWalking: boolean;
  location: AgentLocation;
  staffId?: string;
  volumeScale?: number;
}

/** Plays vocal exactly when emote bubble mounts or changes (same frame as render). */
export function EmoteBubbleAudio({
  emote,
  isWalking,
  location,
  staffId,
  volumeScale = 1,
}: EmoteBubbleAudioProps) {
  const audio = useWorkplaceAudioOptional();
  const prevEmoteRef = useRef<AgentEmote>(null);
  const prevEnabledRef = useRef(false);
  const lastPlayedRef = useRef<Record<string, number>>({});

  useLayoutEffect(() => {
    if (!(audio?.enabled && staffId && emote) || isWalking) {
      prevEmoteRef.current = emote;
      prevEnabledRef.current = audio?.enabled ?? false;
      return;
    }

    const cue = vocalForEmote(emote, location);
    const emoteChanged = prevEmoteRef.current !== emote;
    const audioJustEnabled = audio.enabled && !prevEnabledRef.current;

    prevEmoteRef.current = emote;
    prevEnabledRef.current = audio.enabled;

    if (!cue) {
      return;
    }

    if (!(emoteChanged || audioJustEnabled)) {
      return;
    }

    const now = Date.now();
    const debounceKey = `${staffId}:${cue}`;
    const last = lastPlayedRef.current[debounceKey] ?? 0;
    if (now - last < EMOTE_DEBOUNCE_MS) {
      return;
    }

    lastPlayedRef.current[debounceKey] = now;
    audio.stopVocal();
    audio.playCue(cue, { volume: 0.5 * volumeScale });
  }, [audio, emote, isWalking, location, staffId, volumeScale]);

  return null;
}

interface UseEmoteVocalOptions {
  arrivalSignal?: number;
  location: AgentLocation;
  volumeScale?: number;
}

/** Arrival vocals after walk transition completes. */
export function useEmoteVocal({
  arrivalSignal = 0,
  location,
  volumeScale = 1,
}: UseEmoteVocalOptions): void {
  const audio = useWorkplaceAudioOptional();

  useLayoutEffect(() => {
    if (!audio?.enabled || arrivalSignal === 0) {
      return;
    }

    if (location === "pantry") {
      const timer = setTimeout(() => {
        audio.stopVocal();
        audio.playCue("vocal-relief", { volume: 0.45 * volumeScale });
      }, 350);
      return () => clearTimeout(timer);
    }
  }, [arrivalSignal, audio, location, volumeScale]);
}

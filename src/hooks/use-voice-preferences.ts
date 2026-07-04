"use client";

import { useCallback, useEffect, useState } from "react";
import { VOICE_PREFERENCES_STORAGE_KEY } from "@/lib/voice/constants";
import {
  DEFAULT_VOICE_PREFERENCES,
  type VoicePreferences,
} from "@/lib/voice/types";

function readStoredPreferences(): VoicePreferences {
  if (typeof window === "undefined") {
    return DEFAULT_VOICE_PREFERENCES;
  }

  try {
    const raw = window.localStorage.getItem(VOICE_PREFERENCES_STORAGE_KEY);

    if (!raw) {
      return DEFAULT_VOICE_PREFERENCES;
    }

    const parsed = JSON.parse(raw) as Partial<VoicePreferences>;

    return {
      inputEnabled:
        parsed.inputEnabled ?? DEFAULT_VOICE_PREFERENCES.inputEnabled,
      outputEnabled:
        parsed.outputEnabled ?? DEFAULT_VOICE_PREFERENCES.outputEnabled,
      locale: parsed.locale ?? DEFAULT_VOICE_PREFERENCES.locale,
    };
  } catch {
    return DEFAULT_VOICE_PREFERENCES;
  }
}

export function useVoicePreferences() {
  const [preferences, setPreferencesState] = useState<VoicePreferences>(
    DEFAULT_VOICE_PREFERENCES
  );

  useEffect(() => {
    setPreferencesState(readStoredPreferences());
  }, []);

  const setPreferences = useCallback((patch: Partial<VoicePreferences>) => {
    setPreferencesState((current) => {
      const next = { ...current, ...patch };
      window.localStorage.setItem(
        VOICE_PREFERENCES_STORAGE_KEY,
        JSON.stringify(next)
      );
      return next;
    });
  }, []);

  const toggleOutput = useCallback(() => {
    setPreferencesState((current) => {
      const next = { ...current, outputEnabled: !current.outputEnabled };
      window.localStorage.setItem(
        VOICE_PREFERENCES_STORAGE_KEY,
        JSON.stringify(next)
      );
      return next;
    });
  }, []);

  return {
    preferences,
    setPreferences,
    toggleOutput,
  };
}

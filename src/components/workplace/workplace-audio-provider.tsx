"use client";

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { getWorkplaceAudioEngine } from "@/lib/audio/workplace-audio-engine";
import type {
  PlayCueOptions,
  WorkplaceAudioContextValue,
  WorkplaceAudioCue,
} from "@/lib/audio/workplace-audio-types";

const STORAGE_KEY = "workplaceAudioEnabled";

const WorkplaceAudioContext = createContext<WorkplaceAudioContextValue | null>(
  null
);

interface WorkplaceAudioProviderProps {
  children: ReactNode;
  /** Stops background music (lofi loop). */
  musicSuppressed?: boolean;
  /** Mutes footsteps, vocals, and other ambient cues. */
  sfxSuppressed?: boolean;
}

export function WorkplaceAudioProvider({
  children,
  sfxSuppressed = false,
  musicSuppressed = false,
}: WorkplaceAudioProviderProps) {
  const engine = useMemo(() => getWorkplaceAudioEngine(), []);
  const [enabled, setEnabledState] = useState(false);
  const [unlocked, setUnlocked] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === "true") {
        setEnabledState(true);
      }
    } catch {
      // localStorage unavailable
    }
  }, []);

  useEffect(() => {
    engine.setSfxEnabled(enabled && !sfxSuppressed);
  }, [enabled, engine, sfxSuppressed]);

  useEffect(() => {
    engine.setMusicEnabled(enabled && !musicSuppressed);
  }, [enabled, engine, musicSuppressed]);

  useEffect(() => {
    if (!(enabled && !musicSuppressed && unlocked)) {
      return;
    }

    engine.resumeBackgroundMusic().catch(() => undefined);
  }, [enabled, engine, musicSuppressed, unlocked]);

  const unlock = useCallback(async () => {
    await engine.unlock();
    setUnlocked(engine.isUnlocked());
  }, [engine]);

  useEffect(() => {
    if (!enabled || musicSuppressed || unlocked) {
      return;
    }

    const handleGesture = () => {
      if (enabled && !musicSuppressed) {
        engine.startMusicFromUserGesture();
      }
      unlock().catch(() => undefined);
    };

    window.addEventListener("pointerdown", handleGesture, { once: true });
    window.addEventListener("keydown", handleGesture, { once: true });

    return () => {
      window.removeEventListener("pointerdown", handleGesture);
      window.removeEventListener("keydown", handleGesture);
    };
  }, [enabled, engine, musicSuppressed, unlock, unlocked]);

  const enableFromUserGesture = useCallback(() => {
    setEnabledState(true);
    try {
      localStorage.setItem(STORAGE_KEY, "true");
    } catch {
      // localStorage unavailable
    }

    engine.setSfxEnabled(!sfxSuppressed);
    engine.setMusicEnabled(!musicSuppressed);

    if (!musicSuppressed) {
      engine.startMusicFromUserGesture();
    }

    engine.unlock().then(() => {
      setUnlocked(engine.isUnlocked());
    });
  }, [engine, musicSuppressed, sfxSuppressed]);

  const setEnabled = useCallback(
    (next: boolean) => {
      setEnabledState(next);
      try {
        localStorage.setItem(STORAGE_KEY, String(next));
      } catch {
        // localStorage unavailable
      }

      if (next) {
        engine.unlock().then(() => {
          setUnlocked(engine.isUnlocked());
        });
      } else {
        engine.setSfxEnabled(false);
        engine.setMusicEnabled(false);
      }
    },
    [engine]
  );

  const playCue = useCallback(
    (cue: WorkplaceAudioCue, options?: PlayCueOptions) => {
      engine.playCue(cue, options);
    },
    [engine]
  );

  const stopVocal = useCallback(() => {
    engine.stopVocal();
  }, [engine]);

  const value = useMemo<WorkplaceAudioContextValue>(
    () => ({
      enabled,
      enableFromUserGesture,
      setEnabled,
      unlocked,
      unlock,
      playCue,
      stopVocal,
    }),
    [
      enabled,
      enableFromUserGesture,
      playCue,
      setEnabled,
      stopVocal,
      unlock,
      unlocked,
    ]
  );

  return (
    <WorkplaceAudioContext.Provider value={value}>
      {children}
    </WorkplaceAudioContext.Provider>
  );
}

export function useWorkplaceAudio(): WorkplaceAudioContextValue {
  const context = useContext(WorkplaceAudioContext);
  if (!context) {
    throw new Error(
      "useWorkplaceAudio must be used within WorkplaceAudioProvider"
    );
  }
  return context;
}

/** Safe variant — no-op when provider is absent (e.g. tests). */
export function useWorkplaceAudioOptional(): WorkplaceAudioContextValue | null {
  return useContext(WorkplaceAudioContext);
}

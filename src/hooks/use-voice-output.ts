"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface UseVoiceOutputOptions {
  enabled?: boolean;
  locale?: string;
  speakerId: string;
}

export function useVoiceOutput(options: UseVoiceOutputOptions) {
  const { enabled = false, locale = "en", speakerId } = options;
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const objectUrlRef = useRef<string | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const revokeObjectUrl = useCallback(() => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
  }, []);

  const stopSpeaking = useCallback(() => {
    const audio = audioRef.current;

    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }

    revokeObjectUrl();
    setIsSpeaking(false);
  }, [revokeObjectUrl]);

  useEffect(() => stopSpeaking, [stopSpeaking]);

  const speak = useCallback(
    async (text: string) => {
      const trimmed = text.trim();

      if (!(enabled && trimmed)) {
        return;
      }

      stopSpeaking();

      try {
        const response = await fetch("/api/voice/speak", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: trimmed, speakerId, locale }),
        });

        if (!response.ok) {
          return;
        }

        const blob = await response.blob();
        const objectUrl = URL.createObjectURL(blob);
        objectUrlRef.current = objectUrl;

        const audio = new Audio(objectUrl);
        audioRef.current = audio;

        audio.onended = () => {
          revokeObjectUrl();
          setIsSpeaking(false);
        };

        audio.onerror = () => {
          revokeObjectUrl();
          setIsSpeaking(false);
        };

        setIsSpeaking(true);
        await audio.play();
      } catch {
        revokeObjectUrl();
        setIsSpeaking(false);
      }
    },
    [enabled, locale, revokeObjectUrl, speakerId, stopSpeaking]
  );

  return {
    isSpeaking,
    speak,
    stopSpeaking,
  };
}

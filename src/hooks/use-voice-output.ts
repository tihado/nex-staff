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
  const queueRef = useRef<string[]>([]);
  const processingRef = useRef(false);
  const enabledRef = useRef(enabled);
  const [isSpeaking, setIsSpeaking] = useState(false);

  enabledRef.current = enabled;

  const revokeObjectUrl = useCallback(() => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
  }, []);

  const stopAudio = useCallback(() => {
    const audio = audioRef.current;

    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }

    revokeObjectUrl();
    setIsSpeaking(false);
  }, [revokeObjectUrl]);

  const stopSpeaking = useCallback(() => {
    queueRef.current = [];
    processingRef.current = false;
    stopAudio();
  }, [stopAudio]);

  useEffect(() => stopSpeaking, [stopSpeaking]);

  const playChunk = useCallback(
    (text: string): Promise<void> =>
      new Promise((resolve) => {
        const trimmed = text.trim();

        if (!trimmed) {
          resolve();
          return;
        }

        fetch("/api/voice/speak", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: trimmed, speakerId, locale }),
        })
          .then(async (response) => {
            if (!(response.ok && enabledRef.current)) {
              resolve();
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
              resolve();
            };

            audio.onerror = () => {
              revokeObjectUrl();
              setIsSpeaking(false);
              resolve();
            };

            setIsSpeaking(true);
            await audio.play();
          })
          .catch(() => {
            revokeObjectUrl();
            setIsSpeaking(false);
            resolve();
          });
      }),
    [locale, revokeObjectUrl, speakerId]
  );

  const processQueue = useCallback(async () => {
    if (processingRef.current) {
      return;
    }

    processingRef.current = true;

    while (queueRef.current.length > 0 && enabledRef.current) {
      const chunk = queueRef.current.shift();

      if (!chunk) {
        continue;
      }

      await playChunk(chunk);
    }

    processingRef.current = false;
  }, [playChunk]);

  const queueSpeak = useCallback(
    (text: string) => {
      const trimmed = text.trim();

      if (!(enabled && trimmed)) {
        return;
      }

      queueRef.current.push(trimmed);
      processQueue().catch(() => {
        // playChunk resolves on failure; queue continues.
      });
    },
    [enabled, processQueue]
  );

  const speak = useCallback(
    (text: string) => {
      stopSpeaking();
      queueSpeak(text);
    },
    [queueSpeak, stopSpeaking]
  );

  return {
    isSpeaking,
    queueSpeak,
    speak,
    stopSpeaking,
  };
}

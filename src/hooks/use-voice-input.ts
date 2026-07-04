"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { blobToWav } from "@/lib/voice/audio-webm-to-wav";
import { MAX_RECORDING_MS, RECORDING_MIME_TYPES } from "@/lib/voice/constants";
import type { VoiceInputState, VoiceTranscribeResult } from "@/lib/voice/types";

function pickRecordingMimeType(): string | null {
  if (typeof MediaRecorder === "undefined") {
    return null;
  }

  for (const mimeType of RECORDING_MIME_TYPES) {
    if (MediaRecorder.isTypeSupported(mimeType)) {
      return mimeType;
    }
  }

  return null;
}

interface UseVoiceInputOptions {
  chatId?: string;
  disabled?: boolean;
  locale?: string;
  onError?: (message: string) => void;
  onTranscript?: (text: string) => void;
}

export function useVoiceInput(options: UseVoiceInputOptions) {
  const {
    chatId,
    disabled = false,
    locale = "en",
    onTranscript,
    onError,
  } = options;

  const [state, setState] = useState<VoiceInputState>("idle");
  const [isSupported, setIsSupported] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startedAtRef = useRef<number>(0);
  const maxDurationTimerRef = useRef<number | null>(null);

  useEffect(() => {
    const supported =
      typeof window !== "undefined" &&
      Boolean(navigator.mediaDevices?.getUserMedia) &&
      pickRecordingMimeType() !== null;

    setIsSupported(supported);
  }, []);

  const cleanupStream = useCallback(() => {
    if (maxDurationTimerRef.current !== null) {
      window.clearTimeout(maxDurationTimerRef.current);
      maxDurationTimerRef.current = null;
    }

    mediaRecorderRef.current = null;

    if (mediaStreamRef.current) {
      for (const track of mediaStreamRef.current.getTracks()) {
        track.stop();
      }

      mediaStreamRef.current = null;
    }
  }, []);

  useEffect(() => cleanupStream, [cleanupStream]);

  const transcribeBlob = useCallback(
    async (blob: Blob, durationMs: number) => {
      setState("transcribing");

      try {
        const wavBlob = blob.type.includes("wav")
          ? blob
          : await blobToWav(blob);

        const formData = new FormData();
        formData.append("audio", wavBlob, "recording.wav");
        formData.append("durationMs", String(durationMs));

        if (chatId) {
          formData.append("chatId", chatId);
        }

        formData.append("locale", locale);

        const response = await fetch("/api/voice/transcribe", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          const payload = (await response.json().catch(() => null)) as {
            error?: string | { message?: string };
          } | null;
          const message =
            typeof payload?.error === "string"
              ? payload.error
              : (payload?.error?.message ?? "Couldn't hear that — try again");
          throw new Error(message);
        }

        const result = (await response.json()) as VoiceTranscribeResult;
        onTranscript?.(result.text);
      } catch (error) {
        onError?.(
          error instanceof Error
            ? error.message
            : "Couldn't hear that — try again"
        );
      } finally {
        setState("idle");
      }
    },
    [chatId, locale, onError, onTranscript]
  );

  const stopListening = useCallback(() => {
    const recorder = mediaRecorderRef.current;

    if (!recorder || recorder.state === "inactive") {
      return;
    }

    recorder.stop();
  }, []);

  const startListening = useCallback(async () => {
    if (disabled || state !== "idle" || !isSupported) {
      return;
    }

    try {
      const mimeType = pickRecordingMimeType();

      if (!mimeType) {
        throw new Error("Voice input is not supported in this browser");
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      chunksRef.current = [];
      startedAtRef.current = Date.now();

      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const durationMs = Date.now() - startedAtRef.current;
        const blob = new Blob(chunksRef.current, { type: mimeType });
        cleanupStream();

        if (blob.size === 0 || durationMs < 250) {
          setState("idle");
          onError?.("Recording too short — hold mic and speak again");
          return;
        }

        transcribeBlob(blob, durationMs).catch(() => {
          // transcribeBlob handles errors.
        });
      };

      recorder.onerror = () => {
        cleanupStream();
        setState("idle");
        onError?.("Microphone error — try again");
      };

      recorder.start();
      setState("listening");

      maxDurationTimerRef.current = window.setTimeout(() => {
        stopListening();
      }, MAX_RECORDING_MS);
    } catch (error) {
      cleanupStream();
      setState("idle");
      onError?.(
        error instanceof Error ? error.message : "Microphone permission denied"
      );
    }
  }, [
    cleanupStream,
    disabled,
    isSupported,
    onError,
    state,
    stopListening,
    transcribeBlob,
  ]);

  return {
    isSupported,
    startListening,
    state,
    stopListening,
  };
}

"use client";

import { Loader2 } from "lucide-react";
import { PixelButton, PixelIcon } from "@/components/pixel";
import { cn } from "@/lib/utils";
import type { VoiceInputState } from "@/lib/voice/types";

interface VoiceControlProps {
  className?: string;
  disabled?: boolean;
  isSupported?: boolean;
  onToggle: () => void;
  state?: VoiceInputState;
}

function voiceControlLabel(state: VoiceInputState): string {
  if (state === "listening") {
    return "Stop listening and transcribe";
  }

  if (state === "transcribing") {
    return "Transcribing speech";
  }

  return "Start voice input";
}

function voiceControlText(state: VoiceInputState): string {
  if (state === "listening") {
    return "Stop";
  }

  if (state === "transcribing") {
    return "...";
  }

  return "Voice";
}

function voiceControlIcon(state: VoiceInputState): string {
  if (state === "listening") {
    return "mic-off";
  }

  return "mic";
}

export function VoiceControl({
  state = "idle",
  disabled = false,
  isSupported = true,
  className,
  onToggle,
}: VoiceControlProps) {
  if (!isSupported) {
    return null;
  }

  const isListening = state === "listening";
  const isTranscribing = state === "transcribing";
  const isBusy = disabled || isTranscribing;

  return (
    <PixelButton
      aria-label={voiceControlLabel(state)}
      aria-pressed={isListening}
      className={cn(
        "px-2",
        isListening && "ring-2 ring-sun-glow ring-offset-1",
        className
      )}
      disabled={isBusy}
      onClick={onToggle}
      type="button"
    >
      <span className="flex items-center gap-1">
        {isTranscribing ? (
          <Loader2 aria-hidden className="size-3.5 animate-spin" />
        ) : (
          <PixelIcon aria-hidden name={voiceControlIcon(state)} size={14} />
        )}
        {voiceControlText(state)}
      </span>
    </PixelButton>
  );
}

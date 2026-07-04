"use client";

import { PixelIcon } from "@/components/pixel";
import { StaffAvatar } from "@/components/staff/staff-avatar";
import {
  PixelAssistant,
  PixelKing,
} from "@/components/workplace/pixel-scenery";
import type { DialogueEmotion } from "@/hooks/use-dialogue-engine";
import { cn } from "@/lib/utils";

const EMOTION_ICON: Record<DialogueEmotion, string> = {
  neutral: "android",
  happy: "mood-happy",
  think: "message",
  alert: "alert",
};

const PORTRAIT_SIZE = 56;

interface DialoguePortraitProps {
  avatarSprite?: string;
  className?: string;
  compact?: boolean;
  emotion?: DialogueEmotion;
  icon?: string;
  speakerId: string;
}

/**
 * NPC portrait beside the dialogue box. Pixel-art icon fallback for the MVP
 * (no sprite assets yet) per docs/UI-UX.md Phase 0. Bounces on speaker change
 * via a remount keyed on `speakerId`.
 */
export function DialoguePortrait({
  speakerId,
  icon,
  avatarSprite,
  emotion = "neutral",
  compact = false,
  className,
}: DialoguePortraitProps) {
  const portraitSize = compact ? 40 : PORTRAIT_SIZE;
  let figure = (
    <PixelIcon name={icon ?? EMOTION_ICON[emotion]} size={portraitSize} />
  );
  if (speakerId === "assistant") {
    figure = <PixelAssistant size={portraitSize} />;
  } else if (speakerId === "boss") {
    figure = <PixelKing size={portraitSize} />;
  } else if (avatarSprite) {
    figure = (
      <StaffAvatar
        size={portraitSize}
        spriteId={avatarSprite}
        staffId={speakerId}
      />
    );
  }

  return (
    <div
      className={cn(
        "portrait portrait-bounce pixel-frame flex shrink-0 items-center justify-center bg-sky-low text-sky-accent",
        compact ? "size-11" : "size-16 sm:size-24",
        className
      )}
      key={speakerId}
    >
      {figure}
    </div>
  );
}

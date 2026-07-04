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
  className,
}: DialoguePortraitProps) {
  let figure = (
    <PixelIcon name={icon ?? EMOTION_ICON[emotion]} size={PORTRAIT_SIZE} />
  );
  if (speakerId === "assistant") {
    figure = <PixelAssistant size={PORTRAIT_SIZE} />;
  } else if (speakerId === "boss") {
    figure = <PixelKing size={PORTRAIT_SIZE} />;
  } else if (avatarSprite) {
    figure = (
      <StaffAvatar
        size={PORTRAIT_SIZE}
        spriteId={avatarSprite}
        staffId={speakerId}
      />
    );
  }

  return (
    <div
      className={cn(
        "portrait portrait-bounce pixel-frame flex size-16 items-center justify-center bg-sky-low text-sky-accent sm:size-24",
        className
      )}
      key={speakerId}
    >
      {figure}
    </div>
  );
}

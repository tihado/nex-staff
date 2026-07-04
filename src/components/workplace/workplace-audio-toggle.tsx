"use client";

import { PixelButton } from "@/components/pixel/pixel-button";
import { useWorkplaceAudio } from "@/components/workplace/workplace-audio-provider";

export function WorkplaceAudioToggle() {
  const { enabled, enableFromUserGesture, setEnabled } = useWorkplaceAudio();

  const handleToggle = () => {
    if (enabled) {
      setEnabled(false);
      return;
    }

    enableFromUserGesture();
  };

  return (
    <PixelButton
      aria-label={
        enabled
          ? "Mute office sounds and music"
          : "Enable office sounds and music"
      }
      aria-pressed={enabled}
      onClick={handleToggle}
      title="Office sounds + lofi jazz"
      type="button"
    >
      {enabled ? "SND On" : "SND Off"}
    </PixelButton>
  );
}

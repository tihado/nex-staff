"use client";

import { PixelButton } from "@/components/pixel/pixel-button";
import { useWorkplaceAudio } from "@/components/workplace/workplace-audio-provider";
import { getWorkplaceAudioEngine } from "@/lib/audio/workplace-audio-engine";

export function WorkplaceAudioToggle() {
  const { enabled, setEnabled } = useWorkplaceAudio();

  const handleToggle = () => {
    if (enabled) {
      setEnabled(false);
      return;
    }

    // play() must run in the same user-gesture turn as the click.
    getWorkplaceAudioEngine().primeBackgroundMusicFromGesture();
    setEnabled(true);
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

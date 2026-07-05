"use client";

import { PixelButton, PixelIcon, PixelMusicOffIcon } from "@/components/pixel";
import { useWorkplaceAudio } from "@/components/workplace/workplace-audio-provider";

const MUSIC_TOGGLE_ICON_SIZE = 24;

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
      className="px-2"
      onClick={handleToggle}
      title="Office sounds + lofi jazz"
      type="button"
    >
      {enabled ? (
        <PixelIcon aria-hidden name="music" size={MUSIC_TOGGLE_ICON_SIZE} />
      ) : (
        <PixelMusicOffIcon size={MUSIC_TOGGLE_ICON_SIZE} />
      )}
    </PixelButton>
  );
}

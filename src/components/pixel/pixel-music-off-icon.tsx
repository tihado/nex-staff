interface PixelMusicOffIconProps {
  className?: string;
  size?: number;
}

const MUSIC_NOTE_PATH =
  "M4 12h4v2H4zm-2 2h2v4H2zm2 4h4v2H4zM8 6h2v12H8zm10 0h2v12h-2zm-6 8h2v4h-2zm2-2h4v2h-4zm0 6h4v2h-4zM10 4h8v2h-8z";

/** Pixel-art musical note with diagonal mute slash (matches pixelarticons `music`). */
const MUSIC_OFF_SLASH_PATH =
  "M4 18h2v2H4M6 16h2v2H6M8 14h2v2H8M10 12h2v2H10M12 10h2v2H12M14 8h2v2H14M16 6h2v2H16M18 4h2v2H18";

export function PixelMusicOffIcon({
  size = 24,
  className,
}: PixelMusicOffIconProps) {
  return (
    <svg
      aria-hidden
      className={className}
      height={size}
      role="presentation"
      viewBox="0 0 24 24"
      width={size}
    >
      <path d={MUSIC_NOTE_PATH} fill="currentColor" />
      <path
        className="text-alert"
        d={MUSIC_OFF_SLASH_PATH}
        fill="currentColor"
      />
    </svg>
  );
}

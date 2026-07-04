interface PixelAdvancePromptProps {
  label?: string;
  visible?: boolean;
}

export function PixelAdvancePrompt({
  label = "▼ Tiếp tục",
  visible = true,
}: PixelAdvancePromptProps) {
  if (!visible) {
    return null;
  }

  return (
    <p
      aria-hidden
      className="pixel-advance-indicator text-right font-[family-name:var(--font-pixel)] text-[length:var(--font-size-nameplate)] text-pixel-accent"
    >
      {label}
    </p>
  );
}

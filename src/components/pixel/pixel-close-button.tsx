import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface PixelCloseButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {
  label?: string;
}

export function PixelCloseButton({
  className,
  label = "[X]",
  type = "button",
  ...props
}: PixelCloseButtonProps) {
  return (
    <button
      aria-label="Close"
      className={cn(
        "pixel-wood-btn inline-flex size-9 min-h-9 min-w-9 cursor-pointer items-center justify-center font-[family-name:var(--font-pixel)] text-[length:var(--font-size-nameplate)] leading-none focus-visible:outline-2 focus-visible:outline-pixel-accent focus-visible:outline-offset-2",
        className
      )}
      type={type}
      {...props}
    >
      {label}
    </button>
  );
}

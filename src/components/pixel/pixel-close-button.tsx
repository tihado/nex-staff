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
        "inline-flex size-8 min-h-8 min-w-8 cursor-pointer items-center justify-center border-2 border-border-dialogue bg-choice-bg font-[family-name:var(--font-pixel)] text-[length:var(--font-size-nameplate)] text-text-primary hover:bg-choice-hover hover:text-bg-dialogue focus-visible:outline-2 focus-visible:outline-pixel-accent focus-visible:outline-offset-2 active:translate-x-px active:translate-y-px",
        className
      )}
      type={type}
      {...props}
    >
      {label}
    </button>
  );
}

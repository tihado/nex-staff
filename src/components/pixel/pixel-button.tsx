import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

interface PixelButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
}

export function PixelButton({
  children,
  className,
  disabled,
  type = "button",
  ...props
}: PixelButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex min-h-8 cursor-pointer select-none items-center justify-center border-2 border-border-dialogue bg-choice-bg px-4 py-2 font-[family-name:var(--font-pixel)] text-[length:var(--font-size-nameplate)] text-text-primary transition-none hover:bg-choice-hover hover:text-bg-dialogue focus-visible:outline-2 focus-visible:outline-pixel-accent focus-visible:outline-offset-2 active:translate-x-px active:translate-y-px disabled:cursor-not-allowed disabled:border-text-muted disabled:bg-bg-dialogue disabled:text-text-muted disabled:opacity-50 disabled:hover:bg-bg-dialogue disabled:hover:text-text-muted",
        className
      )}
      disabled={disabled}
      type={type}
      {...props}
    >
      {children}
    </button>
  );
}

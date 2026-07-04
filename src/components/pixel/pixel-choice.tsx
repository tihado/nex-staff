import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

interface PixelChoiceProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  selected?: boolean;
}

export function PixelChoice({
  children,
  className,
  selected = false,
  type = "button",
  ...props
}: PixelChoiceProps) {
  return (
    <button
      className={cn(
        "flex w-full cursor-pointer items-center gap-2 px-3 py-2 text-left font-[family-name:var(--font-pixel)] text-[length:var(--font-size-nameplate)] transition-none focus-visible:outline-2 focus-visible:outline-pixel-accent focus-visible:outline-offset-1",
        selected
          ? "bg-choice-hover text-bg-dialogue"
          : "bg-choice-bg text-text-primary hover:bg-choice-hover/60",
        className
      )}
      data-selected={selected || undefined}
      role="menuitem"
      type={type}
      {...props}
    >
      <span
        aria-hidden
        className={cn(
          "inline-block w-4 shrink-0",
          selected ? "opacity-100" : "opacity-0"
        )}
      >
        ▶
      </span>
      <span>{children}</span>
    </button>
  );
}

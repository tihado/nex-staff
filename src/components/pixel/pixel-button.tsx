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
        "pixel-wood-btn inline-flex min-h-9 cursor-pointer select-none items-center justify-center px-5 py-2 font-[family-name:var(--font-pixel)] text-[length:var(--font-size-nameplate)] uppercase transition-none focus-visible:outline-2 focus-visible:outline-pixel-accent focus-visible:outline-offset-2",
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

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface PixelPanelProps {
  children: ReactNode;
  className?: string;
  title?: string;
}

export function PixelPanel({ children, className, title }: PixelPanelProps) {
  return (
    <section
      className={cn(
        "relative border-[length:var(--pixel-border-width)] border-border-dialogue bg-bg-dialogue text-text-primary shadow-[var(--pixel-shadow)]",
        className
      )}
    >
      {title ? (
        <header className="absolute top-0 left-4 -translate-y-1/2 bg-nameplate-bg px-3 py-1 font-[family-name:var(--font-pixel)] text-[length:var(--font-size-nameplate)] text-text-primary uppercase tracking-wide">
          {title}
        </header>
      ) : null}
      <div className={cn(title && "pt-4")}>{children}</div>
    </section>
  );
}

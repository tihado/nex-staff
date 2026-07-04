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
        "pixel-frame relative bg-bg-dialogue text-text-primary",
        className
      )}
    >
      {title ? (
        <header className="absolute top-0 left-4 -translate-y-1/2 border-2 border-wood-dark bg-nameplate-bg px-3 py-1 font-[family-name:var(--font-pixel)] text-[length:var(--font-size-nameplate)] text-sun uppercase tracking-wide [text-shadow:1px_1px_0_#5c3a1a]">
          {title}
        </header>
      ) : null}
      <div className={cn(title && "pt-4")}>{children}</div>
    </section>
  );
}

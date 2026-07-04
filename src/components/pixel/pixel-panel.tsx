import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface PixelPanelProps {
  children: ReactNode;
  className?: string;
  contentClassName?: string;
  title?: string;
  /** Inset title stays inside the panel — avoids clipping with overflow-hidden parents. */
  titleInset?: boolean;
}

export function PixelPanel({
  children,
  className,
  contentClassName,
  title,
  titleInset = false,
}: PixelPanelProps) {
  return (
    <section
      className={cn(
        "pixel-frame relative bg-bg-dialogue text-text-primary",
        className
      )}
    >
      {title && titleInset ? (
        <header className="shrink-0 border-wood border-b-[3px] bg-nameplate-bg px-3 py-2 font-[family-name:var(--font-pixel)] text-[length:var(--font-size-nameplate)] text-sun uppercase tracking-wide [text-shadow:1px_1px_0_#5c3a1a]">
          {title}
        </header>
      ) : null}
      {title && !titleInset ? (
        <header className="absolute top-0 left-4 z-10 -translate-y-1/2 border-2 border-wood-dark bg-nameplate-bg px-3 py-1 font-[family-name:var(--font-pixel)] text-[length:var(--font-size-nameplate)] text-sun uppercase tracking-wide [text-shadow:1px_1px_0_#5c3a1a]">
          {title}
        </header>
      ) : null}
      <div className={cn(title && !titleInset && "pt-4", contentClassName)}>
        {children}
      </div>
    </section>
  );
}

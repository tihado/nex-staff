import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface LibraryShelfRowProps {
  children: ReactNode;
  className?: string;
  label: string;
}

export function LibraryShelfRow({
  children,
  className,
  label,
}: LibraryShelfRowProps) {
  return (
    <section aria-label={label} className={cn("relative shrink-0", className)}>
      <p className="mb-1 font-[family-name:var(--font-pixel)] text-[8px] text-text-muted uppercase tracking-wide">
        {label}
      </p>
      <div className="relative border-2 border-wood-dark bg-choice-bg/50 px-3 pt-3 pb-1">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-[#9C6B3B]"
        />
        <div className="flex min-h-[112px] flex-wrap items-end gap-2">
          {children}
        </div>
      </div>
      <div
        aria-hidden
        className="h-3 border-2 border-wood-dark border-t-0 bg-[#9C6B3B] shadow-[0_3px_0_#573417]"
      />
    </section>
  );
}

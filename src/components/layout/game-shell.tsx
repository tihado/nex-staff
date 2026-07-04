import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface GameShellProps {
  children: ReactNode;
  className?: string;
  letterbox?: boolean;
}

export function GameShell({
  children,
  className,
  letterbox = true,
}: GameShellProps) {
  return (
    <div
      className={cn(
        "game-shell flex h-dvh flex-col overflow-hidden bg-bg-scene text-text-primary",
        className
      )}
    >
      <div
        className={cn(
          "relative flex min-h-0 flex-1 flex-col",
          letterbox && "lg:items-center lg:justify-center lg:p-4"
        )}
      >
        <div
          className={cn(
            "relative flex min-h-0 w-full flex-col",
            letterbox
              ? "min-h-0 flex-1 lg:aspect-video lg:max-h-[calc(100dvh-2rem)] lg:max-w-[calc((100dvh-2rem)*16/9)] lg:flex-none lg:overflow-hidden lg:border-4 lg:border-border-dialogue lg:shadow-[var(--pixel-shadow)]"
              : "min-h-0 flex-1"
          )}
        >
          {children}
        </div>
      </div>
    </div>
  );
}

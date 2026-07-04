import type { ReactNode, Ref } from "react";
import { cn } from "@/lib/utils";
import { PixelPanel } from "./pixel-panel";

interface PixelDialogueBoxProps {
  children: ReactNode;
  className?: string;
  compact?: boolean;
  portrait?: ReactNode;
  scrollRef?: Ref<HTMLDivElement>;
  speakerName: string;
}

export function PixelDialogueBox({
  speakerName,
  children,
  portrait,
  scrollRef,
  compact = false,
  className,
}: PixelDialogueBoxProps) {
  return (
    <div className={cn("relative", className)}>
      <div className="flex items-end gap-0">
        {portrait ? (
          <div className="portrait relative z-10 -mr-4 mb-2 shrink-0">
            {portrait}
          </div>
        ) : null}

        <PixelPanel className="min-w-0 flex-1">
          <div
            className={cn("relative px-3 pb-3", compact ? "pt-2" : "px-4 pt-6")}
          >
            {compact ? (
              <div className="mb-1.5 inline-block border-2 border-wood-dark bg-nameplate-bg px-2 py-0.5 font-[family-name:var(--font-pixel)] text-[8px] text-sun uppercase [text-shadow:1px_1px_0_#5c3a1a]">
                ▼ {speakerName}
              </div>
            ) : (
              <div className="absolute top-0 left-4 -translate-y-full border-2 border-wood-dark bg-nameplate-bg px-3 py-1 font-[family-name:var(--font-pixel)] text-[length:var(--font-size-nameplate)] text-sun [text-shadow:1px_1px_0_#5c3a1a]">
                ▼ {speakerName}
              </div>
            )}

            <div
              aria-live="polite"
              className={cn(
                "overflow-y-auto font-[family-name:var(--font-pixel)] text-text-primary tracking-tight",
                compact
                  ? "max-h-[5rem] min-h-[2.75rem] text-[10px] leading-[1.75]"
                  : "max-h-[min(40vh,18rem)] min-h-[4.5rem] text-[11px] leading-[1.9] max-sm:max-h-[min(50vh,18rem)]"
              )}
              ref={scrollRef}
            >
              {children}
            </div>
          </div>
        </PixelPanel>
      </div>
    </div>
  );
}

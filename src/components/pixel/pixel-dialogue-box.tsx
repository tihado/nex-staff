import type { ReactNode, Ref } from "react";
import { cn } from "@/lib/utils";
import { PixelPanel } from "./pixel-panel";

interface PixelDialogueBoxProps {
  children: ReactNode;
  className?: string;
  portrait?: ReactNode;
  scrollRef?: Ref<HTMLDivElement>;
  speakerName: string;
}

export function PixelDialogueBox({
  speakerName,
  children,
  portrait,
  scrollRef,
  className,
}: PixelDialogueBoxProps) {
  return (
    <div
      aria-label={`Dialogue with ${speakerName}`}
      aria-live="polite"
      className={cn("relative", className)}
      role="dialog"
    >
      <div className="flex items-end gap-0">
        {portrait ? (
          <div className="portrait relative z-10 -mr-4 mb-2 shrink-0">
            {portrait}
          </div>
        ) : null}

        <PixelPanel className="min-w-0 flex-1">
          <div className="relative px-4 pt-6 pb-3">
            <div className="absolute top-0 left-4 -translate-y-full border-2 border-wood-dark bg-nameplate-bg px-3 py-1 font-[family-name:var(--font-pixel)] text-[length:var(--font-size-nameplate)] text-sun [text-shadow:1px_1px_0_#5c3a1a]">
              ▼ {speakerName}
            </div>

            <div
              className={cn(
                "max-h-[min(40vh,18rem)] min-h-[4.5rem] overflow-y-auto",
                "font-[family-name:var(--font-pixel)] text-[11px] text-text-primary leading-[1.9] tracking-tight",
                "transition-[max-height] duration-200 ease-out",
                "max-sm:max-h-[min(50vh,18rem)]"
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

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { PixelAdvancePrompt } from "./pixel-advance-prompt";
import { PixelPanel } from "./pixel-panel";

interface PixelDialogueBoxProps {
  advanceLabel?: string;
  children: ReactNode;
  className?: string;
  portrait?: ReactNode;
  showAdvancePrompt?: boolean;
  speakerName: string;
}

export function PixelDialogueBox({
  speakerName,
  children,
  portrait,
  showAdvancePrompt = false,
  advanceLabel,
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
            <div className="absolute top-0 left-4 -translate-y-full bg-nameplate-bg px-3 py-1 font-[family-name:var(--font-pixel)] text-[length:var(--font-size-nameplate)] text-text-primary">
              ▼ {speakerName}
            </div>

            <div className="min-h-[4.5rem] font-[family-name:var(--font-body)] text-[length:var(--font-size-dialogue)] text-text-primary leading-[var(--line-height-dialogue)]">
              {children}
            </div>

            <PixelAdvancePrompt
              label={advanceLabel}
              visible={showAdvancePrompt}
            />
          </div>
        </PixelPanel>
      </div>
    </div>
  );
}

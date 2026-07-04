import { cn } from "@/lib/utils";

interface DialogueThinkingIndicatorProps {
  className?: string;
}

export function DialogueThinkingIndicator({
  className,
}: DialogueThinkingIndicatorProps) {
  return (
    <span
      aria-label="Assistant is thinking"
      className={cn(
        "dialogue-thinking inline-flex items-baseline gap-px font-pixel text-[11px] text-pixel-text-muted leading-none",
        className
      )}
      role="status"
    >
      <span aria-hidden className="dialogue-thinking-dot">
        .
      </span>
      <span aria-hidden className="dialogue-thinking-dot">
        .
      </span>
      <span aria-hidden className="dialogue-thinking-dot">
        .
      </span>
    </span>
  );
}

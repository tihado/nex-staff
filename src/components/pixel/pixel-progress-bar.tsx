import { cn } from "@/lib/utils";

interface PixelProgressBarProps {
  className?: string;
  label?: string;
  max?: number;
  segmented?: boolean;
  segments?: number;
  value: number;
}

export function PixelProgressBar({
  value,
  max = 100,
  label,
  segmented = true,
  segments = 8,
  className,
}: PixelProgressBarProps) {
  const clamped = Math.min(Math.max(value, 0), max);
  const percent = max > 0 ? (clamped / max) * 100 : 0;

  if (segmented) {
    const filledSegments = Math.round((percent / 100) * segments);
    const segmentIds = Array.from(
      { length: segments },
      (_, index) => `segment-${index}`
    );

    return (
      <div className={cn("flex flex-col gap-1", className)}>
        {label ? (
          <span className="font-[family-name:var(--font-pixel)] text-[length:var(--font-size-nameplate)] text-text-muted">
            {label}
          </span>
        ) : null}
        <div
          aria-label={label ?? "Progress"}
          aria-valuemax={max}
          aria-valuemin={0}
          aria-valuenow={clamped}
          className="flex gap-1"
          role="progressbar"
        >
          {segmentIds.map((segmentId, index) => (
            <div
              className={cn(
                "h-4 flex-1 border-2 border-border-dialogue",
                index < filledSegments ? "bg-success" : "bg-bg-dialogue"
              )}
              key={segmentId}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col gap-1", className)}>
      {label ? (
        <span className="font-[family-name:var(--font-pixel)] text-[length:var(--font-size-nameplate)] text-text-muted">
          {label}
        </span>
      ) : null}
      <div
        aria-label={label ?? "Progress"}
        aria-valuemax={max}
        aria-valuemin={0}
        aria-valuenow={clamped}
        className="h-4 border-2 border-border-dialogue bg-bg-dialogue"
        role="progressbar"
      >
        <div
          className="h-full bg-success transition-none"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}

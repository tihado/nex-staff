import {
  resolveSpineAccent,
  resolveSpineColor,
  resolveSpineLabel,
} from "@/components/archive-room/document-mime-icon";
import { cn } from "@/lib/utils";

interface DocumentItemProps {
  filename: string;
  mimeType: string;
  onSelect: () => void;
  selected?: boolean;
  stackIndex?: number;
}

function truncateSpineName(filename: string, maxLength = 14): string {
  const trimmed = filename.trim();

  if (trimmed.length <= maxLength) {
    return trimmed;
  }

  return `${trimmed.slice(0, maxLength - 1)}…`;
}

export function DocumentItem({
  filename,
  mimeType,
  onSelect,
  selected = false,
  stackIndex = 0,
}: DocumentItemProps) {
  const spineColor = resolveSpineColor(mimeType);
  const spineAccent = resolveSpineAccent(mimeType);
  const spineLabel = resolveSpineLabel(mimeType);
  const stackOffset = Math.min(stackIndex, 2) * 4;

  return (
    <button
      aria-pressed={selected}
      className={cn(
        "group relative flex h-[104px] w-10 shrink-0 cursor-pointer flex-col items-center justify-end transition-none focus-visible:outline-2 focus-visible:outline-pixel-accent focus-visible:outline-offset-2",
        selected ? "-translate-y-1" : "hover:-translate-y-0.5"
      )}
      onClick={onSelect}
      style={{ marginBottom: stackOffset }}
      title={filename}
      type="button"
    >
      {stackIndex > 0 ? (
        <>
          <span
            aria-hidden
            className="absolute right-0 bottom-2 left-0 mx-auto block h-[92px] w-9 border-2 border-wood-dark"
            style={{
              backgroundColor: spineAccent,
              opacity: 0.45,
              transform: "translate(3px, 3px)",
            }}
          />
          <span
            aria-hidden
            className="absolute right-0 bottom-2 left-0 mx-auto block h-[96px] w-9 border-2 border-wood-dark"
            style={{
              backgroundColor: spineAccent,
              opacity: 0.65,
              transform: "translate(1px, 1px)",
            }}
          />
        </>
      ) : null}

      <span
        className={cn(
          "relative flex h-[96px] w-9 flex-col items-center border-2 border-wood-dark px-0.5 pt-1 pb-2 shadow-[2px_2px_0_rgba(122,74,36,0.35)]",
          selected &&
            "ring-2 ring-pixel-accent ring-offset-1 ring-offset-bg-dialogue"
        )}
        style={{ backgroundColor: spineColor }}
      >
        <span className="mt-1 border border-white/30 bg-bg-dialogue/85 px-0.5 font-[family-name:var(--font-pixel)] text-[8px] text-ink uppercase leading-none">
          {spineLabel}
        </span>
        <span aria-hidden className="my-1 h-px w-full bg-white/25" />
        <span className="max-h-[60px] flex-1 overflow-hidden font-[family-name:var(--font-body)] text-[#FFF6DF] text-[11px] leading-tight [text-orientation:mixed] [writing-mode:vertical-rl]">
          {truncateSpineName(filename)}
        </span>
      </span>
    </button>
  );
}

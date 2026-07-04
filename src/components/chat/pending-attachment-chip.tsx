import { FileText, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface PendingAttachmentChipProps {
  disabled?: boolean;
  filename: string;
  mediaType?: string;
  onRemove: () => void;
}

export function PendingAttachmentChip({
  filename,
  mediaType,
  onRemove,
  disabled = false,
}: PendingAttachmentChipProps) {
  return (
    <div
      className={cn(
        "inline-flex max-w-full items-center gap-2 rounded-md border border-primary/20 bg-primary/5 px-2.5 py-1.5 text-xs shadow-sm",
        disabled && "opacity-60"
      )}
    >
      <FileText aria-hidden className="size-3.5 shrink-0 text-primary" />
      <span className="max-w-[14rem] truncate font-medium text-foreground">
        {filename}
      </span>
      {mediaType ? (
        <span className="shrink-0 text-muted-foreground">{mediaType}</span>
      ) : null}
      <button
        aria-label={`Remove ${filename}`}
        className="inline-flex size-5 shrink-0 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground disabled:pointer-events-none"
        disabled={disabled}
        onClick={onRemove}
        type="button"
      >
        <X className="size-3.5" />
      </button>
    </div>
  );
}

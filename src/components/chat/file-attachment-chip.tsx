import { FileText } from "lucide-react";
import { cn } from "@/lib/utils";

interface FileAttachmentChipProps {
  filename?: string;
  mediaType?: string;
  url: string;
  variant?: "assistant" | "user";
}

export function FileAttachmentChip({
  filename,
  mediaType,
  url,
  variant = "assistant",
}: FileAttachmentChipProps) {
  const label = filename ?? "Attachment";
  const isUser = variant === "user";

  return (
    <a
      className={cn(
        "mt-3 inline-flex max-w-full items-center gap-2 rounded-lg border px-3 py-2 text-xs transition-colors",
        isUser
          ? "border-primary-foreground/25 bg-primary-foreground/10 hover:bg-primary-foreground/15"
          : "border-border bg-muted/50 hover:bg-muted"
      )}
      href={url}
      rel="noopener noreferrer"
      target="_blank"
    >
      <FileText aria-hidden className="size-4 shrink-0" />
      <span className="truncate font-medium">{label}</span>
      {mediaType ? (
        <span className="shrink-0 opacity-70">{mediaType}</span>
      ) : null}
    </a>
  );
}

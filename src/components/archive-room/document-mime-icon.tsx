import { PixelIcon } from "@/components/pixel";

interface DocumentMimeIconProps {
  className?: string;
  mimeType: string;
  size?: number;
}

function normalizeMimeType(mimeType: string): string {
  return mimeType.toLowerCase();
}

export function resolveMimeIconName(mimeType: string): string {
  const normalized = normalizeMimeType(mimeType);

  if (normalized === "application/pdf") {
    return "book";
  }

  if (normalized === "text/markdown" || normalized === "text/x-markdown") {
    return "note";
  }

  return "file";
}

/** Spine colors aligned with office bookshelf sprites. */
export function resolveSpineColor(mimeType: string): string {
  const normalized = normalizeMimeType(mimeType);

  if (normalized === "application/pdf") {
    return "#C0392B";
  }

  if (normalized === "text/markdown" || normalized === "text/x-markdown") {
    return "#2E86C1";
  }

  return "#E8A33D";
}

export function resolveSpineAccent(mimeType: string): string {
  const normalized = normalizeMimeType(mimeType);

  if (normalized === "application/pdf") {
    return "#922B21";
  }

  if (normalized === "text/markdown" || normalized === "text/x-markdown") {
    return "#1B4F72";
  }

  return "#B8791A";
}

export function resolveSpineLabel(mimeType: string): string {
  const normalized = normalizeMimeType(mimeType);

  if (normalized === "application/pdf") {
    return "PDF";
  }

  if (normalized === "text/markdown" || normalized === "text/x-markdown") {
    return "MD";
  }

  return "TXT";
}

export function DocumentMimeIcon({
  mimeType,
  className,
  size = 28,
}: DocumentMimeIconProps) {
  return (
    <PixelIcon
      className={className}
      name={resolveMimeIconName(mimeType)}
      size={size}
    />
  );
}

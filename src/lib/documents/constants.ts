export const DOCUMENT_MAX_BYTES = 10 * 1024 * 1024;

const PATH_SEPARATOR_PATTERN = /[/\\]/;
const UNSAFE_FILENAME_CHARS_PATTERN = /[^\w.\-()+\s]/g;

export const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "text/markdown",
  "text/plain",
  "text/x-markdown",
]);

const EXTENSION_MIME_TYPES: Record<string, string> = {
  ".pdf": "application/pdf",
  ".md": "text/markdown",
  ".markdown": "text/markdown",
  ".txt": "text/plain",
};

export function resolveMimeType(
  filename: string,
  reportedType: string
): string | null {
  const normalizedType = reportedType.split(";")[0]?.trim().toLowerCase() ?? "";

  if (ALLOWED_MIME_TYPES.has(normalizedType)) {
    return normalizedType;
  }

  const extension = filename.slice(filename.lastIndexOf(".")).toLowerCase();
  const inferredType = EXTENSION_MIME_TYPES[extension];

  if (inferredType && ALLOWED_MIME_TYPES.has(inferredType)) {
    return inferredType;
  }

  return null;
}

export function sanitizeFilename(filename: string): string {
  const basename = filename.split(PATH_SEPARATOR_PATTERN).pop() ?? "document";
  const sanitized = basename.replace(UNSAFE_FILENAME_CHARS_PATTERN, "_").trim();

  return sanitized.length > 0 ? sanitized : "document";
}

export function buildBlobPath(
  userId: string,
  documentId: string,
  filename: string
): string {
  return `${userId}/${documentId}/${filename}`;
}

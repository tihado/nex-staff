export type DocumentPreviewKind = "markdown" | "pdf" | "text" | "unsupported";

export function resolvePreviewKind(mimeType: string): DocumentPreviewKind {
  const normalized = mimeType.toLowerCase();

  if (normalized === "application/pdf") {
    return "pdf";
  }

  if (normalized === "text/markdown" || normalized === "text/x-markdown") {
    return "markdown";
  }

  if (normalized === "text/plain") {
    return "text";
  }

  return "unsupported";
}

export async function fetchDocumentText(blobUrl: string): Promise<string> {
  const response = await fetch(blobUrl);

  if (!response.ok) {
    throw new Error("Failed to load document content.");
  }

  return response.text();
}

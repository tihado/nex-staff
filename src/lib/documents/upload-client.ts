export interface UploadedDocument {
  blobUrl: string;
  filename: string;
  id: string;
  mimeType: string;
}

export async function uploadDocument(file: File): Promise<UploadedDocument> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch("/api/documents", {
    method: "POST",
    body: formData,
  });

  const payload = (await response.json()) as UploadedDocument & {
    error?: string;
  };

  if (!response.ok) {
    throw new Error(payload.error ?? "Failed to upload document.");
  }

  return {
    id: payload.id,
    filename: payload.filename,
    mimeType: payload.mimeType,
    blobUrl: payload.blobUrl,
  };
}

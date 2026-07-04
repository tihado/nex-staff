import type { TaskMetadata } from "@/db/schema";

function isHttpUrl(value: unknown): value is string {
  return typeof value === "string" && value.startsWith("http");
}

function readCoderMetadata(
  metadata: Record<string, unknown> | TaskMetadata | null | undefined
): TaskMetadata["coder"] | undefined {
  if (!metadata || typeof metadata !== "object") {
    return;
  }

  const coder = metadata.coder;

  if (!coder || typeof coder !== "object") {
    return;
  }

  return coder as TaskMetadata["coder"];
}

export function getCoderWebsitePreviewUrl(
  metadata: Record<string, unknown> | TaskMetadata | null | undefined
): string | undefined {
  const coder = readCoderMetadata(metadata);

  if (!coder) {
    return;
  }

  if (isHttpUrl(coder.cloudflarePreviewUrl)) {
    return coder.cloudflarePreviewUrl;
  }

  const previewUrl = coder.previewUrls?.find(
    (url) => isHttpUrl(url) && url !== coder.prUrl
  );

  return previewUrl;
}

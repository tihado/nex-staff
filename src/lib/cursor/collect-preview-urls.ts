import type { SDKAgent } from "@cursor/sdk";
import { put } from "@vercel/blob";

const IMAGE_EXTENSIONS = new Set([".png", ".jpg", ".jpeg", ".webp", ".gif"]);
const VIDEO_EXTENSIONS = new Set([".mp4", ".webm", ".mov"]);

function getExtension(path: string): string {
  const index = path.lastIndexOf(".");
  if (index === -1) {
    return "";
  }

  return path.slice(index).toLowerCase();
}

function isPreviewArtifact(path: string): boolean {
  const extension = getExtension(path);
  return IMAGE_EXTENSIONS.has(extension) || VIDEO_EXTENSIONS.has(extension);
}

function contentTypeForPath(path: string): string {
  const extension = getExtension(path);

  switch (extension) {
    case ".png":
      return "image/png";
    case ".jpg":
    case ".jpeg":
      return "image/jpeg";
    case ".webp":
      return "image/webp";
    case ".gif":
      return "image/gif";
    case ".mp4":
      return "video/mp4";
    case ".webm":
      return "video/webm";
    case ".mov":
      return "video/quicktime";
    default:
      return "application/octet-stream";
  }
}

async function uploadArtifactToBlob(
  buffer: Buffer,
  artifactPath: string,
  taskId: string
): Promise<string> {
  const filename = artifactPath.split("/").pop() ?? "preview.bin";
  const pathname = `coder-previews/${taskId}/${filename}`;
  const blob = await put(pathname, buffer, {
    access: "public",
    contentType: contentTypeForPath(artifactPath),
  });

  return blob.url;
}

export async function collectPreviewUrls(
  agent: SDKAgent,
  taskId: string,
  prUrl?: string
): Promise<string[]> {
  const previewUrls: string[] = [];

  if (prUrl) {
    previewUrls.push(prUrl);
  }

  const artifacts = await agent.listArtifacts();

  for (const artifact of artifacts) {
    if (!isPreviewArtifact(artifact.path)) {
      continue;
    }

    try {
      const buffer = await agent.downloadArtifact(artifact.path);
      const blobUrl = await uploadArtifactToBlob(buffer, artifact.path, taskId);
      previewUrls.push(blobUrl);
    } catch {
      // Artifact download is best-effort for preview links.
    }
  }

  return previewUrls;
}

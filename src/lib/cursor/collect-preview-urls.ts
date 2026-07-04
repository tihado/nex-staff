import { getCloudflarePagesPreviewUrl } from "@/lib/cloudflare/get-pages-preview-url";

export async function collectPreviewUrls(input: {
  branch?: string;
  prUrl?: string;
}): Promise<string[]> {
  const previewUrls: string[] = [];

  if (input.prUrl) {
    previewUrls.push(input.prUrl);
  }

  if (input.branch) {
    const cloudflarePreviewUrl = await getCloudflarePagesPreviewUrl(
      input.branch
    );

    if (cloudflarePreviewUrl) {
      previewUrls.push(cloudflarePreviewUrl);
    }
  }

  return previewUrls;
}

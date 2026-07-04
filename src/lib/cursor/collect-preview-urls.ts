import { getCloudflareWorkerName } from "@/lib/cloudflare/config";
import { getCloudflarePagesPreviewUrl } from "@/lib/cloudflare/get-pages-preview-url";
import { getCloudflareWorkersPreviewUrl } from "@/lib/cloudflare/get-workers-preview-url";

export async function collectPreviewUrls(input: {
  branch?: string;
  prUrl?: string;
}): Promise<string[]> {
  const previewUrls: string[] = [];

  if (input.prUrl) {
    previewUrls.push(input.prUrl);
  }

  if (input.branch) {
    const deploymentPreviewUrl = getCloudflareWorkerName()
      ? await getCloudflareWorkersPreviewUrl(input.branch)
      : await getCloudflarePagesPreviewUrl(input.branch);

    if (deploymentPreviewUrl) {
      previewUrls.push(deploymentPreviewUrl);
    }
  }

  return previewUrls;
}

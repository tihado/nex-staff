export interface CloudflareApiCredentials {
  accountId: string;
  apiToken: string;
}

export function getCloudflareApiCredentials():
  | CloudflareApiCredentials
  | undefined {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID?.trim();
  const apiToken = process.env.CLOUDFLARE_API_TOKEN?.trim();

  if (!(accountId && apiToken)) {
    return;
  }

  return { accountId, apiToken };
}

export function getCloudflareWorkerName(): string | undefined {
  return (
    process.env.CLOUDFLARE_WORKER_NAME?.trim() ??
    process.env.CLOUDFLARE_PAGES_PROJECT_NAME?.trim()
  );
}

export function getCloudflarePagesProjectName(): string | undefined {
  return process.env.CLOUDFLARE_PAGES_PROJECT_NAME?.trim();
}

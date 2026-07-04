import {
  branchToWorkerPreviewAlias,
  buildWorkerPreviewUrl,
} from "@/lib/cloudflare/branch-to-worker-alias";
import {
  getCloudflareApiCredentials,
  getCloudflareWorkerName,
} from "@/lib/cloudflare/config";
import {
  CLOUDFLARE_API_BASE,
  PREVIEW_INITIAL_DELAY_MS,
  PREVIEW_POLL_INTERVAL_MS,
  PREVIEW_POLL_TIMEOUT_MS,
} from "@/lib/cloudflare/constants";

interface WorkerVersion {
  annotations?: Record<string, string>;
  metadata?: {
    has_preview?: boolean;
  };
}

interface ListWorkerVersionsResponse {
  errors?: Array<{ message: string }>;
  result?: {
    items?: WorkerVersion[];
  };
  success?: boolean;
}

interface WorkersSubdomainResponse {
  errors?: Array<{ message: string }>;
  result?: {
    subdomain?: string;
  };
  success?: boolean;
}

function getWorkersPreviewConfig():
  | { accountId: string; apiToken: string; workerName: string }
  | undefined {
  const credentials = getCloudflareApiCredentials();
  const workerName = getCloudflareWorkerName();

  if (!(credentials && workerName)) {
    return;
  }

  return { ...credentials, workerName };
}

function findPreviewVersionForBranch(
  versions: WorkerVersion[],
  branch: string
): WorkerVersion | undefined {
  const alias = branchToWorkerPreviewAlias(branch);

  return versions.find(
    (version) =>
      version.metadata?.has_preview &&
      version.annotations?.["workers/alias"] === alias
  );
}

async function listWorkerVersions(config: {
  accountId: string;
  apiToken: string;
  workerName: string;
}): Promise<WorkerVersion[]> {
  const endpoint = `${CLOUDFLARE_API_BASE}/accounts/${config.accountId}/workers/scripts/${config.workerName}/versions`;

  const response = await fetch(endpoint, {
    headers: {
      Authorization: `Bearer ${config.apiToken}`,
      "Content-Type": "application/json",
    },
  });

  if (response.status === 404) {
    return [];
  }

  if (!response.ok) {
    throw new Error(
      `Cloudflare Workers API returned ${response.status} while listing versions.`
    );
  }

  const payload = (await response.json()) as ListWorkerVersionsResponse;

  if (!payload.success) {
    const message =
      payload.errors?.map((error) => error.message).join("; ") ||
      "Cloudflare Workers API request failed.";
    throw new Error(message);
  }

  return payload.result?.items ?? [];
}

async function getAccountWorkersSubdomain(config: {
  accountId: string;
  apiToken: string;
}): Promise<string | undefined> {
  const endpoint = `${CLOUDFLARE_API_BASE}/accounts/${config.accountId}/workers/subdomain`;

  const response = await fetch(endpoint, {
    headers: {
      Authorization: `Bearer ${config.apiToken}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(
      `Cloudflare Workers API returned ${response.status} while reading subdomain.`
    );
  }

  const payload = (await response.json()) as WorkersSubdomainResponse;

  if (!payload.success) {
    const message =
      payload.errors?.map((error) => error.message).join("; ") ||
      "Cloudflare Workers subdomain request failed.";
    throw new Error(message);
  }

  return payload.result?.subdomain?.trim();
}

async function fetchReadyWorkerPreviewUrl(
  branch: string
): Promise<string | undefined> {
  const config = getWorkersPreviewConfig();
  if (!config) {
    return;
  }

  const versions = await listWorkerVersions(config);
  const version = findPreviewVersionForBranch(versions, branch);

  if (!version) {
    return;
  }

  const alias = version.annotations?.["workers/alias"];
  if (!alias) {
    return;
  }

  const subdomain = await getAccountWorkersSubdomain(config);
  if (!subdomain) {
    return;
  }

  return buildWorkerPreviewUrl({
    alias,
    subdomain,
    workerName: config.workerName,
  });
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export async function getCloudflareWorkersPreviewUrl(
  branch: string
): Promise<string | undefined> {
  const trimmedBranch = branch.trim();
  if (!trimmedBranch) {
    return;
  }

  if (!getWorkersPreviewConfig()) {
    return;
  }

  await sleep(PREVIEW_INITIAL_DELAY_MS);

  const startedAt = Date.now();

  while (Date.now() - startedAt < PREVIEW_POLL_TIMEOUT_MS) {
    const previewUrl = await fetchReadyWorkerPreviewUrl(trimmedBranch);
    if (previewUrl) {
      return previewUrl;
    }

    await sleep(PREVIEW_POLL_INTERVAL_MS);
  }

  return;
}

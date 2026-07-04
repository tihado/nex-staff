const CLOUDFLARE_API_BASE = "https://api.cloudflare.com/client/v4";
const PREVIEW_POLL_INTERVAL_MS = 10_000;
const PREVIEW_POLL_TIMEOUT_MS = 180_000;

interface CloudflareDeployment {
  aliases?: string[];
  deployment_trigger?: {
    metadata?: {
      branch?: string;
    };
  };
  environment?: string;
  latest_stage?: {
    status?: string;
  };
  source?: {
    branch?: string;
  };
  url?: string;
}

interface CloudflareListDeploymentsResponse {
  errors?: Array<{ message: string }>;
  result?: CloudflareDeployment[];
  success?: boolean;
}

function getCloudflarePagesConfig():
  | { accountId: string; apiToken: string; projectName: string }
  | undefined {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID?.trim();
  const projectName = process.env.CLOUDFLARE_PAGES_PROJECT_NAME?.trim();
  const apiToken = process.env.CLOUDFLARE_API_TOKEN?.trim();

  if (!(accountId && projectName && apiToken)) {
    return;
  }

  return { accountId, projectName, apiToken };
}

function pickDeploymentUrl(
  deployment: CloudflareDeployment
): string | undefined {
  if (deployment.url) {
    return deployment.url;
  }

  const alias = deployment.aliases?.find((value) => value.startsWith("http"));
  return alias;
}

function isSuccessfulPreviewDeployment(
  deployment: CloudflareDeployment,
  branch: string
): boolean {
  const deploymentBranch =
    deployment.source?.branch ??
    deployment.deployment_trigger?.metadata?.branch;

  if (deploymentBranch && deploymentBranch !== branch) {
    return false;
  }

  return deployment.latest_stage?.status === "success";
}

async function listBranchDeployments(
  branch: string
): Promise<CloudflareDeployment[]> {
  const config = getCloudflarePagesConfig();
  if (!config) {
    return [];
  }

  const endpoint = new URL(
    `${CLOUDFLARE_API_BASE}/accounts/${config.accountId}/pages/projects/${config.projectName}/deployments`
  );
  endpoint.searchParams.set("env", "preview");

  const response = await fetch(endpoint, {
    headers: {
      Authorization: `Bearer ${config.apiToken}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(
      `Cloudflare Pages API returned ${response.status} while listing deployments.`
    );
  }

  const payload = (await response.json()) as CloudflareListDeploymentsResponse;

  if (!payload.success) {
    const message =
      payload.errors?.map((error) => error.message).join("; ") ||
      "Cloudflare Pages API request failed.";
    throw new Error(message);
  }

  return (payload.result ?? []).filter((deployment) => {
    const deploymentBranch =
      deployment.source?.branch ??
      deployment.deployment_trigger?.metadata?.branch;

    return !deploymentBranch || deploymentBranch === branch;
  });
}

async function fetchReadyPreviewUrl(
  branch: string
): Promise<string | undefined> {
  const deployments = await listBranchDeployments(branch);

  for (const deployment of deployments) {
    if (!isSuccessfulPreviewDeployment(deployment, branch)) {
      continue;
    }

    const url = pickDeploymentUrl(deployment);
    if (url) {
      return url;
    }
  }

  return;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export async function getCloudflarePagesPreviewUrl(
  branch: string
): Promise<string | undefined> {
  const trimmedBranch = branch.trim();
  if (!trimmedBranch) {
    return;
  }

  if (!getCloudflarePagesConfig()) {
    return;
  }

  const startedAt = Date.now();

  while (Date.now() - startedAt < PREVIEW_POLL_TIMEOUT_MS) {
    const previewUrl = await fetchReadyPreviewUrl(trimmedBranch);
    if (previewUrl) {
      return previewUrl;
    }

    await sleep(PREVIEW_POLL_INTERVAL_MS);
  }

  return;
}

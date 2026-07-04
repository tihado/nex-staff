const BRANCH_SLASH_PATTERN = /\//g;

export function branchToWorkerPreviewAlias(branch: string): string {
  return branch.trim().replace(BRANCH_SLASH_PATTERN, "-");
}

export function buildWorkerPreviewUrl(input: {
  alias: string;
  subdomain: string;
  workerName: string;
}): string {
  return `https://${input.alias}-${input.workerName}.${input.subdomain}.workers.dev`;
}

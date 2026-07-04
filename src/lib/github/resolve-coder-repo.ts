const DEFAULT_CODER_BRANCH = "main";
const GITHUB_REPO_URL_PATTERN = /^https:\/\/github\.com\/[\w.-]+\/[\w.-]+$/i;
const TRAILING_SLASH_PATTERN = /\/$/;

function normalizeRepoUrl(url: string): string {
  const trimmed = url.trim().replace(TRAILING_SLASH_PATTERN, "");
  if (!trimmed) {
    throw new Error("GitHub repository URL is required.");
  }

  if (!GITHUB_REPO_URL_PATTERN.test(trimmed)) {
    throw new Error(
      "GitHub repository URL must look like https://github.com/owner/repo"
    );
  }

  return trimmed;
}

export function getCoderDefaultBranch(): string {
  return (
    process.env.CODER_GITHUB_DEFAULT_BRANCH?.trim() || DEFAULT_CODER_BRANCH
  );
}

export function resolveCoderRepoUrl(override?: string): string {
  const repoUrl = override?.trim() || process.env.CODER_GITHUB_REPO_URL?.trim();

  if (!repoUrl) {
    throw new Error(
      "CODER_GITHUB_REPO_URL is not configured. Set it in the environment or pass githubRepoUrl when hiring a coder."
    );
  }

  return normalizeRepoUrl(repoUrl);
}

export function buildCoderGithubConfig(overrideRepoUrl?: string): {
  defaultBranch: string;
  repoUrl: string;
} {
  return {
    repoUrl: resolveCoderRepoUrl(overrideRepoUrl),
    defaultBranch: getCoderDefaultBranch(),
  };
}

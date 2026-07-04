const LEADING_SLASH_PATTERN = /^\//;

export function parseGithubRepoUrl(repoUrl: string): {
  owner: string;
  repo: string;
} {
  const url = new URL(repoUrl);
  const [owner, repo] = url.pathname
    .replace(LEADING_SLASH_PATTERN, "")
    .split("/");

  if (!(owner && repo)) {
    throw new Error(`Invalid GitHub repository URL: ${repoUrl}`);
  }

  return { owner, repo };
}

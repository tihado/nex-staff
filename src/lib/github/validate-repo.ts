import { Octokit } from "@octokit/rest";
import { resolveCoderRepoUrl } from "@/lib/github/resolve-coder-repo";

const LEADING_SLASH_PATTERN = /^\//;

function parseGithubRepoUrl(repoUrl: string): { owner: string; repo: string } {
  const url = new URL(repoUrl);
  const [owner, repo] = url.pathname
    .replace(LEADING_SLASH_PATTERN, "")
    .split("/");

  if (!(owner && repo)) {
    throw new Error(`Invalid GitHub repository URL: ${repoUrl}`);
  }

  return { owner, repo };
}

function getGitHubClient(): Octokit | null {
  const token = process.env.GITHUB_TOKEN?.trim();
  if (!token) {
    return null;
  }

  return new Octokit({ auth: token });
}

export async function validateGitHubRepo(
  repoUrl?: string
): Promise<{ defaultBranch: string; repoUrl: string }> {
  const resolvedUrl = resolveCoderRepoUrl(repoUrl);
  const client = getGitHubClient();

  if (!client) {
    return {
      repoUrl: resolvedUrl,
      defaultBranch: process.env.CODER_GITHUB_DEFAULT_BRANCH?.trim() || "main",
    };
  }

  const { owner, repo } = parseGithubRepoUrl(resolvedUrl);
  const response = await client.repos.get({ owner, repo });

  return {
    repoUrl: resolvedUrl,
    defaultBranch: response.data.default_branch,
  };
}

export async function createPullRequestFallback(input: {
  base: string;
  body?: string;
  head: string;
  repoUrl: string;
  title: string;
}): Promise<string | undefined> {
  const client = getGitHubClient();
  if (!client) {
    return;
  }

  const { owner, repo } = parseGithubRepoUrl(input.repoUrl);
  const response = await client.pulls.create({
    owner,
    repo,
    title: input.title,
    head: input.head,
    base: input.base,
    body: input.body,
  });

  return response.data.html_url;
}

import { Octokit } from "@octokit/rest";
import { parseGithubRepoUrl } from "@/lib/github/parse-repo-url";

function getGitHubClient(): Octokit {
  const token = process.env.GITHUB_TOKEN?.trim();
  if (!token) {
    throw new Error("GITHUB_TOKEN is not configured.");
  }

  return new Octokit({ auth: token });
}

function readPullRequestNumber(prUrl: string): number {
  const pullNumber = Number(prUrl.split("/").at(-1));

  if (!Number.isFinite(pullNumber)) {
    throw new Error(`Invalid pull request URL: ${prUrl}`);
  }

  return pullNumber;
}

export async function mergePullRequest(input: {
  prUrl: string;
  repoUrl: string;
}): Promise<{ merged: boolean; sha?: string }> {
  const client = getGitHubClient();
  const { owner, repo } = parseGithubRepoUrl(input.repoUrl);
  const pullNumber = readPullRequestNumber(input.prUrl);

  const pullRequest = await client.pulls.get({
    owner,
    repo,
    pull_number: pullNumber,
  });

  if (pullRequest.data.merged) {
    return {
      merged: true,
      sha: pullRequest.data.merge_commit_sha ?? undefined,
    };
  }

  if (pullRequest.data.state === "closed") {
    throw new Error("Pull request was closed without merging.");
  }

  const response = await client.pulls.merge({
    owner,
    repo,
    pull_number: pullNumber,
    merge_method: "squash",
  });

  return {
    merged: response.data.merged,
    sha: response.data.sha,
  };
}

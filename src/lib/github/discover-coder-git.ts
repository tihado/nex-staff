import { Octokit } from "@octokit/rest";
import {
  extractPullRequestUrlsFromText,
  pickLatestPullRequestUrl,
} from "@/lib/github/parse-coder-result-git";
import { parseGithubRepoUrl } from "@/lib/github/parse-repo-url";

export interface DiscoveredCoderGit {
  branch: string;
  prUrl: string;
}

function getGitHubClient(): Octokit | null {
  const token = process.env.GITHUB_TOKEN?.trim();
  if (!token) {
    return null;
  }

  return new Octokit({ auth: token });
}

function mapPullRequest(pullRequest: {
  created_at: string;
  head: { ref: string };
  html_url: string;
}): DiscoveredCoderGit {
  return {
    branch: pullRequest.head.ref,
    prUrl: pullRequest.html_url,
  };
}

export async function getPullRequestByUrl(
  repoUrl: string,
  prUrl: string
): Promise<DiscoveredCoderGit | undefined> {
  const client = getGitHubClient();
  if (!client) {
    return;
  }

  const { owner, repo } = parseGithubRepoUrl(repoUrl);
  const pullNumber = Number(prUrl.split("/").at(-1));

  if (!Number.isFinite(pullNumber)) {
    return;
  }

  const response = await client.pulls.get({
    owner,
    repo,
    pull_number: pullNumber,
  });

  return mapPullRequest(response.data);
}

async function resolveFromResultText(
  repoUrl: string,
  resultText: string
): Promise<DiscoveredCoderGit | undefined> {
  const pullRequestUrls = extractPullRequestUrlsFromText(resultText, repoUrl);
  const prUrl = pickLatestPullRequestUrl(pullRequestUrls);

  if (!prUrl) {
    return;
  }

  return await getPullRequestByUrl(repoUrl, prUrl);
}

async function discoverPullRequestCreatedAfter(
  repoUrl: string,
  taskStartedAt: Date
): Promise<DiscoveredCoderGit | undefined> {
  const client = getGitHubClient();
  if (!client) {
    return;
  }

  const { owner, repo } = parseGithubRepoUrl(repoUrl);
  const response = await client.pulls.list({
    owner,
    repo,
    state: "open",
    sort: "created",
    direction: "desc",
    per_page: 20,
  });

  const startedAtMs = taskStartedAt.getTime();

  for (const pullRequest of response.data) {
    if (new Date(pullRequest.created_at).getTime() >= startedAtMs) {
      return mapPullRequest(pullRequest);
    }
  }

  return;
}

async function resolveFromCursorGit(input: {
  cursorBranch?: string;
  cursorPrUrl?: string;
  repoUrl: string;
}): Promise<DiscoveredCoderGit | undefined> {
  const cursorBranch = input.cursorBranch?.trim();
  const cursorPrUrl = input.cursorPrUrl?.trim();

  if (cursorBranch) {
    return {
      branch: cursorBranch,
      prUrl: cursorPrUrl ?? "",
    };
  }

  if (cursorPrUrl) {
    return await getPullRequestByUrl(input.repoUrl, cursorPrUrl);
  }

  return;
}

export async function resolveCoderGitInfo(input: {
  cursorBranch?: string;
  cursorPrUrl?: string;
  repoUrl: string;
  resultText?: string;
  taskStartedAt: Date;
}): Promise<DiscoveredCoderGit | undefined> {
  const resultText = input.resultText?.trim() ?? "";

  if (resultText.length > 0) {
    const fromResult = await resolveFromResultText(input.repoUrl, resultText);
    if (fromResult) {
      return fromResult;
    }
  }

  const fromTaskWindow = await discoverPullRequestCreatedAfter(
    input.repoUrl,
    input.taskStartedAt
  );
  if (fromTaskWindow) {
    return fromTaskWindow;
  }

  return await resolveFromCursorGit(input);
}

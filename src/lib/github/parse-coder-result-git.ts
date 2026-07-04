import { parseGithubRepoUrl } from "@/lib/github/parse-repo-url";

const GITHUB_PULL_REQUEST_URL_PATTERN =
  /https:\/\/github\.com\/([\w.-]+)\/([\w.-]+)\/pull\/(\d+)/gi;

export function extractPullRequestUrlsFromText(
  text: string,
  repoUrl: string
): string[] {
  const { owner, repo } = parseGithubRepoUrl(repoUrl);
  const matches: string[] = [];

  for (const match of text.matchAll(GITHUB_PULL_REQUEST_URL_PATTERN)) {
    const matchOwner = match[1];
    const matchRepo = match[2];
    const pullNumber = match[3];

    if (
      matchOwner?.toLowerCase() === owner.toLowerCase() &&
      matchRepo?.toLowerCase() === repo.toLowerCase() &&
      pullNumber
    ) {
      matches.push(
        `https://github.com/${matchOwner}/${matchRepo}/pull/${pullNumber}`
      );
    }
  }

  return [...new Set(matches)];
}

export function pickLatestPullRequestUrl(urls: string[]): string | undefined {
  let latest: { number: number; url: string } | undefined;

  for (const url of urls) {
    const pullNumber = Number(url.split("/").at(-1));
    if (!Number.isFinite(pullNumber)) {
      continue;
    }

    if (!latest || pullNumber > latest.number) {
      latest = { number: pullNumber, url };
    }
  }

  return latest?.url;
}

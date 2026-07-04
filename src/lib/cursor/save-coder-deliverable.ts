import type { TaskMetadata } from "@/db/schema";

export interface CoderDeliverableInput {
  branch?: string;
  previewUrls: string[];
  prUrl?: string;
  repoUrl: string;
  summary: string;
  title: string;
}

function getCloudflarePreviewUrl(
  input: CoderDeliverableInput
): string | undefined {
  return input.previewUrls.find((url) => url !== input.prUrl);
}

const TECHNICAL_SUMMARY_LINE =
  /^(pull request:|pr:|preview:|branch:|repository:|-\s*(pr|preview|branch|repository):)/i;

function sanitizeCoderSummary(summary: string): string {
  return summary
    .split("\n")
    .filter((line) => {
      const trimmed = line.trim();

      if (!trimmed) {
        return true;
      }

      if (TECHNICAL_SUMMARY_LINE.test(trimmed)) {
        return false;
      }

      return !(trimmed.includes("github.com") && trimmed.includes("/pull/"));
    })
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function buildCoderDeliverableMarkdown(
  input: CoderDeliverableInput
): string {
  const summary =
    sanitizeCoderSummary(input.summary.trim()) || "Task completed.";

  const lines = [`## ${input.title}`, "", summary];

  const cloudflarePreviewUrl = getCloudflarePreviewUrl(input);
  if (cloudflarePreviewUrl) {
    lines.push("", `- Website preview: ${cloudflarePreviewUrl}`);
  }

  return lines.join("\n");
}

export function buildCoderTaskMetadata(
  input: CoderDeliverableInput
): NonNullable<TaskMetadata["coder"]> {
  const cloudflarePreviewUrl = getCloudflarePreviewUrl(input);

  return {
    repoUrl: input.repoUrl,
    prUrl: input.prUrl,
    branch: input.branch,
    previewUrls: input.previewUrls,
    cloudflarePreviewUrl,
  };
}

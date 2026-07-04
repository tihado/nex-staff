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

export function buildCoderDeliverableMarkdown(
  input: CoderDeliverableInput
): string {
  const lines = [
    `## ${input.title}`,
    "",
    input.summary.trim() || "Task completed.",
    "",
  ];

  if (input.prUrl) {
    lines.push(`- PR: ${input.prUrl}`);
  }

  const cloudflarePreviewUrl = getCloudflarePreviewUrl(input);
  if (cloudflarePreviewUrl) {
    lines.push(`- Preview: ${cloudflarePreviewUrl}`);
  }

  if (input.branch) {
    lines.push(`- Branch: \`${input.branch}\``);
  }

  lines.push(`- Repository: ${input.repoUrl}`);

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

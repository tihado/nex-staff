import type { TaskMetadata } from "@/db/schema";

const IMAGE_PREVIEW_URL_PATTERN = /\.(png|jpe?g|webp|gif)(\?|$)/i;

export interface CoderDeliverableInput {
  branch?: string;
  previewUrls: string[];
  prUrl?: string;
  repoUrl: string;
  summary: string;
  title: string;
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

  if (input.branch) {
    lines.push(`- Branch: \`${input.branch}\``);
  }

  lines.push(`- Repository: ${input.repoUrl}`);

  const imagePreview = input.previewUrls.find((url) =>
    IMAGE_PREVIEW_URL_PATTERN.test(url)
  );

  if (imagePreview) {
    lines.push("", "### Preview", "", `![Preview](${imagePreview})`);
  }

  return lines.join("\n");
}

export function buildCoderTaskMetadata(
  input: CoderDeliverableInput
): NonNullable<TaskMetadata["coder"]> {
  return {
    repoUrl: input.repoUrl,
    prUrl: input.prUrl,
    branch: input.branch,
    previewUrls: input.previewUrls,
  };
}

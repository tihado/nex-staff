import type { RunResult } from "@cursor/sdk";
import type { StaffGithubConfig } from "@/db/schema";
import { collectPreviewUrls } from "@/lib/cursor/collect-preview-urls";
import { buildCoderTaskTitle } from "@/lib/cursor/cursor-agent";
import {
  buildCoderDeliverableMarkdown,
  buildCoderTaskMetadata,
  type CoderDeliverableInput,
} from "@/lib/cursor/save-coder-deliverable";
import { resolveCoderGitInfo } from "@/lib/github/discover-coder-git";
import { createPullRequestFallback } from "@/lib/github/validate-repo";
import { saveDeliverable, updateTaskCoderMetadata } from "@/lib/tasks/service";

export async function finalizeCoderDeliverable(input: {
  brief: string;
  github: StaffGithubConfig;
  result: RunResult;
  taskId: string;
  taskStartedAt: Date;
}): Promise<{
  content: string;
  deliverableId: string;
  prUrl?: string;
  previewUrls: string[];
}> {
  const gitBranch = input.result.git?.branches?.[0];
  const resultText = input.result.result ?? "";

  const resolvedGit = await resolveCoderGitInfo({
    repoUrl: input.github.repoUrl,
    taskStartedAt: input.taskStartedAt,
    resultText,
    cursorBranch: gitBranch?.branch,
    cursorPrUrl: gitBranch?.prUrl,
  });

  const branch = resolvedGit?.branch?.trim() || undefined;
  let prUrl = resolvedGit?.prUrl?.trim() || undefined;

  if (!prUrl && branch) {
    prUrl = await createPullRequestFallback({
      repoUrl: input.github.repoUrl,
      base: input.github.defaultBranch,
      head: branch,
      title: buildCoderTaskTitle(input.brief),
      body: resultText || input.brief,
    });
  }

  const previewUrls = await collectPreviewUrls({
    branch,
    prUrl,
  });

  const deliverableInput: CoderDeliverableInput = {
    title: buildCoderTaskTitle(input.brief),
    summary: resultText || "Task completed.",
    prUrl,
    branch,
    repoUrl: input.github.repoUrl,
    previewUrls,
  };

  const content = buildCoderDeliverableMarkdown(deliverableInput);
  const deliverableId = await saveDeliverable(input.taskId, {
    title: deliverableInput.title,
    content,
    contentType: "text/markdown",
  });

  await updateTaskCoderMetadata(
    input.taskId,
    buildCoderTaskMetadata(deliverableInput)
  );

  return { deliverableId, content, prUrl, previewUrls };
}

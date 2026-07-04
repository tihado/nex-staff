import type { RunResult, SDKAgent } from "@cursor/sdk";
import type { StaffGithubConfig } from "@/db/schema";
import { collectPreviewUrls } from "@/lib/cursor/collect-preview-urls";
import { buildCoderTaskTitle } from "@/lib/cursor/cursor-agent";
import {
  buildCoderDeliverableMarkdown,
  buildCoderTaskMetadata,
  type CoderDeliverableInput,
} from "@/lib/cursor/save-coder-deliverable";
import { createPullRequestFallback } from "@/lib/github/validate-repo";
import { saveDeliverable, updateTaskCoderMetadata } from "@/lib/tasks/service";

export async function finalizeCoderDeliverable(input: {
  agent: SDKAgent;
  brief: string;
  github: StaffGithubConfig;
  result: RunResult;
  taskId: string;
}): Promise<{
  content: string;
  deliverableId: string;
  prUrl?: string;
  previewUrls: string[];
}> {
  const gitBranch = input.result.git?.branches?.[0];
  let prUrl = gitBranch?.prUrl;

  if (!prUrl && gitBranch?.branch) {
    prUrl = await createPullRequestFallback({
      repoUrl: input.github.repoUrl,
      base: input.github.defaultBranch,
      head: gitBranch.branch,
      title: buildCoderTaskTitle(input.brief),
      body: input.result.result ?? input.brief,
    });
  }

  const previewUrls = await collectPreviewUrls(
    input.agent,
    input.taskId,
    prUrl
  );

  const deliverableInput: CoderDeliverableInput = {
    title: buildCoderTaskTitle(input.brief),
    summary: input.result.result ?? "Task completed.",
    prUrl,
    branch: gitBranch?.branch,
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

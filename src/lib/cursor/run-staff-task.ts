import type { staff, task } from "@/db/schema";
import {
  buildCoderPrompt,
  resolveCursorAgent,
} from "@/lib/cursor/cursor-agent";
import { finalizeCoderDeliverable } from "@/lib/cursor/finalize-coder-deliverable";
import { streamCursorRunProgress } from "@/lib/cursor/stream-cursor-run";
import { getStaffGithubConfig } from "@/lib/staff/config";
import type { ProgressInput } from "@/lib/tasks/types";

export interface RunCursorStaffTaskOptions {
  onProgress: (event: ProgressInput) => Promise<void>;
  staff: typeof staff.$inferSelect;
  task: typeof task.$inferSelect;
}

export interface RunCursorStaffTaskResult {
  deliverableContent: string;
  deliverableId: string;
}

export async function runCursorStaffTask(
  options: RunCursorStaffTaskOptions
): Promise<RunCursorStaffTaskResult> {
  const { task: taskRow, staff: staffRow, onProgress } = options;
  const github = getStaffGithubConfig(staffRow.config);

  if (!github?.repoUrl) {
    throw new Error("Coder staff is missing github.repoUrl in staff.config.");
  }

  const agent = await resolveCursorAgent({ github, staff: staffRow });
  const run = await agent.send(buildCoderPrompt(taskRow, staffRow));

  await streamCursorRunProgress({
    run,
    taskId: taskRow.id,
    onProgress,
  });

  const result = await run.wait();
  const { deliverableId, content, prUrl, previewUrls } =
    await finalizeCoderDeliverable({
      agent,
      brief: taskRow.brief,
      github,
      result,
      taskId: taskRow.id,
    });

  if (prUrl) {
    await onProgress({
      type: "deliverable.saved",
      label: "Pull request ready",
      payload: { prUrl, previewUrls },
    });
  }

  return {
    deliverableId,
    deliverableContent: content,
  };
}

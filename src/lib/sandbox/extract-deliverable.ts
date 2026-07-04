import { resumeSandboxSession } from "@/lib/sandbox/session";
import { WRITER_OUTPUT_PATH } from "@/lib/tasks/constants";
import { getTaskPreviewContent } from "@/lib/tasks/service";

export async function extractDeliverableFromSandbox(
  sessionId: string,
  taskId: string
): Promise<string> {
  "use step";

  const session = await resumeSandboxSession(sessionId);
  const fileContent = await session.readTextFile(WRITER_OUTPUT_PATH);

  if (fileContent && fileContent.trim().length > 0) {
    return fileContent;
  }

  const preview = await getTaskPreviewContent(taskId);

  if (preview.trim().length > 0) {
    return preview;
  }

  throw new Error(
    `Deliverable not found at ${WRITER_OUTPUT_PATH} and no task preview available.`
  );
}

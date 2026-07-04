import type { staff, task } from "@/db/schema";
import { getDocumentsForTask } from "@/lib/sandbox/get-documents-for-task";
import { seedDocuments } from "@/lib/sandbox/seed-documents";
import {
  createSandboxSession,
  resumeSandboxSession,
} from "@/lib/sandbox/session";
import type { StaffSandboxHandle } from "@/lib/sandbox/types";
import { WORKSPACE_ROOT } from "@/lib/tasks/constants";

export async function createStaffSandbox(
  staffRow: typeof staff.$inferSelect,
  taskRow: typeof task.$inferSelect
): Promise<StaffSandboxHandle> {
  "use step";

  const sessionId = crypto.randomUUID();
  const session = await createSandboxSession(sessionId);

  const docs = await getDocumentsForTask({
    staffId: staffRow.id,
    userId: taskRow.userId,
    metadata: taskRow.metadata,
  });

  const manifest = await seedDocuments(session, docs);

  return {
    sessionId,
    manifest,
    defaultWorkingDirectory: WORKSPACE_ROOT,
  };
}

export async function destroyStaffSandbox(sessionId: string): Promise<void> {
  "use step";

  const session = await resumeSandboxSession(sessionId);
  await session.destroy();
}

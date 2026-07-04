import { formatSseEvent } from "@/lib/notifications/service";
import {
  SSE_KEEPALIVE_INTERVAL_MS,
  SSE_POLL_INTERVAL_MS,
} from "@/lib/tasks/constants";
import {
  buildTaskCompletedSsePayload,
  buildTaskFailedSsePayload,
  buildTaskProgressSsePayload,
  getTaskPreviewRecord,
  listTasks,
  listTasksUpdatedSince,
} from "@/lib/tasks/service";
import type { TaskSummary } from "@/lib/tasks/types";
import { getServerViewer } from "@/lib/viewer";

export const dynamic = "force-dynamic";

function shouldEmitProgress(taskRow: TaskSummary): boolean {
  return taskRow.status === "pending" || taskRow.status === "running";
}

export async function GET(req: Request) {
  const viewer = await getServerViewer();

  if (!viewer) {
    return new Response("Unauthorized", { status: 401 });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      let closed = false;
      const lastSentAt = new Map<string, string>();
      const completedSent = new Set<string>();
      let pollSince = new Date();

      const close = () => {
        if (closed) {
          return;
        }

        closed = true;
        clearInterval(pollIntervalId);
        clearInterval(keepAliveId);
        controller.close();
      };

      const enqueueEvent = (
        eventName: string,
        payload: Record<string, unknown>
      ) => {
        controller.enqueue(encoder.encode(formatSseEvent(eventName, payload)));
      };

      const emitTaskUpdate = async (taskRow: TaskSummary) => {
        if (taskRow.status === "completed" && !completedSent.has(taskRow.id)) {
          const preview = await getTaskPreviewRecord(viewer.id, taskRow.id);
          enqueueEvent("task.completed", {
            ...buildTaskCompletedSsePayload(taskRow, preview?.excerpt ?? null),
          });
          completedSent.add(taskRow.id);
          return;
        }

        if (taskRow.status === "failed" && !completedSent.has(taskRow.id)) {
          enqueueEvent("task.failed", {
            ...buildTaskFailedSsePayload(taskRow, "Task failed."),
          });
          completedSent.add(taskRow.id);
          return;
        }

        if (!shouldEmitProgress(taskRow)) {
          return;
        }

        const lastEventAt = taskRow.lastEventAt ?? taskRow.createdAt;
        const previous = lastSentAt.get(taskRow.id);

        if (previous === lastEventAt) {
          return;
        }

        enqueueEvent("task.progress", {
          ...buildTaskProgressSsePayload(taskRow),
        });
        lastSentAt.set(taskRow.id, lastEventAt);
      };

      const poll = async () => {
        if (closed) {
          return;
        }

        const updatedTasks = await listTasksUpdatedSince(viewer.id, pollSince);
        pollSince = new Date();

        for (const taskRow of updatedTasks) {
          await emitTaskUpdate(taskRow);
        }
      };

      const bootstrap = async () => {
        const activeTasks = await listTasks(viewer.id, {
          status: ["pending", "running"],
        });

        for (const taskRow of activeTasks) {
          enqueueEvent("task.progress", {
            ...buildTaskProgressSsePayload(taskRow),
          });
          lastSentAt.set(taskRow.id, taskRow.lastEventAt ?? taskRow.createdAt);
        }
      };

      bootstrap().catch(close);
      poll().catch(close);

      const pollIntervalId = setInterval(() => {
        poll().catch(close);
      }, SSE_POLL_INTERVAL_MS);

      const keepAliveId = setInterval(() => {
        controller.enqueue(encoder.encode(": keepalive\n\n"));
      }, SSE_KEEPALIVE_INTERVAL_MS);

      req.signal.addEventListener("abort", close);
    },
  });

  return new Response(stream, {
    headers: {
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "Content-Type": "text/event-stream",
    },
  });
}

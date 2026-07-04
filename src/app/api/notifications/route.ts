import {
  formatSseEvent,
  listPendingNotifications,
  markNotificationDelivered,
} from "@/lib/notifications/service";
import { getServerViewer } from "@/lib/viewer";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const viewer = await getServerViewer();

  if (!viewer) {
    return new Response("Unauthorized", { status: 401 });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      let closed = false;

      const close = () => {
        if (closed) {
          return;
        }

        closed = true;
        clearInterval(intervalId);
        clearInterval(keepAliveId);
        controller.close();
      };

      const sendPending = async () => {
        if (closed) {
          return;
        }

        const pending = await listPendingNotifications(viewer.id);

        for (const item of pending) {
          controller.enqueue(
            encoder.encode(formatSseEvent(item.type, item.payload))
          );
          await markNotificationDelivered(viewer.id, item.id);
        }
      };

      sendPending().catch(close);

      const intervalId = setInterval(() => {
        sendPending().catch(close);
      }, 5000);

      const keepAliveId = setInterval(() => {
        controller.enqueue(encoder.encode(": keepalive\n\n"));
      }, 15_000);

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

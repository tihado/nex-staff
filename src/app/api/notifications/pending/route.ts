import { listPendingTaskCompletions } from "@/lib/notifications/service";
import { getServerViewer } from "@/lib/viewer";

export const dynamic = "force-dynamic";

export async function GET() {
  const viewer = await getServerViewer();

  if (!viewer) {
    return new Response("Unauthorized", { status: 401 });
  }

  const pending = await listPendingTaskCompletions(viewer.id);

  return Response.json({ pending });
}

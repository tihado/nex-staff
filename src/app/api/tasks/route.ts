import { NextResponse } from "next/server";
import { listTasks } from "@/lib/tasks/service";
import { listTasksQuerySchema } from "@/lib/tasks/validation";
import { getServerViewer } from "@/lib/viewer";

export async function GET(req: Request) {
  const viewer = await getServerViewer();

  if (!viewer) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const parsed = listTasksQuerySchema.safeParse({
    limit: searchParams.get("limit") ?? undefined,
    staffId: searchParams.get("staffId") ?? undefined,
    status: searchParams.get("status") ?? undefined,
  });

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid query parameters.", code: "validation_error" },
      { status: 400 }
    );
  }

  const tasks = await listTasks(viewer.id, parsed.data);

  return NextResponse.json({ tasks });
}

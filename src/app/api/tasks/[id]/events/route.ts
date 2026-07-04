import { NextResponse } from "next/server";
import { TaskNotFoundError } from "@/lib/tasks/errors";
import { listTaskEvents } from "@/lib/tasks/service";
import { listTaskEventsQuerySchema } from "@/lib/tasks/validation";
import { getServerViewer } from "@/lib/viewer";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(req: Request, context: RouteContext) {
  const viewer = await getServerViewer();

  if (!viewer) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { id } = await context.params;
  const { searchParams } = new URL(req.url);
  const parsed = listTaskEventsQuerySchema.safeParse({
    cursor: searchParams.get("cursor") ?? undefined,
    limit: searchParams.get("limit") ?? undefined,
  });

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid query parameters.", code: "validation_error" },
      { status: 400 }
    );
  }

  try {
    const result = await listTaskEvents(viewer.id, id, parsed.data);

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof TaskNotFoundError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: "Failed to load task events.", code: "internal_error" },
      { status: 500 }
    );
  }
}

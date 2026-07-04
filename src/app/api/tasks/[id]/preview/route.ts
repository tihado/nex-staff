import { NextResponse } from "next/server";
import { TaskNotFoundError } from "@/lib/tasks/errors";
import { getTaskPreviewRecord } from "@/lib/tasks/service";
import { getServerViewer } from "@/lib/viewer";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_req: Request, context: RouteContext) {
  const viewer = await getServerViewer();

  if (!viewer) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { id } = await context.params;

  try {
    const preview = await getTaskPreviewRecord(viewer.id, id);

    if (!preview) {
      return NextResponse.json(
        { error: "Task preview not found.", code: "not_found" },
        { status: 404 }
      );
    }

    return NextResponse.json(preview);
  } catch (error) {
    if (error instanceof TaskNotFoundError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: "Failed to load task preview.", code: "internal_error" },
      { status: 500 }
    );
  }
}

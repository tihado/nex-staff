import { NextResponse } from "next/server";
import { TaskCancelError, TaskNotFoundError } from "@/lib/tasks/errors";
import { cancelTaskForUser } from "@/lib/tasks/service";
import { getServerViewer } from "@/lib/viewer";

interface RouteContext {
  params: Promise<{ id: string }>;
}

interface CancelTaskBody {
  reason?: string;
}

export async function POST(req: Request, context: RouteContext) {
  const viewer = await getServerViewer();

  if (!viewer) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { id } = await context.params;

  let body: CancelTaskBody = {};

  try {
    const text = await req.text();

    if (text.trim()) {
      body = JSON.parse(text) as CancelTaskBody;
    }
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body.", code: "validation_error" },
      { status: 400 }
    );
  }

  try {
    const result = await cancelTaskForUser(viewer.id, id, body.reason);

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof TaskNotFoundError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: 404 }
      );
    }

    if (error instanceof TaskCancelError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: "Failed to cancel task.", code: "internal_error" },
      { status: 500 }
    );
  }
}

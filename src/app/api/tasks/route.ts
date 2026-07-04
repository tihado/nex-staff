import { NextResponse } from "next/server";
import { TaskDispatchError, TaskValidationError } from "@/lib/tasks/errors";
import { delegateTask, listTasks } from "@/lib/tasks/service";
import {
  delegateTaskBodySchema,
  listTasksQuerySchema,
} from "@/lib/tasks/validation";
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

export async function POST(req: Request) {
  const viewer = await getServerViewer();

  if (!viewer) {
    return new Response("Unauthorized", { status: 401 });
  }

  let body: unknown;

  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body.", code: "validation_error" },
      { status: 400 }
    );
  }

  const parsed = delegateTaskBodySchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid delegate request.", code: "validation_error" },
      { status: 400 }
    );
  }

  try {
    const created = await delegateTask(viewer.id, parsed.data);

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    if (error instanceof TaskValidationError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: 400 }
      );
    }

    if (error instanceof TaskDispatchError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: 502 }
      );
    }

    return NextResponse.json(
      { error: "Failed to delegate task.", code: "internal_error" },
      { status: 500 }
    );
  }
}

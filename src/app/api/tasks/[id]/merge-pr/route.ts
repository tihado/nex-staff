import { NextResponse } from "next/server";
import { TaskMergeError, TaskNotFoundError } from "@/lib/tasks/errors";
import { mergeCoderPullRequestForUser } from "@/lib/tasks/service";
import { getServerViewer } from "@/lib/viewer";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(_req: Request, context: RouteContext) {
  const viewer = await getServerViewer();

  if (!viewer) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { id } = await context.params;

  try {
    const result = await mergeCoderPullRequestForUser(viewer.id, id);

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof TaskNotFoundError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: 404 }
      );
    }

    if (error instanceof TaskMergeError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: 409 }
      );
    }

    const message =
      error instanceof Error ? error.message : "Failed to merge pull request.";

    return NextResponse.json(
      { error: message, code: "internal_error" },
      { status: 500 }
    );
  }
}

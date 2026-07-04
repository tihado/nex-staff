import { NextResponse } from "next/server";
import { ChatAccessError, getChatDetailForUser } from "@/lib/chat/persistence";
import { parseUuid } from "@/lib/chat/validation";
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

  if (!parseUuid(id)) {
    return NextResponse.json({ error: "Invalid chat id" }, { status: 400 });
  }

  try {
    const chatDetail = await getChatDetailForUser(id, viewer.id);

    return NextResponse.json(chatDetail);
  } catch (error) {
    if (error instanceof ChatAccessError) {
      return NextResponse.json({ error: "Chat not found" }, { status: 404 });
    }

    throw error;
  }
}

import { NextResponse } from "next/server";
import { ChatAccessError, listChatsForUser } from "@/lib/chat/persistence";
import { parseUuid } from "@/lib/chat/validation";
import { getServerViewer } from "@/lib/viewer";

export async function GET(req: Request) {
  const viewer = await getServerViewer();

  if (!viewer) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const cursor = searchParams.get("cursor") ?? undefined;
  const limitParam = searchParams.get("limit");
  const limit = limitParam ? Number.parseInt(limitParam, 10) : undefined;

  if (cursor && !parseUuid(cursor)) {
    return NextResponse.json({ error: "Invalid cursor" }, { status: 400 });
  }

  if (limit !== undefined && (Number.isNaN(limit) || limit < 1)) {
    return NextResponse.json({ error: "Invalid limit" }, { status: 400 });
  }

  try {
    const result = await listChatsForUser(viewer.id, { cursor, limit });

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof ChatAccessError) {
      return NextResponse.json({ error: "Chat not found" }, { status: 404 });
    }

    throw error;
  }
}

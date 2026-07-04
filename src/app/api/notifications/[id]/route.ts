import { NextResponse } from "next/server";
import { z } from "zod";
import { markNotificationDelivered } from "@/lib/notifications/service";
import { getServerViewer } from "@/lib/viewer";

export const dynamic = "force-dynamic";

const patchBodySchema = z.object({
  status: z.literal("delivered"),
});

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PATCH(req: Request, context: RouteContext) {
  const viewer = await getServerViewer();

  if (!viewer) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { id } = await context.params;

  let body: unknown;

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = patchBodySchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Expected { status: 'delivered' }" },
      { status: 400 }
    );
  }

  const updated = await markNotificationDelivered(viewer.id, id);

  if (!updated) {
    return NextResponse.json(
      { error: "Notification not found." },
      { status: 404 }
    );
  }

  return Response.json({ ok: true });
}

import { NextResponse } from "next/server";
import { deleteDocument, getDocumentById } from "@/lib/documents/service";
import { getServerViewer } from "@/lib/viewer";

interface DocumentRouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_req: Request, context: DocumentRouteContext) {
  const viewer = await getServerViewer();

  if (!viewer) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { id } = await context.params;
  const document = await getDocumentById(viewer.id, id);

  if (!document) {
    return NextResponse.json(
      { error: "Document not found.", code: "not_found" },
      { status: 404 }
    );
  }

  return NextResponse.json(document);
}

export async function DELETE(_req: Request, context: DocumentRouteContext) {
  const viewer = await getServerViewer();

  if (!viewer) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { id } = await context.params;
  const deleted = await deleteDocument(viewer.id, id);

  if (!deleted) {
    return NextResponse.json(
      { error: "Document not found.", code: "not_found" },
      { status: 404 }
    );
  }

  return new Response(null, { status: 204 });
}

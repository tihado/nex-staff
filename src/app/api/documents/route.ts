import { NextResponse } from "next/server";
import { listDocuments, uploadDocument } from "@/lib/documents/service";
import { validateUploadFile } from "@/lib/documents/validation";
import { getServerViewer } from "@/lib/viewer";

export async function GET(req: Request) {
  const viewer = await getServerViewer();

  if (!viewer) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const staffId = searchParams.get("staffId") ?? undefined;

  const documents = await listDocuments(viewer.id, { staffId });

  return NextResponse.json({ documents });
}

export async function POST(req: Request) {
  const viewer = await getServerViewer();

  if (!viewer) {
    return new Response("Unauthorized", { status: 401 });
  }

  const formData = await req.formData();
  const fileEntry = formData.get("file");
  const file = fileEntry instanceof File ? fileEntry : null;
  const validation = validateUploadFile(file);

  if ("status" in validation) {
    return NextResponse.json(
      { error: validation.message, code: validation.code },
      { status: validation.status }
    );
  }

  try {
    const uploaded = await uploadDocument(
      viewer.id,
      validation.file,
      validation.mimeType
    );

    return NextResponse.json(uploaded, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Failed to upload document.", code: "upload_failed" },
      { status: 500 }
    );
  }
}

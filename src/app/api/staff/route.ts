import { NextResponse } from "next/server";
import { StaffLimitError, StaffValidationError } from "@/lib/staff/errors";
import { hireStaff, listStaff } from "@/lib/staff/service";
import {
  hireStaffBodySchema,
  listStaffQuerySchema,
} from "@/lib/staff/validation";
import { getServerViewer } from "@/lib/viewer";

export async function GET(req: Request) {
  const viewer = await getServerViewer();

  if (!viewer) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const parsed = listStaffQuerySchema.safeParse({
    status: searchParams.get("status") ?? undefined,
  });

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid status filter.", code: "validation_error" },
      { status: 400 }
    );
  }

  const staffMembers = await listStaff(viewer.id, parsed.data);

  return NextResponse.json({ staff: staffMembers });
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

  const parsed = hireStaffBodySchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid hire request.", code: "validation_error" },
      { status: 400 }
    );
  }

  try {
    const created = await hireStaff(viewer.id, parsed.data);

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    if (error instanceof StaffLimitError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: 400 }
      );
    }

    if (error instanceof StaffValidationError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to hire staff.", code: "internal_error" },
      { status: 500 }
    );
  }
}

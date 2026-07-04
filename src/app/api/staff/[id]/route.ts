import { NextResponse } from "next/server";
import { StaffValidationError } from "@/lib/staff/errors";
import { deleteStaff, getStaffById, updateStaff } from "@/lib/staff/service";
import { updateStaffBodySchema } from "@/lib/staff/validation";
import { getServerViewer } from "@/lib/viewer";

interface StaffRouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_req: Request, context: StaffRouteContext) {
  const viewer = await getServerViewer();

  if (!viewer) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { id } = await context.params;
  const staffMember = await getStaffById(viewer.id, id);

  if (!staffMember) {
    return NextResponse.json(
      { error: "Staff member not found.", code: "not_found" },
      { status: 404 }
    );
  }

  return NextResponse.json(staffMember);
}

export async function PATCH(req: Request, context: StaffRouteContext) {
  const viewer = await getServerViewer();

  if (!viewer) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { id } = await context.params;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body.", code: "validation_error" },
      { status: 400 }
    );
  }

  const parsed = updateStaffBodySchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid update request.", code: "validation_error" },
      { status: 400 }
    );
  }

  try {
    const updated = await updateStaff(viewer.id, id, parsed.data);

    if (!updated) {
      return NextResponse.json(
        { error: "Staff member not found.", code: "not_found" },
        { status: 404 }
      );
    }

    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof StaffValidationError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to update staff.", code: "internal_error" },
      { status: 500 }
    );
  }
}

export async function DELETE(_req: Request, context: StaffRouteContext) {
  const viewer = await getServerViewer();

  if (!viewer) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { id } = await context.params;
  const deleted = await deleteStaff(viewer.id, id);

  if (!deleted) {
    return NextResponse.json(
      { error: "Staff member not found.", code: "not_found" },
      { status: 404 }
    );
  }

  return new Response(null, { status: 204 });
}

import { sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/db";

export async function GET() {
  try {
    const db = getDb();
    await db.execute(sql`select 1`);

    return NextResponse.json({
      ok: true,
      db: true,
    });
  } catch {
    return NextResponse.json(
      {
        ok: false,
        db: false,
      },
      { status: 503 }
    );
  }
}

import { createVercelSandbox } from "@ai-sdk/sandbox-vercel";
import { NextResponse } from "next/server";
import { getServerViewer } from "@/lib/viewer";

export async function GET() {
  const viewer = await getServerViewer();
  if (!viewer) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const provider = createVercelSandbox({ runtime: "node24" });
    await provider.createSession();

    return NextResponse.json({
      ok: true,
      provider: provider.providerId,
      oidc: true,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Sandbox OIDC check failed";

    return NextResponse.json(
      {
        ok: false,
        oidc: false,
        error: message,
      },
      { status: 503 }
    );
  }
}

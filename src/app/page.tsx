import { eq } from "drizzle-orm";
import { WorkplaceHome } from "@/components/workplace/workplace-home";
import { db } from "@/db";
import { assistant } from "@/db/schema";
import {
  DEFAULT_ASSISTANT_CONFIG,
  DEFAULT_ASSISTANT_NAME,
} from "@/lib/assistant-defaults";
import { getServerViewer } from "@/lib/viewer";

export default async function HomePage() {
  const viewer = await getServerViewer();

  const assistantRow = viewer
    ? await db.query.assistant.findFirst({
        where: eq(assistant.userId, viewer.id),
        columns: { name: true, config: true },
      })
    : null;

  const assistantName = assistantRow?.name ?? DEFAULT_ASSISTANT_NAME;
  const greeting =
    assistantRow?.config?.greeting ?? DEFAULT_ASSISTANT_CONFIG.greeting;
  const viewerLabel = viewer?.name ?? viewer?.email ?? "Guest";

  return (
    <WorkplaceHome
      assistantName={assistantName}
      greeting={greeting}
      viewerLabel={viewerLabel}
    />
  );
}

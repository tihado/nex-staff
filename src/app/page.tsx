import { eq } from "drizzle-orm";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { AssistantChat } from "@/components/chat/assistant-chat";
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

  return (
    <div className="flex min-h-full flex-1 flex-col bg-zinc-50 dark:bg-black">
      <header className="border-border border-b bg-background/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div className="min-w-0">
            <p className="font-medium text-muted-foreground text-xs uppercase tracking-[0.2em]">
              Nex Staff
            </p>
            <h1 className="truncate font-semibold text-foreground text-lg">
              {assistantName}
            </h1>
            <p className="truncate text-muted-foreground text-sm">
              Signed in as {viewer?.name ?? viewer?.email}
            </p>
          </div>
          <SignOutButton />
        </div>
      </header>

      <main className="flex min-h-0 flex-1 flex-col">
        <AssistantChat assistantName={assistantName} greeting={greeting} />
      </main>
    </div>
  );
}

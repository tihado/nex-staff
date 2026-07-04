/**
 * Local smoke test: sign in, hire a Writer if needed, delegate a task,
 * then poll task status until terminal or timeout.
 *
 * Usage:
 *   SANDBOX_DISABLED=true pnpm exec tsx scripts/test-delegate-workflow.ts
 */

const baseUrl = process.env.NEX_STAFF_URL ?? "http://localhost:3000";
const email = process.env.NEX_STAFF_EMAIL ?? "ceo@nexstaff.com";
const password = process.env.NEX_STAFF_PASSWORD ?? "password123";

const DELEGATE_PATTERN = /delegate_task|"toolName":"delegate_task"/;
const TASK_ID_PATTERN = /"taskId"\s*:\s*"([0-9a-f-]{36})"/i;
const STAFF_ID_PATTERN = /"id"\s*:\s*"[0-9a-f-]{36}"/i;
const STATUS_PATTERN = /"status"\s*:\s*"([a-z]+)"/i;
const PROGRESS_PATTERN = /"progressPercent"\s*:\s*(\d+)/i;
const TERMINAL_STATUSES = new Set(["completed", "failed", "cancelled"]);

async function signIn(): Promise<string> {
  const response = await fetch(`${baseUrl}/api/auth/sign-in/email`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Origin: baseUrl,
    },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    throw new Error(
      `Sign-in failed: ${response.status} ${await response.text()}`
    );
  }

  const setCookie = response.headers.getSetCookie?.() ?? [];

  if (setCookie.length === 0) {
    throw new Error("Sign-in succeeded but no session cookies were returned");
  }

  return setCookie.map((cookie) => cookie.split(";")[0]).join("; ");
}

async function callChat(cookie: string, text: string): Promise<string> {
  const chatId = crypto.randomUUID();
  const messageId = crypto.randomUUID();

  const response = await fetch(`${baseUrl}/api/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: cookie,
      Origin: baseUrl,
    },
    body: JSON.stringify({
      id: chatId,
      messages: [
        {
          id: messageId,
          role: "user",
          parts: [{ type: "text", text }],
        },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`Chat failed: ${response.status} ${await response.text()}`);
  }

  if (!response.body) {
    throw new Error("Chat response had no body");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let output = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }
    output += decoder.decode(value, { stream: true });
  }

  return output;
}

function extractTaskId(output: string): string | null {
  const match = TASK_ID_PATTERN.exec(output);
  return match?.[1] ?? null;
}

async function sleep(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function main(): Promise<void> {
  console.log(`Base URL: ${baseUrl}`);
  console.log("Signing in...");
  const cookie = await signIn();

  console.log("Listing staff...");
  let rosterOutput = await callChat(
    cookie,
    "Use list_staff now and return only the JSON result."
  );

  const hasStaff = STAFF_ID_PATTERN.test(rosterOutput);

  if (!hasStaff) {
    console.log("No staff found — hiring Writer...");
    rosterOutput = await callChat(
      cookie,
      "Use hire_staff to hire Alex as a Content Writer with template writer, tone casual, audience startup founders. Then reply with the staffId."
    );
    console.log(rosterOutput.slice(0, 500));
  }

  console.log("Delegating task...");
  const delegateOutput = await callChat(
    cookie,
    'Use delegate_task to assign this brief to your Content Writer staff member: "Write a short Markdown blog intro about async AI agents for solo founders." Return the taskId.'
  );

  if (!DELEGATE_PATTERN.test(delegateOutput)) {
    console.warn("Warning: delegate_task may not have been invoked.");
  }

  const taskId = extractTaskId(delegateOutput);

  if (!taskId) {
    console.error("Could not extract taskId from chat output.");
    console.error(delegateOutput.slice(0, 2000));
    process.exit(1);
  }

  console.log(`Task delegated: ${taskId}`);
  console.log("Polling check_task_status...");

  const deadline = Date.now() + 5 * 60_000;

  while (Date.now() < deadline) {
    const statusOutput = await callChat(
      cookie,
      `Use check_task_status for taskId ${taskId} and return status and progressPercent.`
    );

    const statusMatch = STATUS_PATTERN.exec(statusOutput);
    const progressMatch = PROGRESS_PATTERN.exec(statusOutput);
    const status = statusMatch?.[1] ?? "unknown";
    const progress = progressMatch?.[1] ?? "?";

    console.log(`  status=${status} progress=${progress}%`);

    if (TERMINAL_STATUSES.has(status)) {
      console.log("Task reached terminal status.");
      console.log(statusOutput.slice(0, 1500));
      return;
    }

    await sleep(5000);
  }

  console.error("Timed out waiting for task completion.");
  process.exit(1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

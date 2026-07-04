/**
 * Local smoke test: sign in and call POST /api/chat with a prompt that
 * should invoke a pending tool stub (list_staff).
 *
 * Usage: pnpm exec tsx scripts/test-tool-stubs-api.ts
 */

const baseUrl = process.env.NEX_STAFF_URL ?? "http://localhost:3000";
const email = process.env.NEX_STAFF_EMAIL ?? "ceo@nexstaff.com";
const password = process.env.NEX_STAFF_PASSWORD ?? "password123";

const LIST_STAFF_PATTERN = /list_staff|"toolName":"list_staff"/;
const PENDING_PATTERN = /"pending"\s*:\s*true/;
const TOOL_ACTIVITY_PATTERN = /tool-input|tool-output|tool-call/;

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

async function callChat(cookie: string): Promise<string> {
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
          parts: [
            {
              type: "text",
              text: "Use the list_staff tool now to show my team roster.",
            },
          ],
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

function summarizeStream(stream: string): void {
  const hasListStaff = LIST_STAFF_PATTERN.test(stream);
  const hasPending = PENDING_PATTERN.test(stream);
  const hasToolCall = TOOL_ACTIVITY_PATTERN.test(stream);

  console.log("--- Results ---");
  console.log(`Tool activity in stream: ${hasToolCall ? "yes" : "no"}`);
  console.log(`list_staff referenced: ${hasListStaff ? "yes" : "no"}`);
  console.log(`pending: true in stream: ${hasPending ? "yes" : "no"}`);
  console.log(`Stream length: ${stream.length} chars`);

  if (hasPending) {
    console.log("\nPASS: Tool stub returned pending result.");
  } else if (hasListStaff || hasToolCall) {
    console.log(
      "\nPARTIAL: Tool was invoked but pending:true not found in stream."
    );
  } else {
    console.log(
      "\nNOTE: Model may not have called a tool. Try a more explicit prompt."
    );
  }

  const preview = stream.slice(0, 800);
  console.log("\n--- Stream preview ---");
  console.log(preview);
  if (stream.length > preview.length) {
    console.log("...");
  }
}

async function main(): Promise<void> {
  console.log(`Testing against ${baseUrl}`);
  const cookie = await signIn();
  console.log("Signed in.");
  const stream = await callChat(cookie);
  summarizeStream(stream);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});

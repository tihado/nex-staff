/**
 * Quick API smoke test for POST/GET /api/tasks (delegateTask service path).
 *
 * Usage:
 *   SANDBOX_DISABLED=true pnpm exec tsx scripts/test-delegate-api.ts
 */

const baseUrl = process.env.NEX_STAFF_URL ?? "http://localhost:3000";
const email = process.env.NEX_STAFF_EMAIL ?? "ceo@nexstaff.com";
const password = process.env.NEX_STAFF_PASSWORD ?? "password123";

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

async function main(): Promise<void> {
  console.log(`Base URL: ${baseUrl}`);
  const cookie = await signIn();
  const headers = {
    "Content-Type": "application/json",
    Cookie: cookie,
    Origin: baseUrl,
  };

  const staffRes = await fetch(`${baseUrl}/api/staff`, { headers });

  if (!staffRes.ok) {
    throw new Error(`GET /api/staff failed: ${staffRes.status}`);
  }

  const staffPayload = (await staffRes.json()) as {
    staff: Array<{ id: string; name: string; status: string }>;
  };

  const staffMember = staffPayload.staff[0];

  if (!staffMember) {
    throw new Error(
      "No staff on roster — hire one first or run test-delegate-workflow.ts"
    );
  }

  console.log(`Using staff: ${staffMember.name} (${staffMember.id})`);

  const delegateRes = await fetch(`${baseUrl}/api/tasks`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      staffId: staffMember.id,
      brief: "API smoke test: one paragraph about async AI agents.",
      acceptanceCriteria: "At least 3 sentences in Markdown.",
      checkpoints: [
        { label: "Draft", criteria: "Has intro paragraph", order: 0 },
      ],
    }),
  });

  const delegateBody = await delegateRes.json();

  if (!delegateRes.ok) {
    throw new Error(
      `POST /api/tasks failed: ${delegateRes.status} ${JSON.stringify(delegateBody)}`
    );
  }

  console.log("POST /api/tasks:", delegateBody);

  if (!(delegateBody.taskId && delegateBody.workflowRunId)) {
    throw new Error("Missing taskId or workflowRunId in delegate response");
  }

  if (delegateBody.status !== "running") {
    throw new Error(`Expected status running, got ${delegateBody.status}`);
  }

  const listRes = await fetch(`${baseUrl}/api/tasks`, { headers });

  if (!listRes.ok) {
    throw new Error(`GET /api/tasks failed: ${listRes.status}`);
  }

  const listBody = (await listRes.json()) as {
    tasks: Array<{
      id: string;
      currentStep: string | null;
      progressPercent: number;
      workflowRunId: string | null;
      status: string;
    }>;
  };

  const task = listBody.tasks.find((row) => row.id === delegateBody.taskId);

  if (!task) {
    throw new Error("Delegated task not found in GET /api/tasks");
  }

  console.log("GET /api/tasks row:", {
    id: task.id,
    status: task.status,
    currentStep: task.currentStep,
    progressPercent: task.progressPercent,
    workflowRunId: task.workflowRunId,
  });

  if (task.workflowRunId !== delegateBody.workflowRunId) {
    throw new Error("workflowRunId mismatch between POST and GET");
  }

  if (task.currentStep !== "Starting...") {
    console.warn(
      `Note: currentStep is "${task.currentStep}" (may advance if workflow already started)`
    );
  }

  const badStaffRes = await fetch(`${baseUrl}/api/tasks`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      staffId: crypto.randomUUID(),
      brief: "Should fail",
    }),
  });

  const badStaffBody = await badStaffRes.json();

  if (badStaffRes.status !== 400) {
    throw new Error(
      `Expected 400 for bad staffId, got ${badStaffRes.status}: ${JSON.stringify(badStaffBody)}`
    );
  }

  console.log("Bad staffId rejected:", badStaffBody.code);
  console.log("API smoke test passed.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

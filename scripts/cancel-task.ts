/**
 * Cancel a delegated task by ID or by searching brief / staff name.
 *
 * Usage:
 *   pnpm cancel-task --id <task-uuid>
 *   pnpm cancel-task "blog post"
 *   pnpm cancel-task --staff "Writer"
 *   pnpm cancel-task --list
 *   pnpm cancel-task --query "research" --yes
 *
 * Cloud VM (local Neon proxy):
 *   NODE_EXTRA_CA_CERTS=/opt/neon-proxy/cert.pem pnpm cancel-task --list
 */

import { stdin as input, stdout as output } from "node:process";
import { createInterface } from "node:readline/promises";
import { config } from "dotenv";
import { and, desc, eq, ilike, inArray, type SQL } from "drizzle-orm";
import { getDb } from "../src/db";
import { staff, task, user } from "../src/db/schema";
import { TaskCancelError } from "../src/lib/tasks/errors";
import { cancelTaskForUser } from "../src/lib/tasks/service";

config({ path: ".env.local" });
config({ path: ".env" });

const ACTIVE_STATUSES = ["pending", "running"] as const;
const SEARCH_LIMIT = 20;

interface CliArgs {
  allStatuses: boolean;
  allUsers: boolean;
  email: string;
  id: string;
  list: boolean;
  query: string;
  reason: string;
  staff: string;
  yes: boolean;
}

interface TaskMatch {
  brief: string;
  createdAt: Date;
  id: string;
  staffName: string;
  status: string;
  userEmail: string;
  userId: string;
}

function printUsage(): void {
  console.log(`Cancel a pending or running task.

Usage:
  pnpm cancel-task --id <task-uuid>
  pnpm cancel-task <brief-search>
  pnpm cancel-task --query <brief-search> [options]
  pnpm cancel-task --staff <staff-name> [options]
  pnpm cancel-task --list

Options:
  --email <email>     Owner account email (default: NEX_STAFF_EMAIL or ceo@nexstaff.com)
  --all-users         Search across all users (admin)
  --all-statuses      Include completed, failed, and cancelled tasks in search
  --reason <text>     Cancellation reason (default: "Cancelled via script.")
  --yes, -y           Skip confirmation prompt
  -h, --help          Show this help
`);
}

function consumeOptionValue(
  argv: string[],
  index: number,
  flag: string
): [string, number] {
  const value = argv[index + 1];
  if (!value) {
    throw new Error(`${flag} requires a value.`);
  }

  return [value, index + 1];
}

function applyFlag(
  parsed: CliArgs,
  arg: string,
  argv: string[],
  index: number
): number {
  if (arg === "--all-statuses") {
    parsed.allStatuses = true;
    return index;
  }

  if (arg === "--all-users") {
    parsed.allUsers = true;
    return index;
  }

  if (arg === "--list") {
    parsed.list = true;
    return index;
  }

  if (arg === "--yes" || arg === "-y") {
    parsed.yes = true;
    return index;
  }

  if (arg === "--email") {
    const [value, nextIndex] = consumeOptionValue(argv, index, "--email");
    parsed.email = value;
    return nextIndex;
  }

  if (arg === "--id") {
    const [value, nextIndex] = consumeOptionValue(argv, index, "--id");
    parsed.id = value;
    return nextIndex;
  }

  if (arg === "--query") {
    const [value, nextIndex] = consumeOptionValue(argv, index, "--query");
    parsed.query = value;
    return nextIndex;
  }

  if (arg === "--staff") {
    const [value, nextIndex] = consumeOptionValue(argv, index, "--staff");
    parsed.staff = value;
    return nextIndex;
  }

  if (arg === "--reason") {
    const [value, nextIndex] = consumeOptionValue(argv, index, "--reason");
    parsed.reason = value;
    return nextIndex;
  }

  if (arg.startsWith("-")) {
    throw new Error(`Unknown option: ${arg}`);
  }

  return index;
}

function parseArgs(argv: string[]): CliArgs | null {
  const parsed: CliArgs = {
    allStatuses: false,
    allUsers: false,
    email: process.env.NEX_STAFF_EMAIL ?? "ceo@nexstaff.com",
    id: "",
    list: false,
    query: "",
    reason: "Cancelled via script.",
    staff: "",
    yes: false,
  };

  const positional: string[] = [];

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === "--help" || arg === "-h") {
      return null;
    }

    if (arg.startsWith("-")) {
      index = applyFlag(parsed, arg, argv, index);
      continue;
    }

    positional.push(arg);
  }

  if (parsed.query.length === 0 && positional.length > 0) {
    parsed.query = positional.join(" ");
  }

  return parsed;
}

async function resolveUserId(email: string): Promise<string> {
  const db = getDb();
  const owner = await db.query.user.findFirst({
    where: eq(user.email, email),
    columns: { id: true },
  });

  if (!owner) {
    throw new Error(`No user found with email ${email}.`);
  }

  return owner.id;
}

function truncateBrief(text: string, max = 72): string {
  const oneLine = text.replace(/\s+/g, " ").trim();
  return oneLine.length <= max ? oneLine : `${oneLine.slice(0, max - 1)}…`;
}

function searchTasks(options: {
  allStatuses: boolean;
  allUsers: boolean;
  id?: string;
  query?: string;
  staff?: string;
  userId?: string;
}) {
  const db = getDb();
  const conditions: SQL[] = [];

  if (options.id) {
    conditions.push(eq(task.id, options.id));
  }

  if (!options.allUsers && options.userId) {
    conditions.push(eq(task.userId, options.userId));
  }

  if (!options.allStatuses) {
    conditions.push(inArray(task.status, [...ACTIVE_STATUSES]));
  }

  if (options.query) {
    conditions.push(ilike(task.brief, `%${options.query}%`));
  }

  if (options.staff) {
    conditions.push(ilike(staff.name, `%${options.staff}%`));
  }

  return db
    .select({
      brief: task.brief,
      createdAt: task.createdAt,
      id: task.id,
      staffName: staff.name,
      status: task.status,
      userEmail: user.email,
      userId: task.userId,
    })
    .from(task)
    .innerJoin(staff, eq(task.staffId, staff.id))
    .innerJoin(user, eq(task.userId, user.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(task.createdAt))
    .limit(SEARCH_LIMIT);
}

function formatTaskMatch(index: number, row: TaskMatch): string {
  const created = row.createdAt.toISOString().slice(0, 16).replace("T", " ");
  return `${index + 1}. [${row.status}] ${row.staffName} — ${truncateBrief(row.brief)} — ${created} — ${row.userEmail} — ${row.id}`;
}

async function pickMatch(matches: TaskMatch[]): Promise<TaskMatch> {
  if (matches.length === 1) {
    return matches[0];
  }

  console.log("Multiple matches:");
  for (const [index, row] of matches.entries()) {
    console.log(formatTaskMatch(index, row));
  }

  const rl = createInterface({ input, output });

  try {
    while (true) {
      const answer = await rl.question(
        `Enter number to cancel (1-${matches.length}), or press Enter to abort: `
      );
      const trimmed = answer.trim();

      if (trimmed.length === 0) {
        throw new Error("Cancelled.");
      }

      const choice = Number.parseInt(trimmed, 10);
      if (Number.isInteger(choice) && choice >= 1 && choice <= matches.length) {
        return matches[choice - 1];
      }

      console.log("Invalid choice. Try again.");
    }
  } finally {
    rl.close();
  }
}

async function confirmCancel(label: string, skip: boolean): Promise<void> {
  if (skip) {
    return;
  }

  const rl = createInterface({ input, output });

  try {
    const answer = await rl.question(`Cancel ${label}? [y/N] `);
    const normalized = answer.trim().toLowerCase();

    if (normalized !== "y" && normalized !== "yes") {
      throw new Error("Cancelled.");
    }
  } finally {
    rl.close();
  }
}

async function main(): Promise<void> {
  const parsed = parseArgs(process.argv.slice(2));

  if (!parsed) {
    printUsage();
    return;
  }

  const hasSearch =
    parsed.list ||
    parsed.id.length > 0 ||
    parsed.query.length > 0 ||
    parsed.staff.length > 0;

  if (!hasSearch) {
    printUsage();
    throw new Error("Provide --id, --list, a brief search, or --staff.");
  }

  const userId = parsed.allUsers
    ? undefined
    : await resolveUserId(parsed.email);

  if (parsed.allUsers) {
    console.log("Searching tasks across all users...");
  } else {
    console.log(`Searching tasks for ${parsed.email}...`);
  }

  const matches = await searchTasks({
    allStatuses: parsed.allStatuses,
    allUsers: parsed.allUsers,
    id: parsed.id.length > 0 ? parsed.id : undefined,
    query: parsed.query.length > 0 ? parsed.query : undefined,
    staff: parsed.staff.length > 0 ? parsed.staff : undefined,
    userId,
  });

  if (matches.length === 0) {
    console.log("No matching tasks found.");
    return;
  }

  const selected = await pickMatch(matches);
  const label = `task ${selected.id} [${selected.status}] — ${truncateBrief(selected.brief, 48)}`;

  await confirmCancel(label, parsed.yes);

  try {
    const result = await cancelTaskForUser(
      selected.userId,
      selected.id,
      parsed.reason
    );
    console.log(result.message);
  } catch (error) {
    if (error instanceof TaskCancelError) {
      throw new Error(error.message);
    }

    throw error;
  }
}

main().catch((error: unknown) => {
  if (error instanceof Error && error.message === "Cancelled.") {
    console.log("Cancelled.");
    process.exit(0);
  }

  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});

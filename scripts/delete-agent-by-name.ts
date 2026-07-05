/**
 * Delete a staff agent by searching their name.
 *
 * Usage:
 *   pnpm delete-agent "Writer"
 *   pnpm delete-agent --name "Alex" --email ceo@nexstaff.com
 *   pnpm delete-agent --name "Writer" --yes
 *   pnpm delete-agent --all-users --name "Test" --exact
 *
 * Cloud VM (local Neon proxy):
 *   NODE_EXTRA_CA_CERTS=/opt/neon-proxy/cert.pem pnpm delete-agent "Writer"
 */

import { stdin as input, stdout as output } from "node:process";
import { createInterface } from "node:readline/promises";
import { config } from "dotenv";
import { and, eq, ilike } from "drizzle-orm";
import { getDb } from "../src/db";
import { staff, user } from "../src/db/schema";
import { deleteStaff } from "../src/lib/staff/service";

config({ path: ".env.local" });
config({ path: ".env" });

interface CliArgs {
  allUsers: boolean;
  email: string;
  exact: boolean;
  name: string;
  yes: boolean;
}

function printUsage(): void {
  console.log(`Delete a staff agent by name.

Usage:
  pnpm delete-agent <name>
  pnpm delete-agent --name <name> [options]

Options:
  --email <email>   Owner account email (default: NEX_STAFF_EMAIL or ceo@nexstaff.com)
  --all-users       Search across all users (admin)
  --exact           Match name exactly instead of partial search
  --yes, -y         Skip confirmation prompt
  -h, --help        Show this help
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

function parseArgs(argv: string[]): CliArgs | null {
  const parsed: CliArgs = {
    allUsers: false,
    email: process.env.NEX_STAFF_EMAIL ?? "ceo@nexstaff.com",
    exact: false,
    name: "",
    yes: false,
  };

  const positional: string[] = [];

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === "--help" || arg === "-h") {
      return null;
    }

    if (arg === "--all-users") {
      parsed.allUsers = true;
      continue;
    }

    if (arg === "--exact") {
      parsed.exact = true;
      continue;
    }

    if (arg === "--yes" || arg === "-y") {
      parsed.yes = true;
      continue;
    }

    if (arg === "--email") {
      const [value, nextIndex] = consumeOptionValue(argv, index, "--email");
      parsed.email = value;
      index = nextIndex;
      continue;
    }

    if (arg === "--name") {
      const [value, nextIndex] = consumeOptionValue(argv, index, "--name");
      parsed.name = value;
      index = nextIndex;
      continue;
    }

    if (arg.startsWith("-")) {
      throw new Error(`Unknown option: ${arg}`);
    }

    positional.push(arg);
  }

  if (parsed.name.length === 0 && positional.length > 0) {
    parsed.name = positional.join(" ");
  }

  return parsed;
}

async function resolveUserId(email: string): Promise<string> {
  const db = getDb();
  const owner = await db.query.user.findFirst({
    where: eq(user.email, email),
    columns: { id: true, email: true },
  });

  if (!owner) {
    throw new Error(`No user found with email ${email}.`);
  }

  return owner.id;
}

function searchStaff(options: {
  allUsers: boolean;
  exact: boolean;
  name: string;
  userId?: string;
}) {
  const db = getDb();
  const nameCondition = options.exact
    ? eq(staff.name, options.name)
    : ilike(staff.name, `%${options.name}%`);

  const where = options.allUsers
    ? nameCondition
    : and(eq(staff.userId, options.userId ?? ""), nameCondition);

  return db.query.staff.findMany({
    where,
    orderBy: (table, { asc }) => [asc(table.name), asc(table.hiredAt)],
    with: {
      user: {
        columns: { email: true },
      },
    },
  });
}

function formatMatch(
  index: number,
  row: {
    id: string;
    name: string;
    role: string;
    status: string;
    user: { email: string };
  }
): string {
  return `${index + 1}. ${row.name} (${row.role}) — ${row.status} — ${row.user.email} — ${row.id}`;
}

async function pickMatch<T>(
  matches: T[],
  format: (index: number, row: T) => string
): Promise<T> {
  if (matches.length === 1) {
    return matches[0];
  }

  console.log("Multiple matches:");
  for (const [index, row] of matches.entries()) {
    console.log(format(index, row));
  }

  const rl = createInterface({ input, output });

  try {
    while (true) {
      const answer = await rl.question(
        `Enter number to delete (1-${matches.length}), or press Enter to cancel: `
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

async function confirmDelete(label: string, skip: boolean): Promise<void> {
  if (skip) {
    return;
  }

  const rl = createInterface({ input, output });

  try {
    const answer = await rl.question(`Delete ${label}? [y/N] `);
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

  const searchName = parsed.name.trim();
  if (searchName.length === 0) {
    printUsage();
    throw new Error("A name search term is required.");
  }

  const userId = parsed.allUsers
    ? undefined
    : await resolveUserId(parsed.email);

  if (parsed.allUsers) {
    console.log("Searching staff across all users...");
  } else {
    console.log(`Searching staff for ${parsed.email}...`);
  }

  const matches = await searchStaff({
    allUsers: parsed.allUsers,
    exact: parsed.exact,
    name: searchName,
    userId,
  });

  if (matches.length === 0) {
    console.log(`No staff found matching "${searchName}".`);
    return;
  }

  const selected = await pickMatch(matches, formatMatch);
  const label = `${selected.name} (${selected.role}, ${selected.user.email})`;

  await confirmDelete(label, parsed.yes);

  const deleted = await deleteStaff(selected.userId, selected.id);

  if (!deleted) {
    throw new Error(`Failed to delete staff ${selected.id}.`);
  }

  console.log(`Deleted ${label}.`);
}

main().catch((error: unknown) => {
  if (error instanceof Error && error.message === "Cancelled.") {
    console.log("Cancelled.");
    process.exit(0);
  }

  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});

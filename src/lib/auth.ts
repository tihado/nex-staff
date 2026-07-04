import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/db";
// biome-ignore lint/performance/noNamespaceImport: Better Auth adapter expects the schema object.
import * as schema from "@/db/schema";
import { provisionAssistantForUser } from "@/lib/provision-assistant";

const TRAILING_SLASH_PATTERN = /\/$/;

function getAuthSecret(): string {
  const secret = process.env.BETTER_AUTH_SECRET;
  if (secret) {
    return secret;
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error("BETTER_AUTH_SECRET is not set");
  }

  return "development-secret-min-32-characters";
}

function getAuthBaseUrl(): string {
  if (process.env.BETTER_AUTH_URL) {
    return process.env.BETTER_AUTH_URL.replace(TRAILING_SLASH_PATTERN, "");
  }

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  return "http://localhost:3000";
}

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema,
  }),
  secret: getAuthSecret(),
  baseURL: getAuthBaseUrl(),
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
    requireEmailVerification: false,
    minPasswordLength: 8,
  },
  advanced: {
    database: {
      generateId: () => crypto.randomUUID(),
    },
  },
  databaseHooks: {
    user: {
      create: {
        after: async (createdUser) => {
          await provisionAssistantForUser(createdUser.id);
        },
      },
    },
  },
});

export type Session = typeof auth.$Infer.Session;

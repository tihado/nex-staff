import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/db";
// biome-ignore lint/performance/noNamespaceImport: Better Auth adapter expects the schema object.
import * as schema from "@/db/schema";
import { getAuthBaseUrlConfig, getTrustedAuthOrigins } from "@/lib/auth-url";
import { provisionAssistantForUser } from "@/lib/provision-assistant";

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

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema,
  }),
  secret: getAuthSecret(),
  baseURL: getAuthBaseUrlConfig(),
  trustedOrigins: getTrustedAuthOrigins(),
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
    requireEmailVerification: false,
    minPasswordLength: 8,
  },
  advanced: {
    trustedProxyHeaders: Boolean(process.env.VERCEL),
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

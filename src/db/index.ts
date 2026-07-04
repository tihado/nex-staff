import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
// biome-ignore lint/performance/noNamespaceImport: Drizzle requires the full schema object.
import * as schema from "./schema";

function createDb() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not set");
  }

  return drizzle({
    client: neon(databaseUrl),
    schema,
  });
}

let database: ReturnType<typeof createDb> | undefined;

export function getDb() {
  if (!database) {
    database = createDb();
  }
  return database;
}

export const db = new Proxy({} as ReturnType<typeof createDb>, {
  get(_target, property, receiver) {
    return Reflect.get(getDb(), property, receiver);
  },
});

export type Database = ReturnType<typeof createDb>;

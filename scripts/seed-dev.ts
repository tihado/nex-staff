import { config } from "dotenv";
import { sql } from "drizzle-orm";
import { getDb } from "../src/db";

config({ path: ".env.local" });
config({ path: ".env" });

async function main() {
  const db = getDb();
  await db.execute(sql`select 1`);
  console.log("Database connection OK");
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});

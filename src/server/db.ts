import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "./schema";

let client: ReturnType<typeof postgres> | undefined;

export function getDb() {
  if (!client) {
    const url = process.env["DATABASE_URL"];
    if (!url)
      throw new Error(
        "DATABASE_URL is required. Copy .env.example to .env and start the infrastructure.",
      );
    client = postgres(url, { max: 10, prepare: false });
  }
  return drizzle(client, { schema });
}

/** Closes the process-local pool for one-off commands such as seed scripts. */
export async function closeDb() {
  if (!client) return;
  const activeClient = client;
  client = undefined;
  await activeClient.end({ timeout: 5 });
}

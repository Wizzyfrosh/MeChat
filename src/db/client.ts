import "server-only";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

// Intentionally lazy. Builds and UI previews must not need DB credentials.
// Only call from authenticated server-side routes/actions.
export function getDatabase() {
  const connection = process.env.DATABASE_URL;
  if (!connection) throw new Error("MeChat database is not configured");
  return drizzle(neon(connection), { schema });
}

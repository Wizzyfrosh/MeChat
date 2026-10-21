import { defineConfig } from "drizzle-kit";

// Schema generation can run without credentials. Never hard-code a DB URL.
// Migration execution requires a secure DATABASE_URL in the environment.
const url = process.env.DATABASE_URL;
export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  strict: true,
  verbose: true,
  ...(url ? { dbCredentials: { url } } : {}),
});

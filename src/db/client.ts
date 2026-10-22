import "server-only";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";
import * as authSchema from "./auth-schema";
export function getDatabase(){
 const connection=process.env.DATABASE_URL;
 if(!connection)throw new Error("Database is not configured");
 return drizzle(neon(connection),{schema:{...schema,...authSchema}});
}

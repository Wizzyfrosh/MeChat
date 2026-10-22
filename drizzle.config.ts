import { defineConfig } from "drizzle-kit";
const url=process.env.DATABASE_URL;
export default defineConfig({
 schema:["./src/db/schema.ts","./src/db/auth-schema.ts"],
 out:"./drizzle",
 dialect:"postgresql",strict:true,verbose:true,
 ...(url?{dbCredentials:{url}}:{}),
});

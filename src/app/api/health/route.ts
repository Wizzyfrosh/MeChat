import { sql } from "drizzle-orm";
import { getDatabase } from "@/db/client";
import { isAuthConfigured } from "@/lib/auth";
export const runtime="nodejs";
export const dynamic="force-dynamic";
export async function GET(){
 let database=false;
 try { await getDatabase().execute(sql`select 1 as ok`);database=true; }catch{}
 const authReady=isAuthConfigured();
 const aiReady=Boolean(process.env.DEEPSEEK_API_KEY);
 const healthy=database&&authReady&&aiReady;
 return Response.json({
   status:healthy?"ready":"setup-required",
   database:database?"reachable":"unavailable",
   auth:authReady?"configured":"configuration-required",
   ai:aiReady?"configured":"configuration-required"
 },{status:healthy?200:503,headers:{"Cache-Control":"no-store","X-Robots-Tag":"noindex"}});
}

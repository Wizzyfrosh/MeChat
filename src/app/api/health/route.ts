import { sql } from "drizzle-orm";
import { getDatabase } from "@/db/client";
import { isAuthConfigured } from "@/lib/auth";
import { getDeepSeekAvailability } from "@/lib/deepseek-provider";

export const runtime="nodejs";
export const dynamic="force-dynamic";

export async function GET(req:Request){
 let database=false;
 try{await getDatabase().execute(sql`select 1 as ok`);database=true}catch{}
 const authReady=isAuthConfigured();
 const aiKeyPresent=Boolean(process.env.DEEPSEEK_API_KEY);
 const diagnose=new URL(req.url).searchParams.get("provider")==="check";
 const provider=diagnose?await getDeepSeekAvailability():undefined;
 const healthy=database&&authReady&&aiKeyPresent&&(provider===undefined||provider==="available");
 return Response.json({
   status:healthy?"ready":"attention-required",
   database:database?"reachable":"unavailable",
   auth:authReady?"configured":"configuration-required",
   ai:aiKeyPresent?"configured":"configuration-required",
   ...(diagnose?{provider}:{}),
 },{status:healthy?200:503,headers:{"Cache-Control":"no-store","X-Robots-Tag":"noindex"}});
}

import {sql} from "drizzle-orm";
import {getDatabase} from "@/db/client";
import {isAuthConfigured} from "@/lib/auth";
import {configuredIds} from "@/lib/ai-providers";

export const runtime="nodejs";
export const dynamic="force-dynamic";

/**
 * Public readiness only. Do not expose provider inventory, credentials,
 * account balances or internal service diagnostics to anonymous callers.
 * In particular, never call provider credential verification here.
 */
export async function GET(){
 let database=false;
 try{await getDatabase().execute(sql`select 1 as ok`);database=true}catch{}
 const ready=database&&isAuthConfigured()&&configuredIds().length>0;
 return Response.json({status:ready?"ok":"degraded"},{
  status:ready?200:503,
  headers:{"Cache-Control":"no-store","X-Robots-Tag":"noindex"}
 });
}

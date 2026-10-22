import {sql} from "drizzle-orm";
import {getDatabase} from "@/db/client";
import {isAuthConfigured} from "@/lib/auth";
import {configuredIds} from "@/lib/ai-providers";
import {schemaIsReady} from "@/lib/schema-readiness.mjs";

export const runtime="nodejs";
export const dynamic="force-dynamic";

/**
 * Only disclose a generic readiness result to anonymous callers.
 * A successful database connection alone is not sufficient: the nine
 * application tables must exist before chat/auth routes can operate.
 * Never contact provider APIs or expose provider/credential diagnostics.
 */
export async function GET(){
 let schemaReady=false;
 try{
  const result=await getDatabase().execute(
   sql<{table_name:string}>`select table_name from information_schema.tables
     where table_schema='public' and table_type='BASE TABLE'
       and table_name in (
         'user','session','account','verification',
         'conversations','messages','user_settings','usage_events','ai_daily_quotas'
       )`
  );
  schemaReady=schemaIsReady(result.rows.map(row=>row.table_name));
 }catch{/* Missing database or tables only yields a generic degraded state. */}
 const ready=schemaReady&&isAuthConfigured()&&configuredIds().length>0;
 return Response.json({status:ready?"ok":"degraded"},{
  status:ready?200:503,
  headers:{
   "Cache-Control":"no-store",
   "X-Robots-Tag":"noindex",
   "X-Content-Type-Options":"nosniff"
  }
 });
}

import {sql} from "drizzle-orm";
import {getDatabase} from "@/db/client";
import {isAuthConfigured} from "@/lib/auth";
import {getProviderDirectory} from "@/lib/ai-providers";
import {verifyFreeProviderKeys} from "@/lib/ai-provider-health";
export const runtime="nodejs";
export const dynamic="force-dynamic";
export async function GET(req:Request){
 let database=false;
 try{await getDatabase().execute(sql`select 1 as ok`);database=true}catch{}
 const auth=isAuthConfigured();
 const providers=await getProviderDirectory();
 const configured=providers.options.filter(p=>p.configured).map(p=>({id:p.id,status:p.status}));
 const enabled=providers.options.some(p=>p.selectable);
 const ready=database&&auth&&enabled;
 const inspectProviders=new URL(req.url).searchParams.get("verifyProviders")==="1";
 const providerKeyChecks=inspectProviders?await verifyFreeProviderKeys():undefined;
 return Response.json({
  status:ready?"configuration-ready":"attention-required",
  database:database?"reachable":"unavailable",
  auth:auth?"configured":"configuration-required",
  ai:enabled?"configured-unverified":"unavailable",
  providers:configured,
  ...(providerKeyChecks?{providerKeyChecks}:{}),
 },{status:ready?200:503,headers:{"Cache-Control":"no-store","X-Robots-Tag":"noindex"}});
}

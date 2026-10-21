import { sql } from "drizzle-orm";
import { getDatabase } from "@/db/client";
import { isAuthConfigured } from "@/lib/auth";

export const runtime="nodejs";
export const dynamic="force-dynamic";

type ProviderStatus = "available"|"insufficient-balance"|"invalid-api-key"|"rate-limited"|"provider-unavailable"|"not-configured"|"invalid-provider-response";
let lastProviderCheck:{at:number;status:ProviderStatus}|undefined;

async function checkProvider():Promise<ProviderStatus>{
 const apiKey=process.env.DEEPSEEK_API_KEY;
 if(!apiKey)return "not-configured";
 if(lastProviderCheck && Date.now()-lastProviderCheck.at<60_000)return lastProviderCheck.status;
 let status:ProviderStatus="provider-unavailable";
 try{
   const response=await fetch("https://api.deepseek.com/user/balance",{
     method:"GET",
     headers:{"Authorization":`Bearer ${apiKey}`,"Accept":"application/json"},
     cache:"no-store",
     signal:AbortSignal.timeout(8_000)
   });
   if(response.status===401)status="invalid-api-key";
   else if(response.status===402)status="insufficient-balance";
   else if(response.status===429)status="rate-limited";
   else if(response.ok){
     const body:unknown=await response.json();
     if(typeof body==="object"&&body!==null&&"is_available" in body && typeof body.is_available==="boolean"){
       status=body.is_available?"available":"insufficient-balance";
     } else status="invalid-provider-response";
   }
 }catch{}
 lastProviderCheck={at:Date.now(),status};
 return status;
}

export async function GET(req:Request){
 let database=false;
 try{await getDatabase().execute(sql`select 1 as ok`);database=true}catch{}
 const authReady=isAuthConfigured();
 const aiKeyPresent=Boolean(process.env.DEEPSEEK_API_KEY);
 const diagnose=new URL(req.url).searchParams.get("provider")==="check";
 const provider=diagnose?await checkProvider():undefined;
 const healthy=database&&authReady&&aiKeyPresent&&(provider===undefined||provider==="available");
 return Response.json({
   status:healthy?"ready":"attention-required",
   database:database?"reachable":"unavailable",
   auth:authReady?"configured":"configuration-required",
   ai:aiKeyPresent?"configured":"configuration-required",
   ...(diagnose?{provider}:{}),
 },{status:healthy?200:503,headers:{"Cache-Control":"no-store","X-Robots-Tag":"noindex"}});
}

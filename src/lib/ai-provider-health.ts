import "server-only";

type Name="groq"|"gemini"|"openrouter";
type Status="valid"|"invalid-key"|"rate-limited"|"unavailable"|"unexpected-response"|"not-configured";
const specs:Record<Name,{env:string;url:string}>={
 groq:{env:"GROQ_API_KEY",url:"https://api.groq.com/openai/v1/models/openai/gpt-oss-20b"},
 gemini:{env:"GEMINI_API_KEY",url:"https://generativelanguage.googleapis.com/v1beta/openai/models/gemini-3.1-flash-lite"},
 openrouter:{env:"OPENROUTER_API_KEY",url:"https://openrouter.ai/api/v1/key"},
};
let cache:{checkedAt:number;results:Record<Name,Status>}|undefined;
let inFlight:Promise<Record<Name,Status>>|undefined;
async function verify(name:Name):Promise<Status>{
 const {env,url}=specs[name];
 const key=process.env[env];
 if(!key)return "not-configured";
 try{
  const response=await fetch(url,{
   headers:{"Authorization":`Bearer ${key}`,"Accept":"application/json"},
   cache:"no-store",
   signal:AbortSignal.timeout(8000)
  });
  if(response.status===401||response.status===403)return "invalid-key";
  if(response.status===429)return "rate-limited";
  if(response.status===404)return "unexpected-response";
  if(!response.ok)return "unavailable";
  const value:unknown=await response.json();
  if(!value||typeof value!=="object")return "unexpected-response";
  if(name==="openrouter"){
   return "data" in value && typeof value.data==="object"?"valid":"unexpected-response";
  }
  return "id" in value || "data" in value?"valid":"unexpected-response";
 }catch{return "unavailable"}
}
/**
 * Non-billable authentication/model lookup only. Never returns credentials,
 * quota amounts, billing details, or upstream payloads.
 * Cache and single-flight coalescing bound calls within each server instance.
 */
export async function verifyFreeProviderKeys(){
 if(cache&&Date.now()-cache.checkedAt<300_000)return cache.results;
 if(inFlight)return inFlight;
 inFlight=(async()=>{
  const [groq,gemini,openrouter]=await Promise.all([verify("groq"),verify("gemini"),verify("openrouter")]);
  const results={groq,gemini,openrouter};
  cache={checkedAt:Date.now(),results};
  return results;
 })();
 try{return await inFlight}finally{inFlight=undefined}
}

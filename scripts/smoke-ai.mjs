/**
 * Small smoke test against the three opted-in free-tier providers.
 * Run ONLY with trusted Vercel Preview server env during a reviewed deployment.
 * This sends a generic, non-personal question; it never reads user conversations.
 * Print provider names, status codes and pass/fail, not secrets or AI text.
 */
import {DeepSeekStreamAccumulator} from "../src/lib/deepseek-stream.mjs";

const servers=[
 {id:"groq",key:"GROQ_API_KEY",model:"openai/gpt-oss-20b",url:"https://api.groq.com/openai/v1/chat/completions",extra:{include_reasoning:false,stream_options:{include_usage:true}}},
 {id:"gemini",key:"GEMINI_API_KEY",model:"gemini-3.1-flash-lite",url:"https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",extra:{}},
 {id:"openrouter",key:"OPENROUTER_API_KEY",model:"openrouter/free",url:"https://openrouter.ai/api/v1/chat/completions",extra:{stream_options:{include_usage:true}}}
];

async function check(item){
 const apiKey=process.env[item.key];
 if(!apiKey)return {id:item.id,status:"SKIP",detail:"not-configured"};
 const controller=new AbortController();
 const timeout=setTimeout(()=>controller.abort(),27_000);
 try{
  const headers={"Content-Type":"application/json","Authorization":`Bearer ${apiKey}`};
  if(item.id==="openrouter"){headers["HTTP-Referer"]="https://mechat.froshcodeorbit.site";headers["X-Title"]="MeChat";}
  const response=await fetch(item.url,{
   method:"POST",headers,signal:controller.signal,cache:"no-store",
   body:JSON.stringify({model:item.model,stream:true,max_tokens:128,messages:[{role:"user",content:"Please reply with one short sentence saying the service is available."}],...item.extra})
  });
  if(!response.ok)return {id:item.id,status:"FAIL",detail:`http-${response.status}`};
  if(!response.body)return {id:item.id,status:"FAIL",detail:"no-stream"};
  const parser=new DeepSeekStreamAccumulator(6000);
  const reader=response.body.getReader();
  while(!parser.done){
   const part=await reader.read();
   if(part.done)break;
   parser.feed(part.value);
  }
  return {id:item.id,status:parser.complete?"PASS":"FAIL",
   detail:parser.complete?"stream-complete":parser.receivedDone?"unexpected-finish":"stream-interrupted"};
 }catch(e){
  return {id:item.id,status:"FAIL",detail:e?.name==="AbortError"?"timeout":"network-error"};
 }finally{clearTimeout(timeout)}
}
const results=await Promise.all(servers.map(check));
for(const result of results)console.log("[MeChat provider smoke]",result.id,result.status,result.detail);
console.log("[MeChat provider smoke]",results.filter(x=>x.status==="PASS").length,"of",servers.length,"providers streamed successfully");

import "server-only";
import {getDeepSeekAvailability} from "@/lib/deepseek-provider";
import {providerAttempts} from "@/lib/ai-provider-routing.mjs";

export type ProviderId="groq"|"gemini"|"openrouter"|"deepseek";
export type ModelSelection=ProviderId|"auto";
type Definition={
 id:ProviderId;label:string;modelId:string;endpoint:string;envKey:string;
 description:string;freeTier:boolean;
};
const definitions:Record<ProviderId,Definition>={
 groq:{id:"groq",label:"Groq · GPT-OSS 20B",modelId:"openai/gpt-oss-20b",endpoint:"https://api.groq.com/openai/v1/chat/completions",envKey:"GROQ_API_KEY",description:"Fast responses; free developer quotas are limited.",freeTier:true},
 gemini:{id:"gemini",label:"Google Gemini · Flash-Lite",modelId:"gemini-3.1-flash-lite",endpoint:"https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",envKey:"GEMINI_API_KEY",description:"Unpaid API usage may be used to improve Google's products.",freeTier:true},
 openrouter:{id:"openrouter",label:"OpenRouter · Free Models",modelId:"openrouter/free",endpoint:"https://openrouter.ai/api/v1/chat/completions",envKey:"OPENROUTER_API_KEY",description:"Routes to changing free models and upstream companies.",freeTier:true},
 deepseek:{id:"deepseek",label:"DeepSeek · Flash",modelId:"deepseek-flash",endpoint:"https://api.deepseek.com/chat/completions",envKey:"DEEPSEEK_API_KEY",description:"Requires available API balance.",freeTier:false}
};
const ids:ProviderId[]=["groq","gemini","openrouter","deepseek"];
export type ActiveProvider=Definition&{apiKey:string};
export type PromptMessage={role:"system"|"user"|"assistant";content:string};
export function configuredIds():ProviderId[]{return ids.filter(id=>Boolean(process.env[definitions[id].envKey]));}
function active(id:ProviderId):ActiveProvider|null{
 const item=definitions[id],apiKey=process.env[item.envKey];
 return apiKey?{...item,apiKey}:null;
}
export function providerCandidates(selection:ModelSelection):ActiveProvider[]{
 return providerAttempts(selection,configuredIds()).map(id=>active(id as ProviderId)).filter((x):x is ActiveProvider=>x!==null);
}
export async function getProviderDirectory(){
 const deepseekState=process.env.DEEPSEEK_API_KEY?await getDeepSeekAvailability():"not-configured";
 const options=ids.map(id=>{
  const item=definitions[id],configured=Boolean(process.env[item.envKey]);
  const status=!configured?"not-configured":id==="deepseek"?deepseekState:"configured-unverified";
  return {id,label:item.label,modelId:item.modelId,description:item.description,configured,freeTier:item.freeTier,status,
   selectable:configured&&(id!=="deepseek"||status==="available")};
 });
 const defaultProvider=options.find(o=>o.freeTier&&o.selectable)?.id??options.find(o=>o.selectable)?.id??null;
 return {options,defaultProvider,autoEnabled:options.some(o=>o.freeTier&&o.selectable),
  autoDisclosure:"Auto may send the same message to Groq, Google Gemini, or OpenRouter when earlier services cannot start the response. Gemini's unpaid tier may use prompts to improve Google's products, and OpenRouter uses variable downstream model providers. Do not select Auto unless you agree."};
}
export function createProviderRequest(provider:ActiveProvider,messages:PromptMessage[]){
 const headers:Record<string,string>={"Content-Type":"application/json","Authorization":`Bearer ${provider.apiKey}`};
 if(provider.id==="openrouter"){headers["HTTP-Referer"]="https://mechat.froshcodeorbit.site";headers["X-Title"]="MeChat";}
 const body:Record<string,unknown>={model:provider.modelId,messages,stream:true,max_tokens:1200};
 if(provider.id!=="gemini")body.stream_options={include_usage:true};
 if(provider.id==="deepseek")body.thinking={type:"disabled"};
 if(provider.id==="groq")body.include_reasoning=false;
 return {endpoint:provider.endpoint,headers,body:JSON.stringify(body)};
}
export function providerFailure(provider:ProviderId,status:number){
 const label=definitions[provider].label;
 if(status===401||status===403)return {status:503,reason:"invalid-api-key",message:`${label} needs its API credentials checked by the administrator.`};
 if(status===402)return {status:503,reason:"insufficient-balance",message:`${label} has no usable credits. Select another provider.`};
 if(status===429)return {status:429,reason:"rate-limited",message:`${label} reached its request limit. Try again later or select another provider.`};
 if([400,404,422].includes(status))return {status:503,reason:"invalid-model-configuration",message:`${label} rejected the configured model request. The administrator needs to check it.`};
 return {status:503,reason:"provider-unavailable",message:`${label} cannot complete your request right now. Try again later or select another provider.`};
}

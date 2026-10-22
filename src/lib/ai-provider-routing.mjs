export const FREE_PROVIDER_PRIORITY=Object.freeze(["groq","gemini","openrouter"]);
export const PROVIDER_IDS=Object.freeze(["groq","gemini","openrouter","deepseek"]);
export function providerAttempts(selection,available){
 const enabled=new Set(available);
 if(selection==="auto")return FREE_PROVIDER_PRIORITY.filter(id=>enabled.has(id));
 return PROVIDER_IDS.includes(selection)&&enabled.has(selection)?[selection]:[];
}
export function shouldAutoTryNext(selection,status){
 return selection==="auto"&&[402,408,429,500,502,503,504].includes(status);
}
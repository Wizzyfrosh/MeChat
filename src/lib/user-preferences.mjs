/**
 * Account personalization validation is deliberately pure and closed-enum.
 * User-supplied content must never become arbitrary system instructions.
 */
export const DEFAULT_PREFERENCES=Object.freeze({theme:"light",responseStyle:"balanced"});
export const THEME_OPTIONS=Object.freeze(["light","dark"]);
export const RESPONSE_STYLES=Object.freeze(["balanced","concise","detailed"]);

const isRecord=value=>value!==null&&typeof value==="object"&&!Array.isArray(value);
export function parsePreferencePatch(value){
 if(!isRecord(value))return {ok:false,error:"Provide a settings object."};
 const keys=Object.keys(value);
 if(keys.length===0||keys.some(key=>key!=="theme"&&key!=="responseStyle"))
  return {ok:false,error:"Only appearance and response style can be changed."};
 if("theme" in value&&!THEME_OPTIONS.includes(value.theme))
  return {ok:false,error:"Choose light or dark appearance."};
 if("responseStyle" in value&&!RESPONSE_STYLES.includes(value.responseStyle))
  return {ok:false,error:"Choose a supported response style."};
 return {ok:true,patch:Object.fromEntries(keys.map(key=>[key,value[key]]))};
}

/** Only validated stored enum values alter the system-level style. */
export function responseStyleInstruction(style){
 switch(style){
 case "concise":return "Prefer short, direct answers with minimal extra explanation. Preserve essential safety and accuracy details.";
 case "detailed":return "When the question benefits from depth, provide careful explanations, concrete examples, and useful structure without filler.";
 default:return "Match answer length and detail to the user's question, keeping simple questions short and complex answers useful.";
 }
}

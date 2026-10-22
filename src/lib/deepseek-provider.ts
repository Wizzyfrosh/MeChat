import "server-only";

export type DeepSeekAvailability =
  | "available"
  | "insufficient-balance"
  | "invalid-api-key"
  | "rate-limited"
  | "provider-unavailable"
  | "invalid-provider-response"
  | "not-configured";

let cached: {at:number;status:DeepSeekAvailability} | undefined;

/** Only a server-side API key is used; no balance or credentials are returned to the client. */
export async function getDeepSeekAvailability():Promise<DeepSeekAvailability> {
  const key=process.env.DEEPSEEK_API_KEY;
  if(!key)return "not-configured";
  // A short cache keeps normal chat requests responsive and limits balance API traffic.
  if(cached && Date.now()-cached.at<30_000)return cached.status;
  let status:DeepSeekAvailability="provider-unavailable";
  try {
    const response=await fetch("https://api.deepseek.com/user/balance",{
      method:"GET",
      headers:{"Authorization":`Bearer ${key}`,"Accept":"application/json"},
      cache:"no-store",
      signal:AbortSignal.timeout(8_000)
    });
    if(response.status===401||response.status===403)status="invalid-api-key";
    else if(response.status===402)status="insufficient-balance";
    else if(response.status===429)status="rate-limited";
    else if(response.ok){
      const result:unknown=await response.json();
      if(result && typeof result==="object" && "is_available" in result && typeof result.is_available==="boolean"){
        status=result.is_available?"available":"insufficient-balance";
      }else status="invalid-provider-response";
    }
  }catch{
    // Treat unavailable balance checking as inconclusive, not definitive API failure.
  }
  cached={at:Date.now(),status};
  return status;
}

/** Keep provider details and API secrets hidden while exposing actionable messages. */
export function deepSeekRequestError(status:number):{httpStatus:number;message:string;reason:string}{
  switch(status){
    case 400:
    case 422:return {httpStatus:502,message:"The AI provider rejected MeChat's request. Please contact support.",reason:"invalid-request"};
    case 401:
    case 403:return {httpStatus:503,message:"MeChat's DeepSeek API key needs to be checked by the administrator.",reason:"invalid-api-key"};
    case 402:return {httpStatus:402,message:"MeChat's DeepSeek API account has insufficient credits. AI chat is temporarily unavailable until the balance is topped up.",reason:"insufficient-balance"};
    case 429:return {httpStatus:429,message:"DeepSeek is receiving too many requests. Please try again shortly.",reason:"rate-limited"};
    case 500:
    case 503:return {httpStatus:503,message:"DeepSeek is temporarily unavailable. Please try again later.",reason:"provider-unavailable"};
    default:return {httpStatus:502,message:"DeepSeek could not complete the request. Please try again later.",reason:"provider-error"};
  }
}

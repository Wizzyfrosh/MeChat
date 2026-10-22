/**
 * Better Auth accepts requests only from explicitly configured deployment hosts.
 * Vercel injects VERCEL_URL and VERCEL_BRANCH_URL for each preview build.
 * Do NOT permit *.vercel.app; other accounts must never be trusted.
 */
export function authAllowedHosts(env) {
 const hosts=new Set();
 const values=[
  env.BETTER_AUTH_URL,
  env.VERCEL_URL,
  env.VERCEL_BRANCH_URL,
  env.VERCEL_PROJECT_PRODUCTION_URL,
 ];
 for(const raw of values){
  if(!raw || typeof raw!=="string")continue;
  try{
   const url=new URL(raw.includes("://")?raw:`https://${raw}`);
   if(url.username||url.password||url.search||url.hash||url.pathname!=="/")continue;
   const isLocal=url.hostname==="localhost"||url.hostname==="127.0.0.1";
   if(url.protocol!=="https:" && !(env.NODE_ENV!=="production"&&isLocal&&url.protocol==="http:"))continue;
   if(url.host)hosts.add(url.host);
  }catch{/* Never trust malformed host data. */}
 }
 return [...hosts];
}

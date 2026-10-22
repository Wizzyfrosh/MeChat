/**
 * Require an exact same-origin Origin header for cookie-authenticated writes.
 * The same policy is already used for MeChat account settings and bulk deletion.
 */
export function isSameOriginWrite(request) {
 const origin=request.headers.get("origin");
 if(!origin||origin==="null")return false;
 try{
  const given=new URL(origin);
  const target=new URL(request.url);
  if(given.pathname!=="/"||given.search||given.hash||given.username||given.password)return false;
  const local=given.protocol==="http:"&&["localhost","127.0.0.1"].includes(given.hostname);
  return (given.protocol==="https:"||local)&&given.origin===target.origin;
 }catch{return false;}
}

#!/usr/bin/env node
/**
 * MeChat release-gate isolation smoke test.
 *
 * Run manually, ONLY on an isolated Vercel preview with two pre-created,
 * verified, disposable Better Auth accounts and a dedicated preview DB.
 * Never store test passwords in Git or print cookies/passwords to CI logs.
 *
 * Required environment:
 * E2E_BASE_URL=https://mechat-...vercel.app
 * E2E_USER_A_EMAIL, E2E_USER_A_PASSWORD
 * E2E_USER_B_EMAIL, E2E_USER_B_PASSWORD
 * E2E_ALLOW_PREVIEW_WRITES=YES
 *
 * This creates and removes one unique chat owned by test user A and briefly
 * changes A's theme, restoring it afterward. It never bulk-clears chats.
 */
import assert from "node:assert/strict";
import {randomUUID} from "node:crypto";

const required=(key)=>{
 const value=process.env[key];
 if(!value)throw Error(`Missing required environment variable: ${key}`);
 return value;
};
const target=new URL(required("E2E_BASE_URL"));
const host=target.hostname.toLowerCase();
if(target.protocol!=="https:"||!/^mechat-[a-z0-9-]+\.vercel\.app$/.test(host)||
 host==="mechat-swart.vercel.app"||target.pathname!=="/"||target.search||target.hash){
 throw Error("Refusing to run outside an exact, isolated MeChat HTTPS Vercel preview deployment.");
}
if(process.env.E2E_ALLOW_PREVIEW_WRITES!=="YES"){
 throw Error("Set E2E_ALLOW_PREVIEW_WRITES=YES only after confirming the preview uses a disposable database and accounts.");
}
const emailA=required("E2E_USER_A_EMAIL"),emailB=required("E2E_USER_B_EMAIL");
if(emailA.trim().toLowerCase()===emailB.trim().toLowerCase())
 throw Error("The two test accounts must be distinct.");
const passA=required("E2E_USER_A_PASSWORD"),passB=required("E2E_USER_B_PASSWORD");

const pathUrl=path=>new URL(path,target.origin);
const withoutCredentials=(path,init={})=>fetch(pathUrl(path),{
 cache:"no-store",redirect:"manual",...init
});
const jsonBody=(obj)=>JSON.stringify(obj);
const writeOptions=(method,body)=>({
 method,
 headers:{"Content-Type":"application/json","Origin":target.origin},
 body:jsonBody(body)
});

async function signIn(email,password){
 const res=await withoutCredentials("/api/auth/sign-in/email",writeOptions("POST",{email,password}));
 assert.equal(res.status,200,"Could not authenticate a verified disposable test user.");
 // Set-Cookie may contain an expires date with commas; use getSetCookie().
 const cookies=res.headers.getSetCookie().map(value=>value.split(";")[0])
  .filter(value=>/^[^=\s]+=[^;]*$/.test(value));
 assert.ok(cookies.length>0,"Sign-in did not issue an authenticated session cookie.");
 return cookies.join("; ");
}
async function request(cookie,path,options={}){
 const headers=new Headers(options.headers);
 if(cookie)headers.set("Cookie",cookie);
 const res=await withoutCredentials(path,{...options,headers});
 return res;
}
async function bodyJson(res){
 const value=await res.json().catch(()=>null);
 assert.ok(value&&typeof value==="object","Response did not contain expected JSON.");
 return value;
}
async function expectedStatus(name,res,status){
 assert.equal(res.status,status,`${name}: expected HTTP ${status}, got ${res.status}`);
 console.log(`PASS ${name}`);
}
async function expectedFailure(name,res){
 assert.ok([401,403,404].includes(res.status),
  `${name}: expected 401, 403 or 404; received ${res.status}`);
 console.log(`PASS ${name}`);
}
async function getJson(cookie,path){
 const res=await request(cookie,path);
 assert.equal(res.status,200,`GET ${path} returned HTTP ${res.status}`);
 return bodyJson(res);
}

let cookieA="",cookieB="",createdId=null,originalTheme=null;
const uniqueTitle=`MeChat isolation test ${randomUUID()}`;
let failed=false;
try{
 cookieA=await signIn(emailA,passA);
 cookieB=await signIn(emailB,passB);
 console.log("PASS authenticated disposable test sessions created");

 const selfA=await getJson(cookieA,"/api/auth/get-session");
 const selfB=await getJson(cookieB,"/api/auth/get-session");
 assert.ok(selfA.user?.id&&selfB.user?.id);
 assert.notEqual(selfA.user.id,selfB.user.id,"Sessions unexpectedly share a user ID.");
 console.log("PASS distinct authenticated users");

 for(const [name,path] of [
  ["anonymous conversation list","/api/conversations"],
  ["anonymous account export","/api/data/export"],
  ["anonymous settings","/api/settings"]
 ]){
  await expectedStatus(name,await request("",path),401);
 }
 const create=await request(cookieA,"/api/conversations",writeOptions("POST",{}));
 await expectedStatus("A creates test chat",create,201);
 createdId=(await bodyJson(create)).conversation?.id;
 assert.match(createdId,/^[0-9a-f-]{36}$/i);
 const rename=await request(cookieA,`/api/conversations/${createdId}`,
  writeOptions("PATCH",{title:uniqueTitle}));
 await expectedStatus("A renames owned chat",rename,200);
 const thread=await getJson(cookieA,`/api/conversations/${createdId}`);
 assert.equal(thread.conversation.title,uniqueTitle);
 console.log("PASS A reads owned chat");

 const findA=await getJson(cookieA,`/api/conversations?limit=25&q=${encodeURIComponent(uniqueTitle)}`);
 assert.ok(findA.conversations?.some(x=>x.id===createdId));
 const findB=await getJson(cookieB,`/api/conversations?limit=25&q=${encodeURIComponent(uniqueTitle)}`);
 assert.ok(!findB.conversations?.some(x=>x.id===createdId),
  "B's search leaked a chat owned by A.");
 console.log("PASS search results are owner-scoped");

 for(const [name,opts] of [
  ["B cannot read A's chat",undefined],
  ["B cannot rename A's chat",writeOptions("PATCH",{title:"Not yours"})],
  ["B cannot delete A's chat",{
   method:"DELETE",headers:{"Origin":target.origin}
  }]
 ]){
  await expectedFailure(name,await request(cookieB,`/api/conversations/${createdId}`,opts));
 }
 for(const format of ["json","markdown"]){
  await expectedFailure(`B cannot export A's chat as ${format}`,
   await request(cookieB,`/api/conversations/${createdId}/export?format=${format}`));
 }

 const exportResponse=await request(cookieA,`/api/conversations/${createdId}/export?format=json`);
 await expectedStatus("A exports owned chat",exportResponse,200);
 assert.match(exportResponse.headers.get("cache-control")??"",/no-store/);
 assert.match(exportResponse.headers.get("content-disposition")??"",/attachment/);
 const exported=await bodyJson(exportResponse);
 assert.equal(exported.id,createdId);
 assert.equal(exported.title,uniqueTitle);
 assert.ok(Array.isArray(exported.messages),"Export is missing messages.");
 console.log("PASS export is valid JSON and private/no-store");

 const full=await request(cookieA,"/api/data/export");
 await expectedStatus("A exports entire account's chats",full,200);
 const data=await bodyJson(full);
 assert.ok(data.conversations?.some(x=>x.id===createdId));
 console.log("PASS full history export includes owned chat");

 const settingsA=(await getJson(cookieA,"/api/settings")).settings;
 const settingsB=(await getJson(cookieB,"/api/settings")).settings;
 assert.ok(["light","dark"].includes(settingsA.theme));
 originalTheme=settingsA.theme;
 const opposite=originalTheme==="light"?"dark":"light";
 const changed=await request(cookieA,"/api/settings",writeOptions("PATCH",{theme:opposite}));
 await expectedStatus("A updates only its own settings",changed,200);
 assert.equal((await getJson(cookieA,"/api/settings")).settings.theme,opposite);
 assert.equal((await getJson(cookieB,"/api/settings")).settings.theme,settingsB.theme,
  "A's settings changed B's account.");
 console.log("PASS account settings are isolated");

 const invalidOrigin=await request(cookieA,"/api/settings",{
  method:"PATCH",headers:{"Origin":"https://malicious.invalid","Content-Type":"application/json"},
  body:jsonBody({theme:originalTheme})
 });
 await expectedStatus("cross-origin settings mutation rejected",invalidOrigin,403);
 console.log("PASS all tested isolation and privacy gates");
}catch(error){
 failed=true;
 // Error messages intentionally contain no credentials, cookies, or responses.
 console.error("FAILED:",error instanceof Error?error.message:"Unexpected failure");
}finally{
 // Scope cleanup to this disposable account and exact generated chat.
 if(cookieA&&originalTheme){
  try{
   const restored=await request(cookieA,"/api/settings",writeOptions("PATCH",{theme:originalTheme}));
   if(restored.status!==200){failed=true;console.error("FAILED restoring test theme");}
  }catch{failed=true;console.error("FAILED restoring test theme");}
 }
 if(cookieA&&createdId){
  try{
   const removed=await request(cookieA,`/api/conversations/${createdId}`,{
    method:"DELETE",headers:{"Origin":target.origin}
   });
   if(removed.status!==204){failed=true;console.error("FAILED cleaning up temporary test chat");}
  }catch{failed=true;console.error("FAILED cleaning up temporary test chat");}
 }
 console.log(failed?"Release isolation gates DID NOT PASS.":"Release isolation smoke gates passed.");
}
process.exitCode=failed?1:0;

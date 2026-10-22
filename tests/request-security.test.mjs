import {test} from "node:test";
import assert from "node:assert/strict";
import {isSameOriginWrite} from "../src/lib/request-security.mjs";

const base="https://mechat.froshcodeorbit.site/api/conversations/11111111-1111-4111-8111-111111111111";
const req=(origin,url=base)=>new Request(url,{method:"PATCH",headers:origin===undefined?{}:{"Origin":origin}});
test("accepts exact HTTPS site origin and localhost development",()=>{
 assert.equal(isSameOriginWrite(req("https://mechat.froshcodeorbit.site")),true);
 assert.equal(isSameOriginWrite(req("http://localhost:3000","http://localhost:3000/api/settings")),true);
});
test("rejects missing, null, malformed, cross-site and spoofed origin",()=>{
 for(const origin of [undefined,"null","","https://evil.invalid","https://mechat.froshcodeorbit.site.evil.invalid","http://mechat.froshcodeorbit.site","https://mechat.froshcodeorbit.site:3000","https://mechat.froshcodeorbit.site/path","https://mechat.froshcodeorbit.site/?x=1","https://mechat.froshcodeorbit.site@evil.invalid"]){
  assert.equal(isSameOriginWrite(req(origin)),false,String(origin));
 }
});
test("rejects matching origin sent to a different request host",()=>{
 assert.equal(isSameOriginWrite(req("https://mechat.froshcodeorbit.site","https://other.invalid/api/settings")),false);
});

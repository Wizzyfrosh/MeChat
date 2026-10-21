import {test} from "node:test";
import assert from "node:assert/strict";
import {authAllowedHosts} from "../src/lib/auth-hosts.mjs";

test("allows only configured canonical, exact Vercel deploy and branch host",()=>{
 const got=authAllowedHosts({
  NODE_ENV:"production",
  BETTER_AUTH_URL:"https://mechat.froshcodeorbit.site",
  VERCEL_URL:"mechat-abcdef-team.vercel.app",
  VERCEL_BRANCH_URL:"mechat-git-feature-team.vercel.app",
  VERCEL_PROJECT_PRODUCTION_URL:"mechat.froshcodeorbit.site",
 });
 assert.deepEqual(got,[
  "mechat.froshcodeorbit.site",
  "mechat-abcdef-team.vercel.app",
  "mechat-git-feature-team.vercel.app"
 ]);
 assert.equal(got.some(x=>x.includes("*")),false);
});
test("unknown preview domains are never allowed by wildcard",()=>{
 const hosts=authAllowedHosts({
  NODE_ENV:"production",
  BETTER_AUTH_URL:"https://mechat.froshcodeorbit.site",
  VERCEL_URL:"mechat-verified-team.vercel.app"
 });
 assert.equal(hosts.includes("some-other.vercel.app"),false);
});
test("rejects malformed origins, credentials, paths and insecure prod URLs",()=>{
 assert.deepEqual(authAllowedHosts({
  NODE_ENV:"production",
  BETTER_AUTH_URL:"http://insecure.example.com",
  VERCEL_URL:"https://attacker.example.com/path",
  VERCEL_BRANCH_URL:"https://admin:secret@example.com",
  VERCEL_PROJECT_PRODUCTION_URL:"javascript:alert(1)"
 }),[]);
});
test("supports local development without weakening production origins",()=>{
 assert.deepEqual(authAllowedHosts({NODE_ENV:"development",BETTER_AUTH_URL:"http://localhost:3000"}),["localhost:3000"]);
 assert.deepEqual(authAllowedHosts({NODE_ENV:"production",BETTER_AUTH_URL:"http://localhost:3000"}),[]);
});

import {test} from "node:test";
import assert from "node:assert/strict";
import {
 HISTORY_PAGE_SIZE,HISTORY_MAX_PAGE_SIZE,escapeSqlLike,
 encodeHistoryCursor,decodeHistoryCursor,parseHistoryQuery
} from "../src/lib/history-query.mjs";
const origin="https://mechat.example/api/conversations";
const id="11111111-1111-4111-8111-111111111111";

test("history pages default to a modest bounded size",()=>{
 assert.equal(parseHistoryQuery(origin).limit,HISTORY_PAGE_SIZE);
 assert.equal(parseHistoryQuery(origin).cursor,null);
 assert.equal(parseHistoryQuery(origin).q,"");
});
test("history search allows ordinary text and trims leading spaces",()=>{
 const result=parseHistoryQuery(origin+"?q="+encodeURIComponent("   Hello world  ")+"&limit=50");
 assert.equal(result.q,"Hello world");assert.equal(result.limit,HISTORY_MAX_PAGE_SIZE);
});
test("rejects invalid page sizes and overlong search terms",()=>{
 for(const limit of ["0","51","-1","1.5","a","100000"]){
  assert.throws(()=>parseHistoryQuery(origin+"?limit="+encodeURIComponent(limit)));
 }
 assert.throws(()=>parseHistoryQuery(origin+"?q="+"x".repeat(101)));
});
test("literal SQL LIKE escaping prevents wildcard searches",()=>{
 assert.equal(escapeSqlLike("10%_\\_x"),"10\\%\\_\\\\\\_x");
});
test("opaque keyset cursors round trip with full precision",()=>{
 const date=new Date("2026-10-21T12:10:30.124Z");
 const raw=encodeHistoryCursor({updatedAt:date,id});
 const parsed=decodeHistoryCursor(raw);
 assert.deepEqual(parsed,{updatedAt:date,id});
 assert.deepEqual(parseHistoryQuery(origin+"?cursor="+encodeURIComponent(raw)).cursor,parsed);
});
test("invalid, overlong or malformed cursors fail closed",()=>{
 for(const raw of ["","!!!","x".repeat(257),Buffer.from("{}").toString("base64url"),
   Buffer.from(JSON.stringify({t:"invalid",id})).toString("base64url"),
   Buffer.from(JSON.stringify({t:"2026-10-21T12:10:30.124Z",id:"not-a-uuid"})).toString("base64url")]){
  assert.throws(()=>decodeHistoryCursor(raw));
 }
});

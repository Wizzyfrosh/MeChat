import {test} from "node:test";
import assert from "node:assert/strict";
import {MAX_CHAT_REQUEST_BYTES,MAX_CONTEXT_CHARACTERS,MAX_CONTEXT_MESSAGE_CHARACTERS,
 readBoundedChatJson,buildBoundedHistory} from "../src/lib/chat-safety.mjs";
const post=(body,type="application/json")=>new Request("https://mechat.example/api/chat",{
 method:"POST",headers:{"Content-Type":type},body
});
const row=(requestId,role,content,status="complete")=>({requestId,role,content,status});

test("accepts valid small JSON requests",async()=>{
 const request={content:"Hello",requestId:"11111111-1111-4111-8111-111111111111"};
 assert.deepEqual(await readBoundedChatJson(post(JSON.stringify(request))),{ok:true,value:request});
});
test("rejects incorrect content type",async()=>{
 const result=await readBoundedChatJson(post("content=hi","application/x-www-form-urlencoded"));
 assert.equal(result.ok,false);assert.equal(result.status,415);
});
test("rejects oversized bodies without trusting content length",async()=>{
 const result=await readBoundedChatJson(post("x".repeat(MAX_CHAT_REQUEST_BYTES+1)));
 assert.equal(result.ok,false);assert.equal(result.status,413);
});
test("rejects oversized declared content length",async()=>{
 const request=post("{}");
 request.headers.set("Content-Length",String(MAX_CHAT_REQUEST_BYTES+1));
 assert.equal((await readBoundedChatJson(request)).status,413);
});
test("rejects malformed JSON and invalid UTF-8",async()=>{
 assert.equal((await readBoundedChatJson(post("{oops"))).status,400);
 assert.equal((await readBoundedChatJson(post(new Uint8Array([0xff])))).status,400);
});
test("accepts application/json with a charset parameter",async()=>{
 assert.equal((await readBoundedChatJson(post('{"content":"ok"}',"application/json; charset=utf-8"))).ok,true);
});
test("keeps only matched successful assistant and user pairs",()=>{
 const input=[
  row("a","user","Question A"),row("a","assistant","Answer A"),
  row("b","user","Question B"),row("b","assistant","Partial","interrupted"),
  row("c","user","Question C"),row("c","assistant","Answer C"),
  row("d","assistant","Orphan"),row("e","user","Unanswered"),
  row("f","user","Failure"),row("f","assistant","Error","failed"),
 ];
 assert.deepEqual(buildBoundedHistory(input),[
  {role:"user",content:"Question A"},{role:"assistant",content:"Answer A"},
  {role:"user",content:"Question C"},{role:"assistant",content:"Answer C"}
 ]);
});
test("enforces per-message and cumulative context limits",()=>{
 const input=Array.from({length:12},(_,index)=>[
  row(String(index),"user","q".repeat(MAX_CONTEXT_MESSAGE_CHARACTERS)),
  row(String(index),"assistant","a".repeat(MAX_CONTEXT_MESSAGE_CHARACTERS*4))
 ]).flat();
 const output=buildBoundedHistory(input);
 assert.equal(output.length,4);
 assert.ok(output.reduce((total,item)=>total+item.content.length,0)<=MAX_CONTEXT_CHARACTERS);
 assert.ok(output.every(item=>item.content.length<=MAX_CONTEXT_MESSAGE_CHARACTERS));
 assert.deepEqual(output.map(item=>item.role),["user","assistant","user","assistant"]);
});
test("ignores empty user content and invalid content types",()=>{
 assert.deepEqual(buildBoundedHistory([
  row("a","user"," "),row("a","assistant","Cannot pair"),
  {requestId:"b",role:"user",content:null,status:"complete"},
  row("b","assistant","Cannot pair")
 ]),[]);
});
test("does not break turn integrity to fit an old response",()=>{
 const input=[
  row("a","user","a".repeat(6000)),row("a","assistant","b".repeat(6000)),
  row("b","user","c".repeat(6000)),row("b","assistant","d".repeat(6000)),
  row("c","user","e".repeat(6000)),row("c","assistant","f".repeat(6000))
 ];
 const output=buildBoundedHistory(input);
 assert.equal(output.length,4);
 assert.equal(output[0].content[0],"c");
});

test("route-specific JSON limits reject oversized rename payloads",async()=>{
 const data=JSON.stringify({title:"x".repeat(2048)});
 const result=await readBoundedChatJson(post(data),2048);
 assert.equal(result.ok,false);
 assert.equal(result.status,413);
 const accepted=await readBoundedChatJson(post('{"title":"Safe title"}'),2048);
 assert.equal(accepted.ok,true);
});
test("invalid bounded-parser configuration fails closed",async()=>{
 await assert.rejects(()=>readBoundedChatJson(post("{}"),MAX_CHAT_REQUEST_BYTES+1),RangeError);
 await assert.rejects(()=>readBoundedChatJson(post("{}"),0),RangeError);
});

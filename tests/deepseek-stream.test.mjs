import { test } from "node:test";
import assert from "node:assert/strict";
import { DeepSeekStreamAccumulator } from "../src/lib/deepseek-stream.mjs";

const frame=(data)=>`data: ${JSON.stringify(data)}\n\n`;
const delta=(content,finish_reason=null)=>({choices:[{delta:{content},finish_reason}],usage:null});

test("streams split UTF-8 and SSE boundaries without losing text",()=>{
 const parser=new DeepSeekStreamAccumulator();
 const bytes=new TextEncoder().encode(frame(delta("Hello 🌍"))+frame(delta("", "stop"))+"data: [DONE]\n\n");
 let out=[];
 for(let i=0;i<bytes.length;i+=3)out.push(...parser.feed(bytes.slice(i,i+3)));
 assert.equal(out.join(""),"Hello 🌍");
 assert.equal(parser.answer,"Hello 🌍");
 assert.equal(parser.complete,true);
});

test("reads DeepSeek usage-only final chunk",()=>{
 const parser=new DeepSeekStreamAccumulator();
 parser.feed(frame(delta("ok")));
 parser.feed(frame(delta("", "stop")));
 parser.feed(frame({choices:[],usage:{prompt_tokens:20,completion_tokens:3}}));
 parser.feed("data: [DONE]\n\n");
 assert.equal(parser.complete,true);
 assert.deepEqual(parser.usage,{prompt_tokens:20,completion_tokens:3});
});

test("closed connection without DONE must never be successful",()=>{
 const parser=new DeepSeekStreamAccumulator();
 parser.feed(frame(delta("partial"))+frame(delta("", "stop")));
 assert.equal(parser.complete,false);
});

test("length-truncated response must not be marked complete",()=>{
 const parser=new DeepSeekStreamAccumulator();
 parser.feed(frame(delta("partial", "length"))+"data: [DONE]\n\n");
 assert.equal(parser.complete,false);
});

test("empty answer does not count as success",()=>{
 const parser=new DeepSeekStreamAccumulator();
 parser.feed(frame(delta("", "stop"))+"data: [DONE]\n\n");
 assert.equal(parser.complete,false);
});

test("output cap is enforced across chunks",()=>{
 const parser=new DeepSeekStreamAccumulator(4);
 parser.feed(frame(delta("abc")));
 parser.feed(frame(delta("def")));
 assert.equal(parser.overflow,true);
 assert.equal(parser.complete,false);
 assert.equal(parser.answer,"abc");
});

test("malformed event prevents falsely claiming full answer",()=>{
 const parser=new DeepSeekStreamAccumulator();
 parser.feed("data: {invalid}\n\n"+frame(delta("okay","stop"))+"data: [DONE]\n\n");
 assert.equal(parser.malformed,true);
 assert.equal(parser.complete,false);
});

test("handles CRLF event delimiters",()=>{
 const parser=new DeepSeekStreamAccumulator();
 parser.feed(frame(delta("yes","stop")).replaceAll("\n","\r\n")+"data: [DONE]\r\n\r\n");
 assert.equal(parser.answer,"yes");
 assert.equal(parser.complete,true);
});

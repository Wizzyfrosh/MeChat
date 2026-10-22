import {test} from "node:test";
import assert from "node:assert/strict";
import {providerAttempts,shouldAutoTryNext} from "../src/lib/ai-provider-routing.mjs";
test("auto only uses the three free adapters, in defined order",()=>{
 assert.deepEqual(providerAttempts("auto",["openrouter","deepseek","gemini","groq"]),["groq","gemini","openrouter"]);
 assert.deepEqual(providerAttempts("auto",["deepseek"]),[]);
});
test("manual providers never silently switch",()=>{
 assert.deepEqual(providerAttempts("gemini",["groq","gemini"]),["gemini"]);
 assert.deepEqual(providerAttempts("deepseek",["deepseek","groq"]),["deepseek"]);
 assert.deepEqual(providerAttempts("groq",["gemini"]),[]);
});
test("unknown providers are rejected",()=>{
 assert.deepEqual(providerAttempts("not-a-model",["groq"]),[]);
 assert.deepEqual(providerAttempts("",["groq"]),[]);
});
test("only auto may retry eligible provider responses",()=>{
 for(const s of [402,408,429,500,502,503,504])assert.equal(shouldAutoTryNext("auto",s),true);
 for(const s of [400,401,403,404,422])assert.equal(shouldAutoTryNext("auto",s),false);
 assert.equal(shouldAutoTryNext("groq",503),false);
});
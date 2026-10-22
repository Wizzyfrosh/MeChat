import {test} from "node:test";
import assert from "node:assert/strict";
import {REQUIRED_TABLES,schemaIsReady} from "../src/lib/schema-readiness.mjs";
test("readiness passes for all 9 application tables, regardless of order",()=>{
 assert.equal(REQUIRED_TABLES.length,9);
 assert.equal(schemaIsReady([...REQUIRED_TABLES].reverse()),true);
});
test("readiness fails closed on empty or missing schema",()=>{
 assert.equal(schemaIsReady([]),false);
 assert.equal(schemaIsReady(REQUIRED_TABLES.slice(0,8)),false);
 assert.equal(schemaIsReady(null),false);
});
test("duplicates, unexpected tables and non-string rows cannot satisfy readiness",()=>{
 assert.equal(schemaIsReady([...REQUIRED_TABLES.slice(0,8),REQUIRED_TABLES[0]]),false);
 assert.equal(schemaIsReady([...REQUIRED_TABLES.slice(0,8),"unrelated"]),false);
 assert.equal(schemaIsReady([...REQUIRED_TABLES.slice(0,8),null]),false);
});

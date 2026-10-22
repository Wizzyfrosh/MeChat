import {test} from "node:test";
import assert from "node:assert/strict";
import {getWebShortcut} from "../src/lib/web-shortcuts.mjs";

test("desktop macOS and Windows/Linux shortcuts work",()=>{
 assert.equal(getWebShortcut({key:"k",metaKey:true}),"search");
 assert.equal(getWebShortcut({key:"K",ctrlKey:true}),"search");
 assert.equal(getWebShortcut({key:"o",ctrlKey:true,shiftKey:true}),"new-chat");
 assert.equal(getWebShortcut({key:"O",metaKey:true,shiftKey:true}),"new-chat");
});
test("dismiss supports Escape without a modifier",()=>{
 assert.equal(getWebShortcut({key:"Escape"}),"dismiss");
});
test("normal typing, repeats and IME input are ignored",()=>{
 for (const event of [
  {key:"k"},{key:"o",shiftKey:true},{key:"k",ctrlKey:true,shiftKey:true},
  {key:"k",ctrlKey:true,altKey:true},{key:"k",ctrlKey:true,repeat:true},
  {key:"o",metaKey:true,shiftKey:true,isComposing:true}
 ]) assert.equal(getWebShortcut(event),null);
});

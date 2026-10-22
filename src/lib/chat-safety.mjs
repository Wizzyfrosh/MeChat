/**
 * Pure request and context safety helpers for MeChat.
 * This module runs on the Node.js test runner without database/API credentials.
 */
export const MAX_CHAT_REQUEST_BYTES = 32_768;
export const MAX_CONTEXT_CHARACTERS = 24_000;
export const MAX_CONTEXT_MESSAGE_CHARACTERS = 6_000;

const failure=(status,error)=>({ok:false,status,error});

/** Never trust Content-Length: also enforce the size while reading the stream. */
export async function readBoundedChatJson(request,maxBytes=MAX_CHAT_REQUEST_BYTES) {
  if(!Number.isSafeInteger(maxBytes)||maxBytes<1||maxBytes>MAX_CHAT_REQUEST_BYTES) throw new RangeError("Invalid request size cap.");
  const type=request.headers.get("content-type")?.trim() ?? "";
  if (!/^application\/json(?:\s*;|$)/i.test(type)) {
    return failure(415,"Send messages using application/json.");
  }
  const declared=request.headers.get("content-length");
  if (declared!==null && (!/^\d+$/.test(declared) || Number(declared)>maxBytes)) {
    return failure(413,"Message request is too large.");
  }
  if (!request.body) return failure(400,"A JSON message body is required.");

  const reader=request.body.getReader();
  const chunks=[];
  let total=0;
  try {
    while (true) {
      const {value,done}=await reader.read();
      if (done) break;
      total+=value.byteLength;
      if (total>maxBytes) {
        await reader.cancel().catch(()=>{});
        return failure(413,"Message request is too large.");
      }
      chunks.push(value);
    }
    const bytes=new Uint8Array(total);
    let offset=0;
    for (const chunk of chunks) {
      bytes.set(chunk,offset);
      offset+=chunk.byteLength;
    }
    return {ok:true,value:JSON.parse(new TextDecoder("utf-8",{fatal:true}).decode(bytes))};
  } catch {
    return failure(400,"Invalid JSON message body.");
  } finally {
    reader.releaseLock();
  }
}

/**
 * Build a bounded, clean assistant prompt history from chronological DB rows.
 * Failed/interrupted/pending turns and unmatched user requests must NOT be
 * sent back to providers as if the assistant successfully responded.
 */
export function buildBoundedHistory(rows) {
  const users=new Map();
  const pairs=[];
  for (const row of rows) {
    if (!row || typeof row.requestId!=="string" || typeof row.content!=="string") continue;
    const content=row.content.trim().slice(0,MAX_CONTEXT_MESSAGE_CHARACTERS);
    if (row.role==="user") {
      if (row.status==="complete" && content) users.set(row.requestId,content);
    } else if (row.role==="assistant") {
      const user=users.get(row.requestId);
      users.delete(row.requestId);
      if (user && row.status==="complete" && content) {
        pairs.push([{role:"user",content:user},{role:"assistant",content}]);
      }
    }
  }
  const selected=[];
  let remaining=MAX_CONTEXT_CHARACTERS;
  for (let i=pairs.length-1;i>=0;i--) {
    const pair=pairs[i];
    const cost=pair[0].content.length+pair[1].content.length;
    if (cost>remaining) break;
    remaining-=cost;
    selected.unshift(...pair);
  }
  return selected;
}

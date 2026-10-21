/**
 * Pure, bounded history search parameters and opaque keyset pagination.
 * Cursors encode a timestamp and ID only; ownership is ALWAYS checked in SQL.
 */
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export const HISTORY_PAGE_SIZE=25;
export const HISTORY_MAX_PAGE_SIZE=50;
export const HISTORY_MAX_QUERY=100;
export const HISTORY_MAX_CURSOR=256;
export function escapeSqlLike(value){
 return value.replace(/[\\%_]/g, ch=>"\\"+ch);
}
export function encodeHistoryCursor(value){
 return Buffer.from(JSON.stringify({t:value.updatedAt.toISOString(),id:value.id}),"utf8").toString("base64url");
}
export function decodeHistoryCursor(raw){
 if(!raw||raw.length>HISTORY_MAX_CURSOR||!/^[A-Za-z0-9_-]+$/.test(raw))throw new Error("Invalid history cursor.");
 try{
  const data=JSON.parse(Buffer.from(raw,"base64url").toString("utf8"));
  if(!data||typeof data.t!=="string"||typeof data.id!=="string"||!UUID.test(data.id))throw Error();
  const when=new Date(data.t);
  if(!Number.isFinite(when.getTime())||when.toISOString()!==data.t)throw Error();
  return {updatedAt:when,id:data.id};
 }catch{throw new Error("Invalid history cursor.");}
}
export function parseHistoryQuery(url){
 const params=new URL(url).searchParams;
 const q=(params.get("q")??"").trim();
 if(q.length>HISTORY_MAX_QUERY)throw new Error("Search must be 100 characters or fewer.");
 const rawLimit=params.get("limit");
 if(rawLimit!==null&&!/^\d{1,2}$/.test(rawLimit))throw new Error("Invalid page size.");
 const limit=rawLimit===null?HISTORY_PAGE_SIZE:Number(rawLimit);
 if(limit<1||limit>HISTORY_MAX_PAGE_SIZE)throw new Error("Page size must be between 1 and 50.");
 const cursor=params.get("cursor");
 return {q,limit,cursor:cursor===null?null:decodeHistoryCursor(cursor)};
}

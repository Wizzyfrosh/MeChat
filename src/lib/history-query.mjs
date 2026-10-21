export function normalizeHistorySearch(raw){
 if(typeof raw!=="string")return "";
 return raw.trim().replace(/\s+/g," ").slice(0,100);
}
export function escapeLike(raw){return raw.replace(/[\\%_]/g,"\\$&");}
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export function encodeHistoryCursor(row){
 const time=row.updatedAt instanceof Date?row.updatedAt.toISOString():row.updatedAt;
 if(typeof time!=="string"||!Number.isFinite(Date.parse(time))||!uuid.test(row.id))throw Error("Invalid pagination item");
 return Buffer.from(JSON.stringify([time,row.id])).toString("base64url");
}
export function decodeHistoryCursor(raw){
 if(typeof raw!=="string"||raw.length>180||!raw)return null;
 try{
  const data=JSON.parse(Buffer.from(raw,"base64url").toString("utf8"));
  if(!Array.isArray(data)||data.length!==2||typeof data[0]!=="string"||typeof data[1]!=="string"||!uuid.test(data[1]))return null;
  const time=new Date(data[0]);
  if(!Number.isFinite(time.getTime())||time.getUTCFullYear()<2020||time.getUTCFullYear()>2100)return null;
  return {updatedAt:time,id:data[1]};
 }catch{return null}
}

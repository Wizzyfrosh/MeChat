/**
 * Bounds and escapes server-side conversation search.
 * PostgreSQL LIKE wildcards must be escaped so user text stays literal.
 */
export function escapeSqlLike(value){
 return value.replace(/[\\%_]/g, ch=>"\\"+ch);
}
export function parseHistoryParams(params){
 const rawQuery=params.get("q")??"";
 const q=rawQuery.trim();
 const rawLimit=params.get("limit"),rawOffset=params.get("offset");
 if(q.length>100)return {error:"Search must be 100 characters or fewer."};
 if(rawLimit!==null&&!/^[0-9]{1,3}$/.test(rawLimit))return {error:"Invalid page size."};
 if(rawOffset!==null&&!/^[0-9]{1,6}$/.test(rawOffset))return {error:"Invalid pagination offset."};
 const limit=rawLimit===null?50:Number(rawLimit);
 const offset=rawOffset===null?0:Number(rawOffset);
 if(!Number.isInteger(limit)||limit<1||limit>80)return {error:"Page size must be between 1 and 80."};
 if(!Number.isInteger(offset)||offset<0||offset>10000)return {error:"Invalid pagination offset."};
 return {q,limit,offset};
}

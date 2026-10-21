/** Bounded, deterministic conversation searches with literal LIKE matching. */
export function parseHistoryQuery(url) {
  const query = new URL(url).searchParams;
  const search = (query.get("q") ?? "").trim();
  if (search.length > 100) throw new Error("Search must be 100 characters or shorter.");
  const rawLimit=query.get("limit"), rawOffset=query.get("offset");
  if(rawLimit!==null && !/^\d{1,3}$/.test(rawLimit))throw new Error("Invalid page size.");
  if(rawOffset!==null && !/^\d{1,6}$/.test(rawOffset))throw new Error("Invalid page offset.");
  const limit=rawLimit===null?25:Number(rawLimit);
  const offset=rawOffset===null?0:Number(rawOffset);
  if(limit<1||limit>50)throw new Error("Page size must be between 1 and 50.");
  if(offset<0||offset>10000)throw new Error("Page offset is too large.");
  return {search,limit,offset};
}
export function literalLikePattern(value){
  return "%" + value.replace(/[\\%_]/g, "\\$&") + "%";
}

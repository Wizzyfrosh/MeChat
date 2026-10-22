/** A public health response must require all application-owned tables, not merely a DB socket. */
export const REQUIRED_TABLES=Object.freeze([
  "user","session","account","verification",
  "conversations","messages","user_settings","usage_events","ai_daily_quotas"
]);
/** Strictly accept a complete unique set, disallow duplicates and unexpected names. */
export function schemaIsReady(names){
  if(!Array.isArray(names)||names.length!==REQUIRED_TABLES.length)return false;
  if(!names.every(name=>typeof name==="string"))return false;
  const actual=new Set(names);
  return actual.size===REQUIRED_TABLES.length &&
    REQUIRED_TABLES.every(name=>actual.has(name));
}

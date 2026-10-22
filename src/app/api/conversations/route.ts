import {and,desc,eq,exists,ilike,lt,or} from "drizzle-orm";
import {conversations,messages} from "@/db/schema";
import {getDatabase} from "@/db/client";
import {getUserSession} from "@/lib/session";
import {encodeHistoryCursor,escapeSqlLike,parseHistoryQuery} from "@/lib/history-query.mjs";
import {isSameOriginWrite} from "@/lib/request-security.mjs";

export const runtime="nodejs";
export const dynamic="force-dynamic";

export async function GET(req:Request){
 const session=await getUserSession();
 if(!session)return Response.json({error:"Unauthorized"},{status:401,headers:{"Cache-Control":"no-store"}});
 let input:ReturnType<typeof parseHistoryQuery>;
 try{input=parseHistoryQuery(req.url)}catch(e){
  return Response.json({error:e instanceof Error?e.message:"Invalid history query."},{status:400,headers:{"Cache-Control":"no-store"}});
 }
 try{
  const db=getDatabase();
  const pattern="%"+escapeSqlLike(input.q)+"%";
  const search=input.q ? or(
   ilike(conversations.title,pattern),
   exists(db.select({id:messages.id}).from(messages)
    .where(and(eq(messages.conversationId,conversations.id),ilike(messages.content,pattern))).limit(1))
  ):undefined;
  const older=input.cursor?or(
   lt(conversations.updatedAt,input.cursor.updatedAt),
   and(eq(conversations.updatedAt,input.cursor.updatedAt),lt(conversations.id,input.cursor.id))
  ):undefined;
  const list=await db.select({id:conversations.id,title:conversations.title,updatedAt:conversations.updatedAt})
   .from(conversations)
   .where(and(eq(conversations.userId,session.user.id),search,older))
   .orderBy(desc(conversations.updatedAt),desc(conversations.id)).limit(input.limit+1);
  const hasMore=list.length>input.limit;
  const rows=hasMore?list.slice(0,input.limit):list;
  const last=rows.at(-1);
  return Response.json({
   conversations:rows,
   nextCursor:hasMore&&last?encodeHistoryCursor(last):null,
   hasMore,
  },{headers:{"Cache-Control":"private, no-store","X-Robots-Tag":"noindex"}});
 }catch{
  return Response.json({error:"Unable to load conversations"},{status:503,headers:{"Cache-Control":"no-store"}});
 }
}

export async function POST(req:Request){
 const session=await getUserSession();
 if(!session)return Response.json({error:"Unauthorized"},{status:401});
 if(!isSameOriginWrite(req))return Response.json({error:"Invalid origin"},{status:403,headers:{"Cache-Control":"no-store"}});
 try{
  const row=await getDatabase().insert(conversations).values({userId:session.user.id}).returning({id:conversations.id,title:conversations.title,updatedAt:conversations.updatedAt});
  return Response.json({conversation:row[0]},{status:201,headers:{"Cache-Control":"no-store"}});
 }catch{return Response.json({error:"Unable to create conversation"},{status:503})}
}

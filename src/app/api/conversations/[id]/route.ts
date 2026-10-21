import { and, asc, desc, eq } from "drizzle-orm";
import { conversations, messages } from "@/db/schema";
import { getDatabase } from "@/db/client";
import { getUserSession } from "@/lib/session";
export const runtime="nodejs";
type Ctx={params:Promise<{id:string}>};
const isUuid=(s:string)=>/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(s);
async function owner(ctx:Ctx){
 const session=await getUserSession();
 const {id}=await ctx.params;
 if(!session||!isUuid(id))return {session:null,id};
 return {session,id};
}
export async function GET(_req:Request,ctx:Ctx){
 const {session,id}=await owner(ctx);
 if(!session)return Response.json({error:"Unauthorized"},{status:401});
 try{
  const db=getDatabase();
  const [row]=await db.select().from(conversations).where(and(eq(conversations.id,id),eq(conversations.userId,session.user.id))).limit(1);
  if(!row)return Response.json({error:"Conversation not found"},{status:404});
  const content=(await db.select({id:messages.id,role:messages.role,content:messages.content,status:messages.status,createdAt:messages.createdAt,provider:messages.provider,modelId:messages.modelId}).from(messages).where(eq(messages.conversationId,id)).orderBy(desc(messages.createdAt),desc(messages.requestId),asc(messages.role)).limit(250)).reverse();
  return Response.json({conversation:row,messages:content},{headers:{"Cache-Control":"no-store"}});
 }catch{return Response.json({error:"Unable to load conversation"},{status:503})}
}
export async function PATCH(req:Request,ctx:Ctx){
 const {session,id}=await owner(ctx);
 if(!session)return Response.json({error:"Unauthorized"},{status:401});
 if(req.headers.get("origin")&&req.headers.get("origin")!==new URL(req.url).origin)return Response.json({error:"Invalid origin"},{status:403});
 const body=await req.json().catch(()=>null);
 if(typeof body?.title!=="string"||!body.title.trim()||body.title.length>160)return Response.json({error:"Invalid title"},{status:400});
 try{
 const [row]=await getDatabase().update(conversations).set({title:body.title.trim(),updatedAt:new Date()}).where(and(eq(conversations.id,id),eq(conversations.userId,session.user.id))).returning({id:conversations.id,title:conversations.title,updatedAt:conversations.updatedAt});
 if(!row)return Response.json({error:"Conversation not found"},{status:404});
 return Response.json({conversation:row});
 }catch{return Response.json({error:"Unable to rename conversation"},{status:503})}
}
export async function DELETE(req:Request,ctx:Ctx){
 const {session,id}=await owner(ctx);
 if(!session)return Response.json({error:"Unauthorized"},{status:401});
 if(req.headers.get("origin")&&req.headers.get("origin")!==new URL(req.url).origin)return Response.json({error:"Invalid origin"},{status:403});
 try{
  const [row]=await getDatabase().delete(conversations).where(and(eq(conversations.id,id),eq(conversations.userId,session.user.id))).returning({id:conversations.id});
  if(!row)return Response.json({error:"Conversation not found"},{status:404});
  return new Response(null,{status:204});
 }catch{return Response.json({error:"Unable to delete conversation"},{status:503})}
}

import {and,eq} from "drizzle-orm";
import {getUserSession} from "@/lib/session";
import {getDatabase} from "@/db/client";
import {conversations} from "@/db/schema";
import {streamChatExport} from "@/lib/data-export";

export const runtime="nodejs";
export const dynamic="force-dynamic";
export const maxDuration=60;
type Ctx={params:Promise<{id:string}>};
const validUuid=(s:string)=>/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(s);

export async function GET(req:Request,ctx:Ctx){
 const session=await getUserSession();
 if(!session||!session.user.emailVerified)return Response.json({error:"Unauthorized"},{status:401,headers:{"Cache-Control":"no-store"}});
 const {id}=await ctx.params;
 if(!validUuid(id))return Response.json({error:"Invalid conversation."},{status:400});
 const format=new URL(req.url).searchParams.get("format")??"markdown";
 if(format!=="json"&&format!=="markdown")return Response.json({error:"Unsupported export format."},{status:400});
 try{
  const [row]=await getDatabase().select({id:conversations.id}).from(conversations)
   .where(and(eq(conversations.id,id),eq(conversations.userId,session.user.id))).limit(1);
  if(!row)return Response.json({error:"Conversation not found."},{status:404});
  return streamChatExport({
   user:{id:session.user.id,email:session.user.email,name:session.user.name},
   conversationId:id,format,signal:req.signal
  });
 }catch{return Response.json({error:"Unable to export the conversation."},{status:503,headers:{"Cache-Control":"no-store"}})}
}

import { desc, eq } from "drizzle-orm";
import { conversations } from "@/db/schema";
import { getDatabase } from "@/db/client";
import { getUserSession } from "@/lib/session";
export const runtime="nodejs";
export async function GET(){
 const session=await getUserSession();
 if(!session)return Response.json({error:"Unauthorized"},{status:401});
 try{
   const rows=await getDatabase().select({
     id:conversations.id,title:conversations.title,updatedAt:conversations.updatedAt
   }).from(conversations).where(eq(conversations.userId,session.user.id)).orderBy(desc(conversations.updatedAt)).limit(80);
   return Response.json({conversations:rows},{headers:{"Cache-Control":"no-store"}});
 }catch{return Response.json({error:"Unable to load conversations"},{status:503})}
}
export async function POST(req:Request){
 const session=await getUserSession();
 if(!session)return Response.json({error:"Unauthorized"},{status:401});
 if(req.headers.get("origin")&&req.headers.get("origin")!==new URL(req.url).origin)return Response.json({error:"Invalid origin"},{status:403});
 try{
  const row=await getDatabase().insert(conversations).values({userId:session.user.id}).returning({id:conversations.id,title:conversations.title,updatedAt:conversations.updatedAt});
  return Response.json({conversation:row[0]},{status:201});
 }catch{return Response.json({error:"Unable to create conversation"},{status:503})}
}

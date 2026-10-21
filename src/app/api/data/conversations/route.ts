import {eq} from "drizzle-orm";
import {getUserSession} from "@/lib/session";
import {getDatabase} from "@/db/client";
import {conversations} from "@/db/schema";

export const runtime="nodejs";
export const dynamic="force-dynamic";

/**
 * Clear account conversation history only; does not close the account or
 * purge the independently retained, content-free usage accounting rows.
 */
export async function DELETE(req:Request){
 const session=await getUserSession();
 if(!session||!session.user.emailVerified)return Response.json({error:"Unauthorized"},{status:401,headers:{"Cache-Control":"no-store"}});
 const origin=req.headers.get("origin");
 if(!origin||origin!==new URL(req.url).origin)return Response.json({error:"Invalid origin."},{status:403});
 if(req.headers.get("content-type")?.split(";")[0]?.trim()!=="application/json")return Response.json({error:"Expected JSON."},{status:415});
 const raw=await req.text();
 if(raw.length>1000)return Response.json({error:"Invalid confirmation."},{status:400});
 let body:unknown;
 try{body=JSON.parse(raw)}catch{return Response.json({error:"Invalid JSON."},{status:400})}
 if(!body||typeof body!=="object"||!("confirmation" in body)||body.confirmation!=="DELETE ALL CHATS")
  return Response.json({error:"Confirmation phrase does not match."},{status:400});
 try{
  await getDatabase().delete(conversations).where(eq(conversations.userId,session.user.id));
  return Response.json({ok:true},{headers:{"Cache-Control":"no-store"}});
 }catch{return Response.json({error:"Unable to delete conversations."},{status:503,headers:{"Cache-Control":"no-store"}})}
}

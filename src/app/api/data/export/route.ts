import {getUserSession} from "@/lib/session";
import {streamChatExport} from "@/lib/data-export";

export const runtime="nodejs";
export const dynamic="force-dynamic";
export const maxDuration=60;

/** Export every account-owned chat and its messages as streamed JSON. */
export async function GET(req:Request){
 const session=await getUserSession();
 if(!session||!session.user.emailVerified)return Response.json({error:"Unauthorized"},{status:401,headers:{"Cache-Control":"no-store"}});
 return streamChatExport({
  user:{id:session.user.id,email:session.user.email,name:session.user.name},
  format:"json",signal:req.signal
 });
}

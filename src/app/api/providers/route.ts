import {getUserSession} from "@/lib/session";
import {getProviderDirectory} from "@/lib/ai-providers";
export const runtime="nodejs";
export const dynamic="force-dynamic";

export async function GET(){
 const session=await getUserSession();
 if(!session||!session.user.emailVerified)return Response.json({error:"Sign in to view AI providers."},{status:401});
 const directory=await getProviderDirectory();
 return Response.json(directory,{headers:{"Cache-Control":"private, no-store","X-Robots-Tag":"noindex"}});
}

import {eq} from "drizzle-orm";
import {getDatabase} from "@/db/client";
import {userSettings} from "@/db/schema";
import {getUserSession} from "@/lib/session";
import {DEFAULT_PREFERENCES,parsePreferencePatch} from "@/lib/user-preferences.mjs";
import {readBoundedChatJson} from "@/lib/chat-safety.mjs";

export const runtime="nodejs";
export const dynamic="force-dynamic";
const headers={"Cache-Control":"private, no-store","X-Robots-Tag":"noindex"};

export async function GET(){
 const session=await getUserSession();
 if(!session||!session.user.emailVerified)
  return Response.json({error:"Unauthorized."},{status:401,headers});
 try{
  const [row]=await getDatabase().select({
   theme:userSettings.theme,responseStyle:userSettings.responseStyle
  }).from(userSettings).where(eq(userSettings.userId,session.user.id)).limit(1);
  // Existing database enum has a "system" value from the initial schema. When
  // encountered, normalize it for the currently supported Light/Dark UI.
  const settings=row?{
   theme:row.theme==="dark"?"dark":"light",
   responseStyle:row.responseStyle
  }:DEFAULT_PREFERENCES;
  return Response.json({settings},{headers});
 }catch{
  return Response.json({error:"Unable to load account settings."},{status:503,headers});
 }
}

export async function PATCH(req:Request){
 const session=await getUserSession();
 if(!session||!session.user.emailVerified)
  return Response.json({error:"Unauthorized."},{status:401,headers});
 if(req.headers.get("origin")!==new URL(req.url).origin)
  return Response.json({error:"Invalid origin."},{status:403,headers});
 const parsed=await readBoundedChatJson(req);
 if(!parsed.ok)return Response.json({error:parsed.error},{status:parsed.status,headers});
 const result=parsePreferencePatch(parsed.value);
 if(!result.ok)return Response.json({error:result.error},{status:400,headers});
 try{
  const now=new Date();
  const [saved]=await getDatabase().insert(userSettings)
   .values({userId:session.user.id,...result.patch,updatedAt:now})
   .onConflictDoUpdate({
    target:userSettings.userId,
    set:{...result.patch,updatedAt:now}
   })
   .returning({theme:userSettings.theme,responseStyle:userSettings.responseStyle});
  return Response.json({settings:{
   theme:saved.theme==="dark"?"dark":"light",
   responseStyle:saved.responseStyle
  }},{headers});
 }catch{
  return Response.json({error:"Unable to save account settings."},{status:503,headers});
 }
}

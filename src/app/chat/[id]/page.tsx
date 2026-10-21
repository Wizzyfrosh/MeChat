import { redirect } from "next/navigation";
import { getUserSession } from "@/lib/session";
import { ChatWorkspace } from "@/components/chat-workspace";
export const dynamic="force-dynamic";
export const metadata={title:"Conversation"};
export default async function ConversationPage({params}:{params:Promise<{id:string}>}){
 const session=await getUserSession();
 if(!session)redirect("/sign-in");
 const {id}=await params;
 if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id))redirect("/chat");
 return <ChatWorkspace user={{name:session.user.name,email:session.user.email}} initialConversationId={id}/>;
}

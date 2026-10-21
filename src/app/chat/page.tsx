import { redirect } from "next/navigation";
import { getUserSession } from "@/lib/session";
import { ChatWorkspace } from "@/components/chat-workspace";
export const dynamic="force-dynamic";
export const metadata={title:"MeChat — Your workspace"};
export default async function ChatPage(){
 const session=await getUserSession();
 if(!session)redirect("/sign-in");
 return <ChatWorkspace user={{name:session.user.name,email:session.user.email}}/>;
}

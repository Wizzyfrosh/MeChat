import { redirect } from "next/navigation";
import { getUserSession } from "@/lib/session";
export const dynamic="force-dynamic";
export default async function Index(){
 const session=await getUserSession();
 redirect(session?"/chat":"/sign-in");
}

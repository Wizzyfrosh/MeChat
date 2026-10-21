import { AuthFlow } from "@/components/auth-flow";
import { isAuthConfigured } from "@/lib/auth";
export const metadata={title:"Reset password"};
export const dynamic="force-dynamic";
export default function ResetPassword(){return <AuthFlow mode="recover" enabled={isAuthConfigured()}/>}
import { AuthFlow } from "@/components/auth-flow";
import { isAuthConfigured } from "@/lib/auth";
export const metadata={title:"Verify email"};
export const dynamic="force-dynamic";
export default function VerifyEmail(){return <AuthFlow mode="verify" enabled={isAuthConfigured()}/>}
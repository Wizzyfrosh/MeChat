import { AuthFlow } from "@/components/auth-flow";
import { isAuthConfigured } from "@/lib/auth";
export const metadata={title:"Sign in"};
export const dynamic="force-dynamic";
export default function SignIn(){return <AuthFlow mode="login" enabled={isAuthConfigured()}/>}
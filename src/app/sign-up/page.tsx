import { AuthFlow } from "@/components/auth-flow";
import { isAuthConfigured } from "@/lib/auth";
export const metadata={title:"Create account"};
export const dynamic="force-dynamic";
export default function SignUp(){return <AuthFlow mode="register" enabled={isAuthConfigured()}/>}
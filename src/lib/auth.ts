import "server-only";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { emailOTP } from "better-auth/plugins";
import { getDatabase } from "@/db/client";
import * as applicationSchema from "@/db/schema";
import * as authSchema from "@/db/auth-schema";
import { sendOtpEmail } from "@/lib/mail";
import { authAllowedHosts } from "@/lib/auth-hosts.mjs";

export function isAuthConfigured(){
 return Boolean(process.env.DATABASE_URL && process.env.BETTER_AUTH_SECRET && process.env.BREVO_API_KEY && process.env.BREVO_SENDER_EMAIL && process.env.BETTER_AUTH_URL);
}
function buildAuth(){
 return betterAuth({
    baseURL:process.env.BETTER_AUTH_URL!,
    trustedOrigins:authAllowedHosts(process.env).map(host=>
      host.startsWith("localhost:")||host.startsWith("127.0.0.1:")?`http://${host}`:`https://${host}`
    ),
    secret:process.env.BETTER_AUTH_SECRET!,
    database:drizzleAdapter(getDatabase(),{provider:"pg",schema:{...applicationSchema,...authSchema}}),
    emailAndPassword:{enabled:true,requireEmailVerification:true,minPasswordLength:8,maxPasswordLength:128},
    advanced:{cookiePrefix:"mechat",database:{joins:false}},
    rateLimit:{enabled:true,window:60,max:40},
    plugins:[emailOTP({
      otpLength:6,expiresIn:600,allowedAttempts:5,storeOTP:"hashed",sendVerificationOnSignUp:true,overrideDefaultEmailVerification:true,disableSignUp:true,
      async sendVerificationOTP({email,otp,type}){
        await sendOtpEmail(email,otp,type);
      },
    })],
   });
}
let cached: ReturnType<typeof buildAuth> | undefined;
export function getAuth(){
 if(!isAuthConfigured()) throw new Error("MeChat authentication environment is incomplete");
 return cached ?? (cached = buildAuth());
}

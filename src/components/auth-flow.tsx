"use client";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, CheckCircle2, Eye, EyeOff, LockKeyhole, Mail, ShieldCheck } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { MeChatLogo, MeChatSymbol } from "@/components/logo";

type Screen="login"|"register"|"verify"|"recover"|"reset";
export function AuthFlow({mode="login",enabled}:{mode?:Screen;enabled:boolean}){
 const router=useRouter();
 const [step,setStep]=useState<Screen>(mode);
 const [name,setName]=useState("");
 const [email,setEmail]=useState("");
 const [password,setPassword]=useState("");
 const [newPassword,setNewPassword]=useState("");
 const [code,setCode]=useState("");
 const [visible,setVisible]=useState(false);
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState("");
 const [success,setSuccess]=useState("");
 const title={login:"Welcome back",register:"Create your account",verify:"Check your inbox",recover:"Reset your password",reset:"Choose a new password"}[step];
 const subtitle={login:"Sign in to continue your conversations.",register:"Your space for ideas, questions, and better thinking.",verify:"Enter the six-digit verification code sent to your email.",recover:"We’ll send a verification code to your email address.",reset:"Use the code we sent and set a secure new password."}[step];
 const navigate=(next:Screen)=>{setStep(next);setError("");setSuccess("");};
 async function submit(event:FormEvent<HTMLFormElement>){
  event.preventDefault();if(!enabled||busy)return;
  setBusy(true);setError("");setSuccess("");
  try {
   const address=email.trim().toLowerCase();
   if(!address.includes("@"))throw new Error("Enter a valid email address.");
   if(step==="register"){
     if(name.trim().length<2)throw new Error("Enter your full name.");
     if(password.length<8)throw new Error("Use at least 8 characters for your password.");
     const result=await authClient.signUp.email({name:name.trim(),email:address,password});
     if(result.error)throw new Error(result.error.message||"Unable to create account.");
     navigate("verify");setSuccess("We sent a six-digit code to your email address.");
   } else if(step==="login"){
     const result=await authClient.signIn.email({email:address,password});
     if(result.error){
       if(result.error.code==="EMAIL_NOT_VERIFIED"||result.error.status===403){
         navigate("verify");setSuccess("Verify your email address to continue.");return;
       }
       throw new Error(result.error.message||"Invalid credentials.");
     }
     router.replace("/chat");router.refresh();
   } else if(step==="verify"){
     if(!/^\d{6}$/.test(code))throw new Error("Enter the complete six-digit code.");
     const result=await authClient.emailOtp.verifyEmail({email:address,otp:code});
     if(result.error)throw new Error(result.error.message||"Invalid or expired code.");
     navigate("login");setSuccess("Email verified. Sign in to continue.");
   } else if(step==="recover"){
     const result=await authClient.emailOtp.requestPasswordReset({email:address});
     if(result.error)throw new Error(result.error.message||"Could not send a reset code.");
     navigate("reset");setSuccess("If the account exists, a reset code has been sent.");
   } else if(step==="reset"){
     if(!/^\d{6}$/.test(code))throw new Error("Enter the complete six-digit code.");
     if(newPassword.length<8)throw new Error("Use at least 8 characters for your password.");
     const result=await authClient.emailOtp.resetPassword({email:address,otp:code,password:newPassword});
     if(result.error)throw new Error(result.error.message||"Could not reset password.");
     setPassword("");setNewPassword("");setCode("");
     navigate("login");setSuccess("Password updated. Sign in with your new password.");
   }
  }catch(e){setError(e instanceof Error?e.message:"Something went wrong. Please try again.");}
  finally{setBusy(false)}
 }
 async function resend(){
  if(!enabled||busy||!email.includes("@"))return;
  setBusy(true);setError("");setSuccess("");
  try {
    const r=await authClient.emailOtp.sendVerificationOtp({email:email.trim().toLowerCase(),type:"email-verification"});
    if(r.error)throw new Error(r.error.message||"Unable to send the code.");
    setSuccess("A fresh code has been sent.");
  }catch(e){setError(e instanceof Error?e.message:"Unable to resend code.");}
  finally{setBusy(false)}
 }
 return <main className="auth-layout">
  <section className="auth-main">
    <header className="auth-brand-row"><MeChatLogo/><span>Secure AI workspace</span></header>
    <div className="auth-form-container">
      <div className="auth-mark"><MeChatSymbol size={42}/></div>
      <p className="auth-eyebrow">YOUR THINKING SPACE</p>
      <h1>{title}</h1><p className="auth-subtitle">{subtitle}</p>
      {!enabled&&<div className="auth-alert auth-alert-warning" role="status"><LockKeyhole size={18}/> Account services are being configured. Registration and sign-in will be available once the secure backend is connected.</div>}
      {success&&<div className="auth-alert success" role="status"><CheckCircle2 size={18}/>{success}</div>}
      {error&&<div className="auth-alert error" role="alert">{error}</div>}
      <form onSubmit={submit} className="auth-form">
        {step==="register"&&<label className="field-label">Full name<input required autoComplete="name" value={name} onChange={e=>setName(e.target.value)} placeholder="Your name" maxLength={100}/></label>}
        <label className="field-label">Email address<div className="input-with-icon"><Mail size={18}/><input required type="email" autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com"/></div></label>
        {(step==="login"||step==="register")&&<label className="field-label">Password<div className="input-with-icon"><LockKeyhole size={18}/><input required type={visible?"text":"password"} autoComplete={step==="register"?"new-password":"current-password"} minLength={step==="register"?8:1} value={password} onChange={e=>setPassword(e.target.value)} placeholder={step==="register"?"At least 8 characters":"Enter your password"}/><button type="button" className="password-eye" onClick={()=>setVisible(!visible)} aria-label={visible?"Hide password":"Show password"}>{visible?<EyeOff size={18}/>:<Eye size={18}/>}</button></div></label>}
        {(step==="verify"||step==="reset")&&<label className="field-label">Verification code<input required inputMode="numeric" autoComplete="one-time-code" maxLength={6} pattern="[0-9]{6}" value={code} onChange={e=>setCode(e.target.value.replace(/\D/g,""))} placeholder="000000" className="otp-input"/></label>}
        {step==="reset"&&<label className="field-label">New password<input required type={visible?"text":"password"} autoComplete="new-password" minLength={8} value={newPassword} onChange={e=>setNewPassword(e.target.value)} placeholder="Minimum 8 characters"/></label>}
        {step==="login"&&<button type="button" className="auth-text-link auth-forgot" onClick={()=>navigate("recover")}>Forgot password?</button>}
        <button className="auth-submit" disabled={!enabled||busy} type="submit">{busy?"Please wait…":({login:"Sign in",register:"Create account",verify:"Verify email",recover:"Send reset code",reset:"Update password"}[step])}<ArrowRight size={19}/></button>
      </form>
      {step==="verify"&&<button disabled={!enabled||busy} className="auth-text-link resend-link" onClick={resend}>Send a new code</button>}
      <div className="auth-switch">
        {step==="login"?<>New to MeChat? <button onClick={()=>navigate("register")}>Create an account</button></>:
         step==="register"?<>Already have an account? <button onClick={()=>navigate("login")}>Sign in</button></>:
         <>Remember your password? <button onClick={()=>navigate("login")}>Back to sign in</button></>}
      </div>
      <p className="auth-terms"><ShieldCheck size={14}/> Your conversations stay private to your account. By continuing, you agree to use MeChat responsibly.</p>
    </div>
    <footer className="auth-footer"><span>© 2026 MeChat</span><span>Designed for focus, built for clarity.</span></footer>
  </section>
  <aside className="auth-editorial" aria-label="About MeChat">
    <div className="editorial-grid" aria-hidden="true"/>
    <div className="editorial-top"><span className="editorial-index">M / 01</span><span>A BETTER WAY TO THINK</span></div>
    <div className="editorial-bottom"><div className="editorial-line"/><div className="editorial-kicker">MAKE ROOM FOR IDEAS</div><h2>Good ideas begin with <em>better conversations.</em></h2><p>A considered space to question, create, solve, and move your thinking forward.</p><div className="editorial-foot"><span>MECHAT / INTELLIGENT WORKSPACE</span><span>EST. 2026</span></div></div>
  </aside>
 </main>;
}

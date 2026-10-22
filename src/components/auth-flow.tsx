"use client";

import {FormEvent,useState} from "react";
import {useRouter} from "next/navigation";
import {
 ArrowLeft,ArrowRight,Check,CheckCircle2,Eye,EyeOff,
 LockKeyhole,Mail,MessageSquareText,ShieldCheck,UserRound
} from "lucide-react";
import {authClient} from "@/lib/auth-client";
import {MeChatLogo} from "@/components/logo";

type Screen="login"|"register"|"verify"|"recover"|"reset";

const copy:Record<Screen,{eyebrow:string;title:string;subtitle:string;action:string}>={
 login:{
  eyebrow:"YOUR WORKSPACE AWAITS",
  title:"Welcome back.",
  subtitle:"Sign in to pick up where your thinking left off.",
  action:"Sign in to MeChat"
 },
 register:{
  eyebrow:"GET STARTED WITH MECHAT",
  title:"Make room for ideas.",
  subtitle:"Create your account and keep every conversation in one thoughtful space.",
  action:"Create your account"
 },
 verify:{
  eyebrow:"ONE LAST STEP",
  title:"Check your inbox.",
  subtitle:"Enter the six-digit verification code sent to your email address.",
  action:"Verify email"
 },
 recover:{
  eyebrow:"ACCOUNT RECOVERY",
  title:"Reset your password.",
  subtitle:"Enter your email to receive a six-digit password reset code.",
  action:"Send reset code"
 },
 reset:{
  eyebrow:"SET A NEW PASSWORD",
  title:"Start fresh.",
  subtitle:"Use the six-digit code we sent and choose a secure new password.",
  action:"Update password"
 }
};

export function AuthFlow({mode="login",enabled}:{mode?:Screen;enabled:boolean}){
 const router=useRouter();
 const [step,setStep]=useState<Screen>(mode);
 const [name,setName]=useState("");
 const [email,setEmail]=useState("");
 const [password,setPassword]=useState("");
 const [confirmation,setConfirmation]=useState("");
 const [newPassword,setNewPassword]=useState("");
 const [code,setCode]=useState("");
 const [visible,setVisible]=useState(false);
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState("");
 const [success,setSuccess]=useState("");
 const display=copy[step];

 const navigate=(next:Screen)=>{
  setStep(next);setError("");setSuccess("");setVisible(false);
 };
 const backToSignIn=()=>{
  navigate("login");
  router.replace("/sign-in");
 };

 async function submit(event:FormEvent<HTMLFormElement>){
  event.preventDefault();
  if(!enabled||busy)return;
  setBusy(true);setError("");setSuccess("");
  try{
   const address=email.trim().toLowerCase();
   if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address))throw new Error("Enter a valid email address.");
   if(step==="register"){
    if(name.trim().length<2)throw new Error("Enter your full name.");
    if(password.length<8)throw new Error("Use at least eight characters for your password.");
    if(password!==confirmation)throw new Error("Passwords do not match.");
    const result=await authClient.signUp.email({name:name.trim(),email:address,password});
    if(result.error)throw new Error(result.error.message||"Unable to create your account.");
    setPassword("");setConfirmation("");
    navigate("verify");
    setSuccess("We sent a six-digit code to your email address.");
   }else if(step==="login"){
    const result=await authClient.signIn.email({email:address,password});
    if(result.error){
     const msg=(result.error.message||"Sign-in failed. Please try again.");
     // Invalid Origin and other 403 errors are not email-verification failures.
     const needsVerification=result.error.code==="EMAIL_NOT_VERIFIED"||
       /email (?:is |not )?not verified|verify your email/i.test(msg);
     if(needsVerification){
      navigate("verify");
      setSuccess("Verify your email address to continue. Request a new code below if needed.");
      return;
     }
     throw new Error(msg);
    }
    router.replace("/chat");router.refresh();
   }else if(step==="verify"){
    if(!/^\d{6}$/.test(code))throw new Error("Enter the full six-digit code.");
    const result=await authClient.emailOtp.verifyEmail({email:address,otp:code});
    if(result.error)throw new Error(result.error.message||"Invalid or expired code.");
    setCode("");navigate("login");
    setSuccess("Email verified. You can now sign in.");
   }else if(step==="recover"){
    const result=await authClient.emailOtp.requestPasswordReset({email:address});
    if(result.error)throw new Error(result.error.message||"Unable to send a reset code.");
    navigate("reset");
    setSuccess("If the account exists, a reset code has been sent.");
   }else if(step==="reset"){
    if(!/^\d{6}$/.test(code))throw new Error("Enter the full six-digit code.");
    if(newPassword.length<8)throw new Error("Your new password must have at least eight characters.");
    const result=await authClient.emailOtp.resetPassword({email:address,otp:code,password:newPassword});
    if(result.error)throw new Error(result.error.message||"Unable to reset your password.");
    setPassword("");setNewPassword("");setCode("");
    navigate("login");
    setSuccess("Password updated. Sign in with your new password.");
   }
  }catch(e){
   setError(e instanceof Error?e.message:"Something went wrong. Please try again.");
  }finally{setBusy(false);}
 }

 async function resend(){
  if(!enabled||busy||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))return;
  setBusy(true);setError("");setSuccess("");
  try{
   const result=await authClient.emailOtp.sendVerificationOtp({
    email:email.trim().toLowerCase(),type:"email-verification"
   });
   if(result.error)throw new Error(result.error.message||"Unable to send a new code.");
   setSuccess("A fresh verification code has been sent.");
  }catch(e){
   setError(e instanceof Error?e.message:"Unable to resend the code.");
  }finally{setBusy(false);}
 }

 return <main className="auth-layout">
  <section className="auth-main">
   <header className="auth-brand-row">
    <MeChatLogo href="/"/>
    <span className="auth-brand-caption"><span className="auth-caption-dot"/> YOUR AI WORKSPACE</span>
   </header>

   <div className="auth-form-container">
    {step!=="login"&&step!=="register"&&
     <button type="button" className="auth-back" onClick={backToSignIn}>
      <ArrowLeft size={16}/> Back to sign in
     </button>}
    <div className="auth-form-heading">
     <div className="auth-eyebrow"><span className="auth-eyebrow-line"/>{display.eyebrow}</div>
     <h1>{display.title}</h1>
     <p className="auth-subtitle">{display.subtitle}</p>
    </div>

    {!enabled&&<div className="auth-alert auth-alert-warning" role="status">
     <LockKeyhole size={18} aria-hidden="true"/>
     <span>Account services are being configured. Sign-in and registration are currently unavailable.</span>
    </div>}
    {success&&<div className="auth-alert success" role="status">
     <CheckCircle2 size={19} aria-hidden="true"/><span>{success}</span>
    </div>}
    {error&&<div className="auth-alert error" role="alert">
     <LockKeyhole size={18} aria-hidden="true"/><span>{error}</span>
    </div>}

    <form onSubmit={submit} className="auth-form" aria-busy={busy}>
     {step==="register"&&<label className="field-label" htmlFor="auth-name">
      <span>Full name</span>
      <div className="input-with-icon"><UserRound size={18} aria-hidden="true"/>
       <input id="auth-name" required autoComplete="name" value={name}
        onChange={e=>setName(e.target.value)} placeholder="Your full name" maxLength={100}/>
      </div>
     </label>}

     <label className="field-label" htmlFor="auth-email">
      <span>Email address</span>
      <div className="input-with-icon"><Mail size={18} aria-hidden="true"/>
       <input id="auth-email" required type="email" autoComplete="email"
        value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com"/>
      </div>
     </label>

     {(step==="login"||step==="register")&&
      <label className="field-label" htmlFor="auth-password">
       <span>Password</span>
       <div className="input-with-icon"><LockKeyhole size={18} aria-hidden="true"/>
        <input id="auth-password" required type={visible?"text":"password"}
         autoComplete={step==="register"?"new-password":"current-password"}
         minLength={step==="register"?8:1} value={password}
         onChange={e=>setPassword(e.target.value)}
         placeholder={step==="register"?"Minimum 8 characters":"Enter your password"}/>
        <button type="button" className="password-eye"
         aria-label={visible?"Hide password":"Show password"}
         aria-pressed={visible} onClick={()=>setVisible(v=>!v)}>
         {visible?<EyeOff size={18}/>:<Eye size={18}/>}
        </button>
       </div>
      </label>}

     {step==="register"&&<>
      <label className="field-label" htmlFor="auth-confirm">
       <span>Confirm password</span>
       <div className="input-with-icon"><LockKeyhole size={18} aria-hidden="true"/>
        <input id="auth-confirm" required type={visible?"text":"password"}
         autoComplete="new-password" minLength={8} value={confirmation}
         onChange={e=>setConfirmation(e.target.value)} placeholder="Repeat your password"/>
       </div>
      </label>
      <p className="auth-field-hint"><Check size={14}/> Use 8 or more characters for your password.</p>
     </>}

     {(step==="verify"||step==="reset")&&<label className="field-label" htmlFor="auth-code">
      <span>Six-digit verification code</span>
      <div className="input-with-icon auth-otp-wrap"><LockKeyhole size={18} aria-hidden="true"/>
       <input id="auth-code" required inputMode="numeric" autoComplete="one-time-code"
        maxLength={6} pattern="[0-9]{6}" value={code}
        onChange={e=>setCode(e.target.value.replace(/\D/g,""))}
        placeholder="000 000" className="otp-input"/>
      </div>
     </label>}

     {step==="reset"&&<label className="field-label" htmlFor="auth-new-password">
      <span>New password</span>
      <div className="input-with-icon"><LockKeyhole size={18} aria-hidden="true"/>
       <input id="auth-new-password" required type={visible?"text":"password"}
        autoComplete="new-password" minLength={8} value={newPassword}
        onChange={e=>setNewPassword(e.target.value)} placeholder="Minimum 8 characters"/>
       <button type="button" className="password-eye"
        aria-label={visible?"Hide password":"Show password"}
        onClick={()=>setVisible(v=>!v)}>{visible?<EyeOff size={18}/>:<Eye size={18}/>}</button>
      </div>
     </label>}

     {step==="login"&&<button type="button" className="auth-text-link auth-forgot"
       onClick={()=>navigate("recover")}>Forgot password?</button>}

     <button className="auth-submit" disabled={!enabled||busy} type="submit">
      {busy?<span className="auth-submit-spinner" aria-hidden="true"/>:<span>{display.action}</span>}
      {busy?<span>Processing…</span>:<ArrowRight size={18} strokeWidth={2.2}/>}
     </button>
    </form>

    {step==="verify"&&<button disabled={!enabled||busy} className="auth-text-link resend-link"
      onClick={resend}>Didn’t receive a code? <strong>Send a new one</strong></button>}

    {(step==="login"||step==="register")&&<div className="auth-switch">
     <span>{step==="login"?"New to MeChat?":"Already have an account?"}</span>
     <button type="button" onClick={()=>router.push(step==="login"?"/sign-up":"/sign-in")}>
      {step==="login"?"Create an account":"Sign in instead"} <ArrowRight size={14}/>
     </button>
    </div>}

    <div className="auth-security-note">
     <ShieldCheck size={18} aria-hidden="true"/>
     <p>Your conversations are saved to your account. The AI model you select processes the messages you send.</p>
    </div>
   </div>

   <footer className="auth-footer"><span>© 2026 MeChat</span><span>Thoughtfully built for better conversations.</span></footer>
  </section>

  <aside className="auth-editorial" aria-label="About MeChat">
   <div className="editorial-grid" aria-hidden="true"/>
   <div className="editorial-top"><span>MECHAT / THE CONVERSATION WORKSPACE</span><span>EST. 2026</span></div>

   <div className="auth-art" aria-hidden="true">
    <div className="auth-art-orbit auth-art-orbit-one"/>
    <div className="auth-art-orbit auth-art-orbit-two"/>
    <div className="auth-art-window">
     <div className="auth-art-window-top">
      <span className="auth-art-window-dots"><i/><i/><i/></span>
      <span>YOUR SPACE TO THINK</span>
      <MessageSquareText size={17}/>
     </div>
     <div className="auth-art-question">Where could your next idea take you?</div>
     <div className="auth-art-answer"><span className="auth-art-answer-rule"/>
      Start with a question. Explore the possibilities. Keep every conversation close.
     </div>
     <div className="auth-art-window-bottom"><span className="auth-art-online"/><span>A clearer way to think</span><ArrowRight size={14}/></div>
    </div>
   </div>

   <div className="editorial-bottom">
    <div className="editorial-kicker"><span className="editorial-line"/> THE SPACE BETWEEN QUESTIONS AND IDEAS</div>
    <h2>Every great idea <em>starts somewhere.</em></h2>
    <p>A focused, beautifully simple home for questions, creativity, and everything you're building next.</p>
    <div className="editorial-foot"><span>CONVERSATIONS, WITHOUT THE NOISE</span><span>MECHAT © 2026</span></div>
   </div>
  </aside>
 </main>;
}

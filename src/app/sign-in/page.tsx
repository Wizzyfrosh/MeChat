import Link from "next/link";
import { ArrowLeft, ArrowRight, LockKeyhole, ShieldCheck } from "lucide-react";
import { Brand } from "@/components/brand";
export const metadata = {title:"Sign in — coming soon"};
export default function SignInPage(){return <main className="auth-page"><header className="auth-header"><Brand/><Link href="/" className="back-link"><ArrowLeft size={16}/> Back home</Link></header><section className="auth-panel"><div className="auth-icon"><LockKeyhole size={28}/></div><p className="eyebrow">PRIVATE & SECURE</p><h1>A personal space is coming soon.</h1><p>Secure sign in, email verification and synced chat history arrive in our next milestone. This preview does not collect login credentials.</p><div className="auth-notice"><ShieldCheck size={20}/> Accounts are disabled until proper server-side authentication is ready.</div><Link className="pill-button" href="/chat">Explore the preview <ArrowRight size={17}/></Link></section></main>}

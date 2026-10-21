"use client";
import Link from "next/link";
import { House, MessageCircleMore, Mic2, UserRound, Sparkles } from "lucide-react";
type Page = "home"|"chat"|"voice";
export function BottomNav({active}:{active:Page}){
 return <nav className="bottom-nav" aria-label="Mobile navigation">
 <Link href="/" className={active==="home"?"active":""}><House size={20}/><span>Home</span></Link>
 <Link href="/#topics"><Sparkles size={20}/><span>Explore</span></Link>
 <Link href="/chat" className="bottom-center" aria-label="Smart chat"><MessageCircleMore size={25}/></Link>
 <Link href="/voice" className={active==="voice"?"active":""}><Mic2 size={20}/><span>Voice</span></Link>
 <Link href="/sign-in"><UserRound size={20}/><span>Profile</span></Link>
 </nav>;
}

"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, ArrowUpRight, AudioLines, Bell, BookOpenText, BriefcaseBusiness, Code2, HeartPulse, Image as ImageIcon, MessageCircleMore, Moon, Sparkles, Sun, WandSparkles } from "lucide-react";
import { Brand } from "@/components/brand";
import { BottomNav } from "@/components/bottom-nav";

type Topic = "Daily life"|"Business"|"Health"|"Development";
const topics: {category:Topic;title:string;description:string;prompt:string;icon:typeof BookOpenText}[]=[
{category:"Daily life",title:"What is blood pressure?",description:"Small facts that help you understand your wellbeing.",prompt:"What is blood pressure and what do the numbers mean?",icon:HeartPulse},
{category:"Daily life",title:"Why is sleep important?",description:"Discover the science behind your nightly reset.",prompt:"Why is sleep important for the body and brain?",icon:BookOpenText},
{category:"Business",title:"Start a new business",description:"Go from an idea to your first practical steps.",prompt:"Help me plan a small business with a limited budget.",icon:BriefcaseBusiness},
{category:"Business",title:"Find my brand voice",description:"Write clearer messages people remember.",prompt:"Help me create a distinctive brand voice for my business.",icon:WandSparkles},
{category:"Health",title:"Build a healthy routine",description:"Gentle everyday habits that add up.",prompt:"Suggest a sustainable daily routine for general wellness.",icon:HeartPulse},
{category:"Health",title:"Learn about nutrition",description:"Understand a balanced approach to food.",prompt:"Explain the basics of balanced nutrition.",icon:BookOpenText},
{category:"Development",title:"Understand React hooks",description:"Use state and effects with confidence.",prompt:"Explain React hooks with practical examples.",icon:Code2},
{category:"Development",title:"Review an API design",description:"Find patterns for secure, reliable services.",prompt:"Review a scalable REST API architecture.",icon:Code2}
];
const filters: Topic[]=["Daily life","Business","Health","Development"];

export default function Home(){
 const router=useRouter();
 const [selected,setSelected]=useState<Topic>("Daily life");
 const [dark,setDark]=useState(false);
 const [greeting,setGreeting]=useState("Welcome back");
 useEffect(()=>{
   const hour=new Date().getHours();
   setGreeting(hour<12?"Good morning":hour<17?"Good afternoon":"Good evening");
   try{const stored=localStorage.getItem("mechat:theme")==="dark";setDark(stored);document.documentElement.dataset.theme=stored?"dark":"light";}catch{}
 },[]);
 const visible=useMemo(()=>topics.filter(t=>t.category===selected),[selected]);
 const openPrompt=(prompt:string)=>{try{sessionStorage.setItem("mechat:pending-prompt",prompt)}catch{}router.push("/chat")};
 const toggleTheme=()=>{const next=!dark;setDark(next);document.documentElement.dataset.theme=next?"dark":"light";try{localStorage.setItem("mechat:theme",next?"dark":"light")}catch{}};
 return <div className="mc-page"><div className="ambient-bg" aria-hidden="true"/>
  <header className="site-header page-width"><Brand/><nav className="desktop-nav" aria-label="Primary"><Link className="current" href="/">Home</Link><Link href="/chat">Smart Chat</Link><Link href="/voice">Voice Analysis</Link></nav><div className="header-actions"><span className="preview-tag">EARLY PREVIEW</span><button className="round-icon" onClick={toggleTheme} aria-label="Toggle theme">{dark?<Sun size={18}/>:<Moon size={18}/>}</button><Link href="/sign-in" className="user-avatar" aria-label="Account">M</Link></div></header>
  <main className="page-width home-main">
    <section className="home-intro"><div className="eyebrow"><Sparkles size={15}/> YOUR EVERYDAY CREATIVE SPACE</div><h1>{greeting}<span className="dot">.</span><br/>How can I <em>help you?</em></h1><p>Curious minds, brighter ideas. Explore something new or pick up where inspiration left off.</p></section>
    <div className="home-grid">
      <div>
       <div className="section-title"><div><span className="eyebrow">DISCOVER MECHAT</span><h2>What would you like to do?</h2></div><span className="section-count">01 / 03</span></div>
       <div className="actions-grid">
        <Link className="action-card action-chat" href="/chat"><div className="action-icon"><MessageCircleMore size={21}/></div><div className="card-copy"><span className="eyebrow">YOUR CREATIVE COMPANION</span><h3>Talk to AI<br/>assistant</h3><p>A little curiosity goes a long way.</p></div><span className="start-pill">Start talking <ArrowUpRight size={18}/></span></Link>
        <Link className="action-card action-voice" href="/voice"><div className="action-icon"><AudioLines size={22}/></div><div className="card-copy"><h3>Voice</h3><p>Speak it. Shape it.<br/>Make it yours.</p></div><ArrowUpRight size={19} className="corner-arrow"/></Link>
        <div className="action-card action-image"><div className="action-icon"><ImageIcon size={22}/></div><div className="card-copy"><h3>Image</h3><p>Visual ideas, reimagined.</p></div><span className="coming-soon">COMING SOON</span></div>
       </div>
       <section className="topics" id="topics"><div className="section-title"><div><span className="eyebrow">KEEP EXPLORING</span><h2>Topics for you</h2></div><span className="section-count">Find your next curiosity</span></div>
        <div className="topic-filters" role="tablist" aria-label="Explore topics">{filters.map(f=><button key={f} role="tab" aria-selected={selected===f} className={selected===f?"selected":""} onClick={()=>setSelected(f)}>{f}</button>)}</div>
        <div className="topic-grid">{visible.map(({title,description,prompt,icon:Icon})=><article className="topic-card" key={title}><Icon size={19} className="topic-icon"/><h3>{title}</h3><p>{description}</p><button type="button" onClick={()=>openPrompt(prompt)}>Discover <ArrowRight size={16}/></button></article>)}</div>
       </section>
      </div>
      <aside className="feature-card"><span className="feature-eyebrow"><Sparkles size={15}/> MEET YOUR AI SPACE</span><div className="orb-stage" aria-hidden="true"><div className="orb"/><div className="orb-glow"/></div><div className="feature-text"><span className="eyebrow">CREATE. LEARN. EXPLORE.</span><h2>Every great idea starts with <em>a question.</em></h2><p>Let curiosity lead you. Bring your thoughts, your projects, and your wildest what-ifs.</p><Link href="/chat">Explore smart chat <span><ArrowUpRight size={18}/></span></Link></div><span className="feature-footer">THE FUTURE IS A CONVERSATION AWAY</span></aside>
    </div>
    <div className="home-banner"><span className="banner-icon"><Bell size={18}/></span><div><strong>Something wonderful is taking shape.</strong><p>You're viewing MeChat's first experience preview. Live AI arrives in the next development phase.</p></div><Link href="/chat">Try the preview <ArrowRight size={18}/></Link></div>
  </main><BottomNav active="home"/></div>;
}

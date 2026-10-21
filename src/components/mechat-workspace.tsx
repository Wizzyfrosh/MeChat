"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, AudioLines, Check, ChevronDown, CircleHelp, Copy, Menu, MessageCircle, MoreHorizontal, Plus, Search, SendHorizontal, Sparkles, Trash2, X } from "lucide-react";
import { BottomNav } from "@/components/bottom-nav";

type Role="user"|"assistant"|"notice";
type Message={id:string;role:Role;text:string;createdAt:number};
type Thread={id:string;title:string;updatedAt:number;messages:Message[]};
const KEY="mechat:preview:threads";
const starter:Thread[]=[{id:"welcome-demo",title:"What is Web3?",updatedAt:1750000000000,messages:[
{id:"demo-question",role:"user",text:"What is Web3?",createdAt:1750000000000},
{id:"demo-answer",role:"assistant",text:"Web3 describes approaches to internet applications built around decentralized networks, blockchain-based ownership and portable digital assets.\n\nThe idea is to give people more control over identity and value online. Real-world definitions and implementations vary.\n\nThis is a sample answer. Live AI has not been connected yet.",createdAt:1750000001000}]}];
const suggestions=["What is Web3?","Help me plan a project","Explain React hooks","Give me a creative idea"];
const newId=()=>globalThis.crypto?.randomUUID?.()??`${Date.now()}-${Math.random().toString(36).slice(2)}`;
function validThreads(v:unknown):v is Thread[]{
 return Array.isArray(v)&&v.length<=100&&v.every((t:unknown)=>{
   if(!t||typeof t!=="object")return false;
   const x=t as Partial<Thread>;
   return typeof x.id==="string"&&typeof x.title==="string"&&typeof x.updatedAt==="number"&&Array.isArray(x.messages)&&x.messages.length<=500&&x.messages.every((m:unknown)=>{
     if(!m||typeof m!=="object")return false;
     const msg=m as Partial<Message>;
     return typeof msg.id==="string"&&typeof msg.text==="string"&&msg.text.length<=10000&&["user","assistant","notice"].includes(String(msg.role));
   });
 });
}
export function MeChatWorkspace(){
 const [threads,setThreads]=useState<Thread[]>(starter);
 const [active,setActive]=useState<string|null>(null);
 const [input,setInput]=useState("");
 const [search,setSearch]=useState("");
 const [drawer,setDrawer]=useState(false);
 const [info,setInfo]=useState(false);
 const [loaded,setLoaded]=useState(false);
 const [copied,setCopied]=useState<string|null>(null);
 const composer=useRef<HTMLTextAreaElement>(null);
 const bottom=useRef<HTMLDivElement>(null);
 useEffect(()=>{
   // Restore preview-only browser storage after hydration.
   const frame=window.requestAnimationFrame(()=>{
     try{
       const saved=localStorage.getItem(KEY);
       if(saved){const value:unknown=JSON.parse(saved);if(validThreads(value))setThreads(value);}
       const pending=sessionStorage.getItem("mechat:pending-prompt");
       if(pending){setInput(pending.slice(0,4000));sessionStorage.removeItem("mechat:pending-prompt");}
       document.documentElement.dataset.theme=localStorage.getItem("mechat:theme")==="dark"?"dark":"light";
     }catch{}
     setLoaded(true);
   });
   return ()=>window.cancelAnimationFrame(frame);
 },[]);
 useEffect(()=>{if(!loaded)return;try{localStorage.setItem(KEY,JSON.stringify(threads))}catch{}},[threads,loaded]);
 useEffect(()=>bottom.current?.scrollIntoView({block:"end",behavior:"smooth"}),[active,threads]);
 const selected=threads.find(t=>t.id===active);
 const list=useMemo(()=>threads.filter(t=>t.title.toLowerCase().includes(search.toLowerCase())).sort((a,b)=>b.updatedAt-a.updatedAt),[threads,search]);
 const send=useCallback((value:string)=>{
   const message=value.trim();if(!message||message.length>4000)return;
   const now=Date.now(),id=active??newId();
   const user:Message={id:newId(),role:"user",text:message,createdAt:now};
   const notice:Message={id:newId(),role:"notice",text:"This is a UI preview. Your message was saved locally but was not sent to an AI model. Secure DeepSeek streaming will be integrated in the next development milestone.",createdAt:now+1};
   setThreads(old=>old.some(t=>t.id===id)?old.map(t=>t.id===id?{...t,updatedAt:now,messages:[...t.messages,user,notice]}:t):[{id,title:message.slice(0,48),updatedAt:now,messages:[user,notice]},...old].slice(0,100));
   setActive(id);setInput("");setDrawer(false);composer.current?.focus();
 },[active]);
 const newChat=()=>{setActive(null);setInput("");setDrawer(false);composer.current?.focus()};
 const removeThread=(id:string)=>{setThreads(old=>old.filter(t=>t.id!==id));if(active===id)setActive(null)};
 const copy=async(m:Message)=>{try{await navigator.clipboard.writeText(m.text);setCopied(m.id)}catch{setCopied(null)}};
 return <div className="chat-app mc-page"><div className="ambient-bg" aria-hidden="true"/>
 {drawer&&<button className="sidebar-scrim" onClick={()=>setDrawer(false)} aria-label="Close conversation list"/>}
 <aside className={`chat-sidebar ${drawer?"expanded":""}`} aria-label="Conversation list">
  <div className="sidebar-header"><Link className="sidebar-brand" href="/"><span><MessageCircle size={19}/></span> MeChat<strong>.</strong></Link><button className="icon-plain close-sidebar" aria-label="Close menu" onClick={()=>setDrawer(false)}><X size={19}/></button></div>
  <button className="new-chat" onClick={newChat}><Plus size={17}/> New conversation <span>+</span></button>
  <label className="search-chats"><Search size={16}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search conversations"/></label>
  <div className="sidebar-label">RECENT CONVERSATIONS <span>{list.length}</span></div>
  <div className="conversation-list">{list.length===0?<p className="empty-search">No matching chats.</p>:list.map(t=><div className={`conversation-row ${active===t.id?"current":""}`} key={t.id}><button onClick={()=>{setActive(t.id);setDrawer(false)}}><MessageCircle size={16}/><span>{t.title}</span></button><button className="delete-chat" onClick={()=>removeThread(t.id)} aria-label={`Delete ${t.title}`}><Trash2 size={14}/></button></div>)}</div>
  <div className="sidebar-foot"><div className="preview-callout"><Sparkles size={17}/><div><strong>MeChat preview</strong><p>Chats only exist in this browser.</p></div></div><Link href="/" className="back-link"><ArrowLeft size={16}/> Back to home</Link></div>
 </aside>
 <main className="chat-main">
  <header className="chat-topbar"><div className="chat-heading"><button className="icon-plain open-sidebar" aria-label="Open conversations" onClick={()=>setDrawer(true)}><Menu size={22}/></button><Link className="icon-plain desktop-back" href="/" aria-label="Back to home"><ArrowLeft size={19}/></Link><div><strong>Smart Chat</strong><span>MeChat assistant</span></div></div><div className="chat-heading-actions"><span className="live-preview">PREVIEW</span><button className="icon-plain" aria-label="About this preview" onClick={()=>setInfo(!info)}><MoreHorizontal size={22}/></button></div></header>
  {info&&<div className="chat-info" role="status"><CircleHelp size={18}/><span>Real AI, accounts and cloud sync are not active. Chat messages are saved only to this device.</span><button aria-label="Close information" onClick={()=>setInfo(false)}><X size={16}/></button></div>}
  <div className="messages-scroll">{selected?<div className="messages-inner"><div className="chat-divider">CONVERSATION</div>{selected.messages.map(m=><div className={`message-row ${m.role}`} key={m.id}>
    {m.role!=="user"&&<span className="assistant-avatar"><Sparkles size={17}/></span>}
    <div className="message-column"><div className="message-bubble">{m.text}</div><div className="message-meta">{m.role==="user"?"You":m.role==="notice"?"MeChat · Preview":"MeChat · Sample"}<button onClick={()=>copy(m)} aria-label="Copy message">{copied===m.id?<Check size={13}/>:<Copy size={13}/>}</button></div></div>
  </div>)}<div ref={bottom}/></div>:<div className="empty-chat"><span className="empty-chat-icon"><Sparkles size={27}/></span><span className="eyebrow">THINK BIG. START SMALL.</span><h1>How can I help you <em>today?</em></h1><p>Bring your questions, ideas, projects, and everything in between. Your space is ready.</p><div className="suggestions">{suggestions.map(s=><button key={s} onClick={()=>setInput(s)}><Sparkles size={15}/>{s}</button>)}</div><p className="preview-warning">Visual preview only — AI responses are not yet enabled.</p></div>}</div>
  <div className="composer-area"><form className="composer" onSubmit={e=>{e.preventDefault();send(input)}}><textarea ref={composer} value={input} maxLength={4000} placeholder="Type a message..." rows={2} aria-label="Your message" onChange={e=>setInput(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();send(input)}}}/><div className="composer-toolbar"><div><Link href="/voice" className="icon-plain" aria-label="Voice transcription"><AudioLines size={20}/></Link><span>MeChat Preview <ChevronDown size={13}/></span></div><div className="composer-right"><small>{input.length}/4000</small><button disabled={!input.trim()} type="submit" aria-label="Save preview message"><SendHorizontal size={18}/></button></div></div></form><p className="composer-note">Preview messages stay on this device. Please avoid sharing sensitive details.</p></div>
 </main><BottomNav active="chat"/></div>;
}

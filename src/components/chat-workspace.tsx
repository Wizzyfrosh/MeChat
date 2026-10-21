"use client";
import { FormEvent, KeyboardEvent, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ArrowUp, Check, ChevronDown, CircleHelp, Copy, Ellipsis, FileText, LogOut, Menu, MessageCircle, Moon, PanelLeftClose, PanelLeftOpen, Pencil, Plus, Search, Settings2, ShieldCheck, Sparkles, Sun, Trash2, UserRound, X } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { MeChatLogo, MeChatSymbol } from "@/components/logo";

type StoredThread={id:string;title:string;updatedAt:string};
type Role="user"|"assistant";
type Message={id:string;role:Role;content:string;status?:"pending"|"complete"|"interrupted"|"failed"};
const starterIdeas=[
 {title:"Write and refine",text:"Help me draft a professional email that is clear, concise and friendly."},
 {title:"Learn something",text:"Explain the fundamentals of machine learning with useful examples."},
 {title:"Solve a problem",text:"Help me break down a complex project into achievable milestones."},
 {title:"Think creatively",text:"Brainstorm five distinctive product ideas for small businesses."},
];
const readTheme=()=>{try{return localStorage.getItem("mechat.theme")==="dark"}catch{return false}};
const subscribeTheme=(cb:()=>void)=>{window.addEventListener("storage",cb);window.addEventListener("mechat-theme",cb);return ()=>{window.removeEventListener("storage",cb);window.removeEventListener("mechat-theme",cb)}};
function groupName(date:string){
 const now=new Date(),target=new Date(date);
 if(!Number.isFinite(target.getTime()))return "Earlier";
 const oneDay=86400000;
 const delta=new Date(now.getFullYear(),now.getMonth(),now.getDate()).getTime()-new Date(target.getFullYear(),target.getMonth(),target.getDate()).getTime();
 if(delta<oneDay)return "Today";if(delta<oneDay*2)return "Yesterday";
 if(delta<oneDay*8)return "Previous 7 days";
 return "Older";
}
function isRecord(value:unknown):value is Record<string,unknown>{return Boolean(value)&&typeof value==="object";}
function resultError(value:unknown,fallback:string){return isRecord(value)&&typeof value.error==="string"?value.error:fallback;}
async function apiJson(url:string,init?:RequestInit){
 const response=await fetch(url,{credentials:"same-origin",cache:"no-store",...init});
 const value:unknown=await response.json().catch(()=>({}));
 if(!response.ok)throw new Error(resultError(value,"Request failed."));
 return value;
}
export function ChatWorkspace({user,initialConversationId=null}:{user:{name:string;email:string};initialConversationId?:string|null}){
 const router=useRouter();
 const [threads,setThreads]=useState<StoredThread[]>([]);
 const [activeId,setActiveId]=useState<string|null>(initialConversationId);
 const [messages,setMessages]=useState<Message[]>([]);
 const [busy,setBusy]=useState(false);
 const [loadError,setLoadError]=useState("");
 const [loadingMessages,setLoadingMessages]=useState(Boolean(initialConversationId));
 const [draft,setDraft]=useState("");
 const [sidebarOpen,setSidebarOpen]=useState(false);
 const [collapsed,setCollapsed]=useState(false);
 const [searchOpen,setSearchOpen]=useState(false);
 const [search,setSearch]=useState("");
 const [menuOpen,setMenuOpen]=useState(false);
 const [settingsOpen,setSettingsOpen]=useState(false);
 const [actionsFor,setActionsFor]=useState<string|null>(null);
 const [renaming,setRenaming]=useState<string|null>(null);
 const [titleDraft,setTitleDraft]=useState("");
 const [removeTarget,setRemoveTarget]=useState<string|null>(null);
 const [copied,setCopied]=useState<string|null>(null);
 const [lastError,setLastError]=useState("");
 const [modelInfo,setModelInfo]=useState(false);
 const [conversationsLoading,setConversationsLoading]=useState(true);
 const dark=useSyncExternalStore(subscribeTheme,readTheme,()=>false);
 const end=useRef<HTMLDivElement>(null);
 const composer=useRef<HTMLTextAreaElement>(null);
 const searchRef=useRef<HTMLInputElement>(null);
 const abort=useRef<AbortController|null>(null);
 const groups=["Today","Yesterday","Previous 7 days","Older"];
 useEffect(()=>{document.documentElement.dataset.theme=dark?"dark":"light"},[dark]);
 useEffect(()=>{let ignore=false;apiJson("/api/conversations").then(data=>{if(ignore)return;const obj=data as {conversations?:StoredThread[]};setThreads(obj.conversations??[])}).catch(()=>{if(!ignore)setLoadError("Unable to load your conversations.")}).finally(()=>{if(!ignore)setConversationsLoading(false)});return()=>{ignore=true}},[]);
 useEffect(()=>{
  if(!activeId)return;
  let ignore=false;
  apiJson("/api/conversations/"+encodeURIComponent(activeId)).then(data=>{
   if(ignore)return;
   const obj=data as {messages?:Message[]};setMessages((obj.messages??[]).map(m=>({id:m.id,role:m.role,content:m.content,status:m.status})));
   setLoadingMessages(false);
  }).catch(()=>{if(!ignore){setLoadingMessages(false);setLoadError("Unable to open conversation.")}});
  return()=>{ignore=true};
 },[activeId]);
 useEffect(()=>{end.current?.scrollIntoView({block:"end",behavior:"smooth"})},[messages]);
 useEffect(()=>{const handler=(e:globalThis.KeyboardEvent)=>{
  if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==="k"){e.preventDefault();setSearchOpen(true);setSidebarOpen(true);requestAnimationFrame(()=>searchRef.current?.focus())}
  if((e.metaKey||e.ctrlKey)&&e.shiftKey&&e.key.toLowerCase()==="o"){e.preventDefault();startNew()}
 };window.addEventListener("keydown",handler);return()=>window.removeEventListener("keydown",handler)});
 const setTheme=(next:boolean)=>{localStorage.setItem("mechat.theme",next?"dark":"light");window.dispatchEvent(new Event("mechat-theme"))};
 const reloadList=async()=>{try{const data=await apiJson("/api/conversations") as {conversations:StoredThread[]};setThreads(data.conversations)}catch{}};
 function startNew(){if(busy)return;setActiveId(null);setMessages([]);setDraft("");setLastError("");setLoadingMessages(false);setSidebarOpen(false);setActionsFor(null);router.push("/chat");requestAnimationFrame(()=>composer.current?.focus())}
 function openThread(id:string){if(busy)return;setLastError("");setSidebarOpen(false);setActionsFor(null);setLoadingMessages(true);setActiveId(id);router.push("/chat/"+encodeURIComponent(id))}
 async function rename(id:string){
  const title=titleDraft.trim();if(!title)return;
  try{await apiJson("/api/conversations/"+id,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({title:title.slice(0,160)})});setThreads(old=>old.map(t=>t.id===id?{...t,title}:t));setRenaming(null);setActionsFor(null)}
  catch(e){setLoadError(e instanceof Error?e.message:"Rename failed.")}
 }
 async function deleteThread(){
  const id=removeTarget;if(!id)return;
  try{await apiJson("/api/conversations/"+id,{method:"DELETE"}).catch(async e=>{if(e instanceof SyntaxError)return;throw e});
   setThreads(old=>old.filter(t=>t.id!==id));if(id===activeId){setActiveId(null);setMessages([]);router.replace("/chat")}
  }catch(e){setLoadError(e instanceof Error?e.message:"Delete failed.")}
  finally{setRemoveTarget(null)}
 }
 async function copyText(text:string,id:string){try{await navigator.clipboard.writeText(text);setCopied(id)}catch{setLoadError("Clipboard is not available.")}}
 async function signOut(){try{await authClient.signOut();router.replace("/sign-in");router.refresh()}catch{setLoadError("Could not sign out. Please try again.")}}
 function parseStream(frame:string):{event:string;payload:Record<string,unknown>}|null{
   const lines=frame.split(/\r?\n/);
   const evt=lines.find(l=>l.startsWith("event: "))?.slice(7);
   const data=lines.find(l=>l.startsWith("data: "))?.slice(6);
   if(!evt||!data)return null;
   try{const payload:unknown=JSON.parse(data);return isRecord(payload)?{event:evt,payload}:null}catch{return null}
 }
 async function sendText(text:string){
   if(busy)return;
   const content=text.trim();if(!content||content.length>8000)return;
   setBusy(true);setLastError("");setDraft("");
   const requestId=crypto.randomUUID(),mineId=crypto.randomUUID(),replyId=crypto.randomUUID();
   setMessages(old=>[...old,{id:mineId,role:"user",content,status:"complete"},{id:replyId,role:"assistant",content:"",status:"pending"}]);
   const control=new AbortController();
   abort.current=control;
   let savedConversationId:string|null=null;
   let ended=false;
   try{
     const res=await fetch("/api/chat",{
       method:"POST",headers:{"Content-Type":"application/json"},
       body:JSON.stringify({conversationId:activeId,content,requestId}),
       signal:control.signal,
     });
     if(!res.ok){
       const data:unknown=await res.json().catch(()=>({}));
       if(isRecord(data)&&typeof data.conversationId==="string")savedConversationId=data.conversationId;
       throw new Error(resultError(data,"Unable to reach the AI service."));
     }
     if(!res.body)throw new Error("The response stream could not be opened.");
     const reader=res.body.getReader();
     let buffer="",done=false;
     const decoder=new TextDecoder();
     while(!done){
       const part=await reader.read();if(part.done)break;
       buffer+=decoder.decode(part.value,{stream:true});
       const frames=buffer.split("\n\n");buffer=frames.pop()??"";
       for(const frame of frames){
         const parsed=parseStream(frame);if(!parsed)continue;
         if(parsed.event==="meta"&&typeof parsed.payload.conversationId==="string"){
           savedConversationId=parsed.payload.conversationId;
         }
         if(parsed.event==="delta"&&typeof parsed.payload.text==="string"){
           setMessages(old=>old.map(m=>m.id===replyId?{...m,content:m.content+String(parsed.payload.text)}:m));
         }
         if(parsed.event==="done"){ended=true;done=true;break}
         if(parsed.event==="error")throw new Error(typeof parsed.payload.message==="string"?parsed.payload.message:"AI generation was interrupted.");
       }
     }
     if(!ended)throw new Error("The response ended unexpectedly.");
     setMessages(old=>old.map(m=>m.id===replyId?{...m,status:"complete"}:m));
     if(savedConversationId&&!activeId){
       setActiveId(savedConversationId);
       router.replace("/chat/"+savedConversationId);
     }
     await reloadList();
   }catch(e){
     const message=e instanceof Error&&e.name==="AbortError"?"Generation stopped.":e instanceof Error?e.message:"Unable to send your message.";
     setLastError(message);
     if(savedConversationId){
       // The user request may have been stored even when the provider failed.
       // Recover the server's copy rather than leave a phantom unsaved conversation.
       setMessages(old=>old.map(m=>m.id===replyId?{...m,status:"interrupted"}:m));
       if(!activeId){
         setActiveId(savedConversationId);
         router.replace("/chat/"+savedConversationId);
       }
       await reloadList();
       try{
         const data=await apiJson("/api/conversations/"+encodeURIComponent(savedConversationId)) as {messages?:Message[]};
         if(Array.isArray(data.messages))setMessages(data.messages);
       }catch{/* Keep the partial response visible when reconnection fails. */}
     }else{
       // No persistence was confirmed; restore text and remove optimistic bubbles.
       setDraft(content);
       setMessages(old=>old.filter(m=>m.id!==mineId&&m.id!==replyId));
     }
   }finally{abort.current=null;setBusy(false)}
 }
 function onSubmit(e:FormEvent){e.preventDefault();void sendText(draft)}
 function onComposerKey(e:KeyboardEvent<HTMLTextAreaElement>){if(e.key==="Enter"&&!e.shiftKey&&!e.nativeEvent.isComposing){e.preventDefault();void sendText(draft)}}
 const shown=threads.filter(t=>t.title.toLowerCase().includes(search.trim().toLowerCase()));
 const initials=user.name.trim().split(/\s+/).slice(0,2).map(s=>s[0]?.toUpperCase()).join("")||"U";
 return <div className="chat-app-shell">
   {sidebarOpen&&<button className="drawer-backdrop" aria-label="Close navigation" onClick={()=>setSidebarOpen(false)}/>}
   <aside className={`chat-sidebar ${sidebarOpen?"mobile-open":""} ${collapsed?"collapsed":""}`} aria-label="Conversation navigation">
    <div className="sidebar-top">
      <MeChatLogo compact={collapsed}/>
      <button className="icon-button sidebar-collapse" aria-label={collapsed?"Expand sidebar":"Collapse sidebar"} title={collapsed?"Expand sidebar":"Collapse sidebar"} onClick={()=>setCollapsed(!collapsed)}>{collapsed?<PanelLeftOpen size={19}/>:<PanelLeftClose size={19}/>}</button>
      <button className="icon-button mobile-drawer-close" aria-label="Close sidebar" onClick={()=>setSidebarOpen(false)}><X size={21}/></button>
    </div>
    <div className="sidebar-commands">
      <button className="command-new" onClick={startNew} title="New chat"><Plus size={19}/><span>New chat</span><span className="key-hint">⌘ ⇧ O</span></button>
      <button className="command-search" onClick={()=>{setSearchOpen(!searchOpen);setCollapsed(false);requestAnimationFrame(()=>searchRef.current?.focus())}} title="Search conversations"><Search size={19}/><span>Search chats</span><span className="key-hint">⌘ K</span></button>
      {searchOpen&&<div className="sidebar-search-box"><Search size={16}/><input ref={searchRef} value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search history" aria-label="Search history"/><button className="icon-button" aria-label="Clear search" onClick={()=>{setSearch("");setSearchOpen(false)}}><X size={15}/></button></div>}
    </div>
    <div className="sidebar-scroll">
      {!collapsed&&<div className="sidebar-section-hint">YOUR CONVERSATIONS</div>}
      {conversationsLoading?<div className="sidebar-loading">Loading chats…</div>:shown.length===0?<div className="sidebar-empty">{search?"No matching conversations":"Conversations will appear here."}</div>:groups.map(group=>{
       const entries=shown.filter(t=>groupName(t.updatedAt)===group);
       return entries.length?<div className="history-group" key={group}><div className="history-heading">{group}</div>{entries.map(t=><div className={`history-item ${activeId===t.id?"selected":""}`} key={t.id}>
        {renaming===t.id?<form className="rename-form" onSubmit={e=>{e.preventDefault();void rename(t.id)}}><input autoFocus maxLength={160} aria-label="Conversation title" value={titleDraft} onChange={e=>setTitleDraft(e.target.value)}/><button type="submit" aria-label="Save title"><Check size={16}/></button></form>:<button className="history-open" onClick={()=>openThread(t.id)} title={t.title}><MessageCircle size={16}/><span>{t.title}</span></button>}
        <button className="history-more" aria-label={`Actions for ${t.title}`} onClick={()=>setActionsFor(actionsFor===t.id?null:t.id)}><Ellipsis size={17}/></button>
        {actionsFor===t.id&&<div className="thread-actions"><button onClick={()=>{setRenaming(t.id);setTitleDraft(t.title);setActionsFor(null)}}><Pencil size={15}/> Rename</button><button className="danger" onClick={()=>{setRemoveTarget(t.id);setActionsFor(null)}}><Trash2 size={15}/> Delete</button></div>}
       </div>)}</div>:null;
      })}
    </div>
    <div className="sidebar-bottom">
      <button className="account-control" onClick={()=>setMenuOpen(!menuOpen)} aria-expanded={menuOpen}>
        <span className="user-avatar">{initials}</span><span className="user-detail"><strong>{user.name}</strong><small>Personal workspace</small></span><ChevronDown size={16}/>
      </button>
      {menuOpen&&<div className="account-menu"><div className="account-email">{user.email}</div><button onClick={()=>{setSettingsOpen(true);setMenuOpen(false)}}><Settings2 size={17}/> Settings</button><button onClick={()=>setTheme(!dark)}>{dark?<Sun size={17}/>:<Moon size={17}/>} {dark?"Light appearance":"Dark appearance"}</button><button onClick={()=>void signOut()}><LogOut size={17}/> Sign out</button></div>}
    </div>
   </aside>
   <main className="conversation-main">
    <header className="conversation-topbar">
      <div className="topbar-left">
        <button className="icon-button mobile-menu" aria-label="Open sidebar" onClick={()=>setSidebarOpen(true)}><Menu size={21}/></button>
        {collapsed&&<button className="icon-button desktop-sidebar-open" aria-label="Expand sidebar" onClick={()=>setCollapsed(false)}><PanelLeftOpen size={19}/></button>}
        <button className="model-switch" onClick={()=>setModelInfo(!modelInfo)} aria-expanded={modelInfo}>MeChat <ChevronDown size={16}/></button>
        {modelInfo&&<div className="model-popover"><strong>MeChat Assistant</strong><p>Powered by DeepSeek Flash. Additional models will be introduced after evaluation.</p><div className="model-active"><span/> DeepSeek Flash <Check size={16}/></div></div>}
      </div>
      <div className="topbar-right"><span className="private-pill"><ShieldCheck size={14}/> Private workspace</span><button className="icon-button" title="Appearance" aria-label="Toggle appearance" onClick={()=>setTheme(!dark)}>{dark?<Sun size={19}/>:<Moon size={19}/>}</button><span className="topbar-avatar" title={user.name}>{initials}</span></div>
    </header>
    {loadError&&<div className="inline-alert" role="alert">{loadError}<button aria-label="Dismiss error" onClick={()=>setLoadError("")}><X size={16}/></button></div>}
    <div className="message-viewport">
      {!activeId&&messages.length===0?<div className="welcome-conversation">
        <div className="welcome-monogram"><MeChatSymbol size={48}/></div>
        <h1>What’s on your mind?</h1><p>Start a conversation, explore an idea, or work through something together.</p>
        <div className="prompt-grid">{starterIdeas.map(idea=><button key={idea.title} onClick={()=>{setDraft(idea.text);composer.current?.focus()}}><strong>{idea.title}</strong><span>{idea.text}</span><ArrowUp size={16}/></button>)}</div>
      </div>:loadingMessages?<div className="loading-conversation">Opening conversation…</div>:<div className="messages-container" role="log" aria-label="Conversation">
         {messages.map(msg=><article className={`conversation-message ${msg.role}`} key={msg.id}>
           {msg.role==="assistant"&&<div className="message-identity"><MeChatSymbol size={29}/><span>MeChat</span></div>}
           {msg.role==="user"?<div className="user-message-text">{msg.content}</div>:<div className="message-content">
             {msg.status==="pending"&&!msg.content?<div className="thinking-dots"><i/><i/><i/><span>Thinking</span></div>:<ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>}
             {(msg.status==="interrupted"||msg.status==="failed")&&<p className="message-error">This response could not be completed. Please try again.</p>}
           </div>}
           {msg.content&&<div className="message-tools"><button aria-label="Copy message" title="Copy" onClick={()=>void copyText(msg.content,msg.id)}>{copied===msg.id?<Check size={15}/>:<Copy size={15}/>}<span>{copied===msg.id?"Copied":""}</span></button></div>}
         </article>)}
         <div ref={end}/>
       </div>}
    </div>
    <div className="composer-dock">
      {lastError&&<div className="composer-error"><CircleHelp size={16}/><span>{lastError}</span><button aria-label="Dismiss message" onClick={()=>setLastError("")}><X size={15}/></button></div>}
      <form className="chat-composer" onSubmit={onSubmit}>
        <textarea ref={composer} rows={2} maxLength={8000} placeholder="Message MeChat" aria-label="Message MeChat" value={draft} onChange={e=>setDraft(e.target.value)} onKeyDown={onComposerKey} disabled={busy}/>
        <div className="composer-bottom"><div className="composer-left"><button title="Attachments coming soon" aria-label="Attachments not yet available" disabled type="button" className="icon-button"><Plus size={19}/></button><span className="model-label"><Sparkles size={15}/> DeepSeek Flash</span></div><div className="composer-actions"><span className="composer-count">{draft.length?draft.length+"/8000":""}</span>{busy?<button className="send-control is-busy" type="button" aria-label="Stop response" onClick={()=>abort.current?.abort()}><span className="stop-square"/></button>:<button className="send-control" type="submit" aria-label="Send message" disabled={!draft.trim()}><ArrowUp size={20}/></button>}</div></div>
      </form>
      <p className="composer-disclaimer">MeChat can make mistakes. Verify important information.</p>
    </div>
   </main>
   {settingsOpen&&<div className="modal-overlay" role="presentation" onClick={()=>setSettingsOpen(false)}><section role="dialog" aria-modal="true" aria-label="Settings" className="modal-card settings-card" onClick={e=>e.stopPropagation()}><header><div><h2>Settings</h2><p>Customize your space</p></div><button className="icon-button" aria-label="Close settings" onClick={()=>setSettingsOpen(false)}><X size={20}/></button></header><div className="settings-row"><div><strong>Appearance</strong><p>Choose a comfortable reading environment.</p></div><div className="theme-buttons"><button className={!dark?"active":""} onClick={()=>setTheme(false)}><Sun size={16}/> Light</button><button className={dark?"active":""} onClick={()=>setTheme(true)}><Moon size={16}/> Dark</button></div></div><div className="settings-row"><div><strong>Your account</strong><p>{user.email}</p></div><UserRound size={20}/></div><div className="settings-footer"><FileText size={16}/> Your conversations are stored securely and available on sign-in.</div></section></div>}
   {removeTarget&&<div className="modal-overlay" role="presentation" onClick={()=>setRemoveTarget(null)}><section className="modal-card" role="alertdialog" aria-modal="true" aria-label="Delete conversation" onClick={e=>e.stopPropagation()}><h2>Delete conversation?</h2><p>All messages in this conversation will be permanently deleted. This action cannot be undone.</p><div className="modal-actions"><button className="secondary-button" onClick={()=>setRemoveTarget(null)}>Cancel</button><button className="danger-button" onClick={()=>void deleteThread()}>Delete conversation</button></div></section></div>}
 </div>;
}

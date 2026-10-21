"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Headphones, Mic, Pause, ShieldCheck, Waves, X } from "lucide-react";
import { BottomNav } from "@/components/bottom-nav";

type SpeechEvent={results:ArrayLike<ArrayLike<{transcript:string}>>};
type Recognition={
 continuous:boolean;interimResults:boolean;lang:string;
 onresult:((event:SpeechEvent)=>void)|null;
 onerror:((event:{error:string})=>void)|null;
 onend:(()=>void)|null;
 start:()=>void;stop:()=>void;
};
type RecognitionCtor=new()=>Recognition;
export function VoiceExperience(){
 const router=useRouter();
 const active=useRef<Recognition|null>(null);
 const [supported,setSupported]=useState<boolean|null>(null);
 const [listening,setListening]=useState(false);
 const [transcript,setTranscript]=useState("");
 const [error,setError]=useState("");
 useEffect(()=>{
   const w=window as typeof window & {SpeechRecognition?:RecognitionCtor;webkitSpeechRecognition?:RecognitionCtor};
   setSupported(!!(w.SpeechRecognition||w.webkitSpeechRecognition));
   try { document.documentElement.dataset.theme = localStorage.getItem("mechat:theme")==="dark" ? "dark" : "light"; } catch {}
   return ()=>{active.current?.stop();active.current=null};
 },[]);
 const toggle=()=>{
  if(listening){active.current?.stop();setListening(false);return;}
  const w=window as typeof window & {SpeechRecognition?:RecognitionCtor;webkitSpeechRecognition?:RecognitionCtor};
  const Ctor=w.SpeechRecognition||w.webkitSpeechRecognition;
  if(!Ctor){setError("This browser does not support speech recognition. Use text chat instead.");return;}
  setTranscript("");setError("");
  try{
    const recognition=new Ctor();
    recognition.continuous=true;recognition.interimResults=true;recognition.lang="en-US";
    recognition.onresult=e=>{let value="";for(let i=0;i<e.results.length;i++)value+=e.results[i][0]?.transcript??"";setTranscript(value.trim())};
    recognition.onerror=e=>{setError(e.error==="not-allowed"?"Microphone permission denied. Check your browser settings.":`Speech recognition stopped: ${e.error}`);setListening(false)};
    recognition.onend=()=>setListening(false);
    active.current=recognition;recognition.start();setListening(true);
  }catch{setError("Unable to start speech recognition.");setListening(false);}
 };
 const sendToChat=()=>{if(!transcript.trim())return;try{sessionStorage.setItem("mechat:pending-prompt",transcript.slice(0,4000))}catch{}router.push("/chat")};
 const clear=()=>{active.current?.stop();setListening(false);setTranscript("");setError("")};
 return <div className="voice-page mc-page"><div className="ambient-bg" aria-hidden="true"/>
 <header className="voice-header page-width"><Link href="/" className="round-icon" aria-label="Back to dashboard"><ArrowLeft size={19}/></Link><div><strong>Voice Analysis</strong><span>Speak your mind, beautifully.</span></div><Link href="/chat" className="round-icon" aria-label="Open smart chat"><Waves size={19}/></Link></header>
 <main className="voice-main">
   <div className="eyebrow"><Headphones size={15}/> THE VOICE EXPERIENCE</div>
   <h1>Your thoughts, <em>out loud.</em></h1><p>Speak naturally. Turn what you say into the beginning of your next conversation.</p>
   <div className={`voice-orb-stage ${listening?"is-listening":""}`} aria-hidden="true"><div className="voice-ring"/><div className="voice-ring second"/><div className="orb"/><div className="orb-glow"/></div>
   <div className="voice-status"><span className={listening?"is-active":""}/>{listening?"Listening to your voice...":"Ready when you are"}</div>
   {error&&<div className="voice-error" role="alert">{error}</div>}
   {transcript?<div className="transcript"><span className="eyebrow">YOUR TRANSCRIPT</span><p>{transcript}</p><button type="button" onClick={sendToChat}>Continue in chat <ArrowRight size={16}/></button></div>:<p className="voice-helper">{supported===false?"Speech-to-text is not available in this browser.":"Tap the microphone below to begin."}</p>}
   <div className="voice-controls"><button className="round-icon" onClick={clear} aria-label="Clear voice transcript"><X size={20}/></button><button className={`microphone ${listening?"on":""}`} onClick={toggle} disabled={supported===false} aria-label={listening?"Stop recording":"Start speech recognition"}>{listening?<Pause size={25} fill="currentColor"/>:<Mic size={26}/>}</button><Link href="/chat" className="round-icon" aria-label="Continue to text chat"><ArrowRight size={20}/></Link></div>
   <p className="voice-privacy"><ShieldCheck size={15}/> Browser speech recognition may use a third-party speech service. MeChat does not store audio in this preview.</p>
 </main><BottomNav active="voice"/></div>;
}

import Link from "next/link";

export function MeChatSymbol({size=32,light=false}:{size?:number;light?:boolean}){
 return <svg role="img" aria-label="MeChat" width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect x="2" y="2" width="44" height="44" rx="14" fill={light?"#fff":"#166B5A"}/>
  <path d="M12 17.5c0-3.04 2.46-5.5 5.5-5.5H30.5c3.04 0 5.5 2.46 5.5 5.5v11c0 3.04-2.46 5.5-5.5 5.5h-8L15 39v-5.4c-1.8-.9-3-2.75-3-5.1v-11Z" stroke={light?"#166B5A":"#F6FBF8"} strokeWidth="2.6" strokeLinejoin="round"/>
  <path d="M18 27v-8l6 5.5 6-5.5v8" stroke={light?"#166B5A":"#F6FBF8"} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"/>
 </svg>
}
export function MeChatLogo({href="/",compact=false,light=false}:{href?:string;compact?:boolean;light?:boolean}){
 return <Link className="mechat-logo" href={href} aria-label="MeChat">
  <MeChatSymbol size={compact?31:36} light={light}/>
  {!compact&&<span className="mechat-wordmark">mechat<span className="logo-period">.</span></span>}
 </Link>
}

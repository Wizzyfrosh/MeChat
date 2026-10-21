import Link from "next/link";
export function Brand({href="/"}:{href?:string}) {
 return <Link href={href} className="brand" aria-label="MeChat home"><span className="brand-icon" aria-hidden="true"><svg width="27" height="27" viewBox="0 0 32 32" fill="none"><rect x="3" y="4" width="26" height="23" rx="9" fill="white"/><path d="M9 23v6l8-5" fill="white"/><path d="M9 19V12l7 7 7-7v7" stroke="#925fd2" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round"/></svg></span><span className="brand-name">MeChat<span>.</span></span></Link>;
}

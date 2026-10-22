"use client";

import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";

type InstallPrompt = Event & {
 prompt: () => Promise<void>;
 userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export function AppInstall() {
 const [prompt, setPrompt] = useState<InstallPrompt | null>(null);
 const [dismissed, setDismissed] = useState(false);
 const [installing, setInstalling] = useState(false);
 useEffect(() => {
  if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
   void navigator.serviceWorker.register("/sw.js", { scope: "/", updateViaCache: "none" }).catch(() => {
    // Installation remains available if offline support cannot be registered.
   });
  }
  const onPrompt = (event: Event) => {
   event.preventDefault();
   if (!window.matchMedia("(display-mode: standalone)").matches) setPrompt(event as InstallPrompt);
  };
  const onInstalled = () => setPrompt(null);
  window.addEventListener("beforeinstallprompt", onPrompt);
  window.addEventListener("appinstalled", onInstalled);
  return () => {
   window.removeEventListener("beforeinstallprompt", onPrompt);
   window.removeEventListener("appinstalled", onInstalled);
  };
 }, []);
 if (!prompt || dismissed) return null;
 return <aside className="app-install" aria-label="Install MeChat">
  <button type="button" disabled={installing} onClick={async () => {
   setInstalling(true);
   try { await prompt.prompt(); await prompt.userChoice; } catch {
    // A consumed or unavailable browser prompt can be retried from Chrome’s menu.
   } finally { setPrompt(null); setInstalling(false); }
  }}><Download size={16} aria-hidden="true" />Install MeChat</button>
  <button type="button" aria-label="Dismiss install suggestion" onClick={() => setDismissed(true)}><X size={16} /></button>
 </aside>;
}

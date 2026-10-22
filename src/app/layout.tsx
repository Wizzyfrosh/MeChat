import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AppInstall } from "@/components/app-install";
export const metadata: Metadata = {
 title: { default: "MeChat — Make room for curiosity", template: "%s | MeChat" },
 description: "MeChat is a focused AI chat web app with saved conversations, multiple AI models, and account-controlled preferences.",
 manifest: "/manifest.webmanifest",
 applicationName: "MeChat",
 appleWebApp: { capable: true, statusBarStyle: "default", title: "MeChat" },
 icons: { icon: "/favicon.svg", apple: "/icons/apple-touch-icon.png" },
};
export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover", themeColor: "#166b5a" };
export default function RootLayout({children}: Readonly<{children: React.ReactNode}>) {
 return <html lang="en" suppressHydrationWarning><body>{children}<AppInstall /></body></html>;
}

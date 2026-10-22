import type { Metadata, Viewport } from "next";
import "./globals.css";
export const metadata: Metadata = {
 title: { default: "MeChat — Make room for curiosity", template: "%s | MeChat" },
 description: "MeChat is a focused AI chat web app with saved conversations, multiple AI models, and account-controlled preferences.",
 icons: { icon: "/favicon.svg" },
};
export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#f7f8f6" };
export default function RootLayout({children}: Readonly<{children: React.ReactNode}>) {
 return <html lang="en" suppressHydrationWarning><body>{children}</body></html>;
}

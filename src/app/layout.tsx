import type { Metadata, Viewport } from "next";
import "./globals.css";
export const metadata: Metadata = {
 title: { default: "MeChat — Make room for curiosity", template: "%s | MeChat" },
 description: "MeChat is a beautifully designed AI conversation workspace. Explore the first preview of smart chat and voice.",
 icons: { icon: "/favicon.svg" },
};
export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#f8f2fd" };
export default function RootLayout({children}: Readonly<{children: React.ReactNode}>) {
 return <html lang="en" suppressHydrationWarning><body>{children}</body></html>;
}

import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
 return {
  id: "/", name: "MeChat", short_name: "MeChat",
  description: "Your focused space for AI conversations.",
  start_url: "/chat", scope: "/", display: "standalone",
  background_color: "#f7f8f6", theme_color: "#166b5a",
  lang: "en", prefer_related_applications: false,
  icons: [
   { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
   { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
   { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
  ],
 };
}

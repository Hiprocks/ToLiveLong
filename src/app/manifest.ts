import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "투리브롱 - 식단 관리",
    short_name: "투리브롱",
    description: "개인 맞춤 식단을 기록하고 관리하는 서비스",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#080f1a",
    theme_color: "#080f1a",
    lang: "ko",
    icons: [
      {
        src: "/assets/pwa/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/assets/pwa/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: "/assets/pwa/icon-512-maskable.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}

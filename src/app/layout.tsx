import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import BottomNav from "@/components/BottomNav";
import PwaServiceWorker from "@/components/PwaServiceWorker";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "투리브롱 - 식단 관리",
  description: "개인 맞춤 식단을 기록하고 관리하는 서비스",
  manifest: "/manifest.webmanifest",
  applicationName: "투리브롱",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "투리브롱",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    apple: [{ url: "/assets/pwa/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
    icon: [
      { url: "/assets/pwa/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/assets/pwa/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#080f1a",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className={`${geistSans.variable} ${geistMono.variable} bg-background text-foreground antialiased`}>
        <PwaServiceWorker />
        <div className="relative mx-auto min-h-screen max-w-md pb-20">
          {children}
          <BottomNav />
        </div>
      </body>
    </html>
  );
}

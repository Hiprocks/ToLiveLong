import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import BottomNav from "@/components/BottomNav";
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
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className={`${geistSans.variable} ${geistMono.variable} bg-background text-foreground antialiased`}>
        <div className="relative mx-auto min-h-screen max-w-md pb-20">
          {children}
          <BottomNav />
        </div>
      </body>
    </html>
  );
}

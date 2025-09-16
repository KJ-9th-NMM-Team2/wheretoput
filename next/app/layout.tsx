import type { Metadata } from "next";
import { SessionProvider } from "next-auth/react";
import { auth } from "@/lib/auth";
import ConditionalHeader from "../components/layout/ConditionalHeader";
import "./globals.css";
import ChatButton from "@/components/chat/ChatButton";
import { Toaster } from "react-hot-toast";
import localFont from "next/font/local";

const myFont = localFont({
  src: "../public/fonts/PretendardVariable.woff2",
  fallback: [
    "-apple-system",
    "BlinkMacSystemFont",
    "Apple SD Gothic Neo",
    "Segoe UI",
    "Noto Sans KR",
    "Malgun Gothic",
    "맑은 고딕",
    "sans-serif",
  ],
});

export const metadata: Metadata = {
  title: "어따놀래",
  description: "3D 인테리어 시뮬레이터",
  icons: {
    icon: [{ url: "/asset/wheretoput.png", sizes: "16x16", type: "image/png" }],
    shortcut: "/asset/wheretoput.png",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();
  return (
    <html lang="kr" className={myFont.className}>
      <head>
        <link rel="icon" href="/asset/wheretoput.png" type="image/png" />
        <link
          rel="shortcut icon"
          href="/asset/wheretoput.png"
          type="image/png"
        />
        <link rel="preconnect" href="https://raw.githubusercontent.com" />
        <link rel="dns-prefetch" href="https://raw.githubusercontent.com" />
      </head>
      <body>
        <SessionProvider session={session}>
          <ConditionalHeader />
          {children}
          <ChatButton currentUserId={session?.user?.id || null} />
          <Toaster />
        </SessionProvider>
      </body>
    </html>
  );
}

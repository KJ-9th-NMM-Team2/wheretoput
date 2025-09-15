import type { Metadata } from "next";
import { SessionProvider } from "next-auth/react";
import { auth } from "@/lib/auth";
import ConditionalHeader from "../components/layout/ConditionalHeader";
import "./globals.css";
import ChatButton from "@/components/chat/ChatButton";
import { Toaster } from "react-hot-toast";

export const metadata: Metadata = {
  title: "어따놀래",
  description: "3D 인테리어 시뮬레이터",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();
  return (
    <html lang="kr">
      <head>
        <link rel="icon" href="/favicon.ico" />
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

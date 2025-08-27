import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "WhereToput - 공간 배치 최적화 플랫폼",
  description: "효율적인 공간 배치를 위한 협업 플랫폼",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="font-sans antialiased">
        {children}
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "API代理服务",
  description: "基于Next.js的API跨域代理转发服务",
  icons: [
    {
      url: "/logo.png",
      href: "/logo.png"
    }
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}

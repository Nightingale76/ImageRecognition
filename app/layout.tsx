import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "图片识别助手",
  description: "上传图片，使用 AI 识别图片内容",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="zh-CN"
      className="h-full antialiased"
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}

import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "WhatTalk Prompt Agent",
  description: "AI-powered voice assistant designer for WhatTalk",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className="h-full">{children}</body>
    </html>
  );
}

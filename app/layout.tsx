import "./globals.css";
import { ReactNode } from "react";

export const metadata = {
  title: "MockMaster AI",
  description: "AI-driven mock interview practice for school admissions",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}

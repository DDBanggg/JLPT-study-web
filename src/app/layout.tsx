import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "N3 Study Web",
  description: "Desktop-first JLPT N3 study application",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="vi">
      <body>{children}</body>
    </html>
  );
}

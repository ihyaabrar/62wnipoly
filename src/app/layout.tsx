import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "+62WNIPOLY",
  description: "Monopoli satire Indonesia dalam 3D: bukan siapa yang paling kaya, siapa yang paling kuat bertahan jadi WNI.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}

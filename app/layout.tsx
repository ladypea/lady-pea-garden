import "./globals.css";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Lady Pea's Garden",
  description: "A cozy-chaotic stream garden mini-game."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5">
          <Link href="/" className="text-xl font-black tracking-tight">🌱 Lady Pea&apos;s Garden</Link>
          <div className="flex gap-4 text-sm text-pink-100">
            <Link href="/garden">Garden</Link>
            <Link href="/leaderboard">Leaderboard</Link>
            <Link href="/overlay">Overlay</Link>
          </div>
        </nav>
        {children}
      </body>
    </html>
  );
}

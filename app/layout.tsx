import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Q64 — Chess Reimagined",
  description: "Q64, a standalone chess game by Dark Node Game Studio. Play, learn and challenge LUPUS, your AI chess companion.",
  applicationName: "Q64",
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
  themeColor: "#05070f",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

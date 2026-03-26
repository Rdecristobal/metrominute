import type { Metadata } from "next";
import { Geist, Geist_Mono, Press_Start_2P, VT323 } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Añadir fuentes retro
const pressStart2P = Press_Start_2P({
  variable: "--font-arcade",
  subsets: ["latin"],
  weight: "400",
  display: "swap",
});

const vt323 = VT323({
  variable: "--font-terminal",
  subsets: ["latin"],
  weight: "400",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Metro Minute - Arcade Hub",
  description: "Your daily dose of arcade games. Play retro-style minigames!",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`dark ${geistSans.variable} ${geistMono.variable} ${pressStart2P.variable} ${vt323.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-retro-dark">{children}</body>
    </html>
  );
}

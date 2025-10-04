import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "The Hunt",
  description: "An interactive treasure hunt challenge application with clues, team management, and photo submissions.",
  keywords: ["hunt", "treasure hunt", "challenge", "game", "team", "competition"],
  authors: [{ name: "The Hunt Team" }],
  creator: "The Hunt Team",
  metadataBase: new URL('https://therace-pnq3klvtb-shannon-5385s-projects.vercel.app'),
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://therace-pnq3klvtb-shannon-5385s-projects.vercel.app',
    siteName: 'The Hunt',
    title: 'The Hunt',
    description: 'An interactive treasure hunt challenge application with clues, team management, and photo submissions.',
  },
  twitter: {
    card: 'summary',
    title: 'The Hunt',
    description: 'An interactive treasure hunt challenge application with clues, team management, and photo submissions.',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}

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
  title: "The Race",
  description: "An interactive Amazing Race style challenge application with clues, team management, and photo submissions.",
  keywords: ["race", "challenge", "game", "team", "competition", "amazing race"],
  authors: [{ name: "The Race Team" }],
  creator: "The Race Team",
  metadataBase: new URL('https://therace-pnq3klvtb-shannon-5385s-projects.vercel.app'),
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://therace-pnq3klvtb-shannon-5385s-projects.vercel.app',
    siteName: 'The Race',
    title: 'The Race',
    description: 'An interactive Amazing Race style challenge application with clues, team management, and photo submissions.',
  },
  twitter: {
    card: 'summary',
    title: 'The Race',
    description: 'An interactive Amazing Race style challenge application with clues, team management, and photo submissions.',
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

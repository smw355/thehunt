import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "../components/providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "The Hunt - Create Amazing Photo Hunt Competitions",
  description: "Turn any event into an unforgettable photo hunt adventure. Create competitive racing challenges with photo proof, team tracking, and real-time feedback in minutes. Perfect for corporate events, education, and community adventures.",
  keywords: ["treasure hunt", "photo challenge", "team building", "scavenger hunt", "corporate events", "team competition", "photo race", "amazing race", "team activities", "event platform"],
  authors: [{ name: "The Hunt Team" }],
  creator: "The Hunt Team",
  metadataBase: new URL(process.env.NEXTAUTH_URL || 'https://therace-xi.vercel.app'),
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: process.env.NEXTAUTH_URL || 'https://therace-xi.vercel.app',
    siteName: 'The Hunt',
    title: '🏹 The Hunt - Photo-Based Racing Competitions',
    description: 'Create competitive racing challenges with photo proof, team tracking, and real-time feedback in minutes. No apps to download. Works on any phone. Launch races in minutes!',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'The Hunt - Turn any event into an unforgettable adventure',
      }
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: '🏹 The Hunt - Create Amazing Photo Hunts',
    description: 'Photo-based racing competitions for teams, families, and communities. Launch in minutes, no apps required!',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
  alternates: {
    canonical: process.env.NEXTAUTH_URL || 'https://therace-xi.vercel.app',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}

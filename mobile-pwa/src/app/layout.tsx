import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ColorSchemeScript } from '@mantine/core';
import { Providers } from './providers';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
  preload: true,
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
  preload: true,
});

export const metadata: Metadata = {
  title: "Find Five - Time Tracker",
  description: "Voice-powered time tracking to identify tasks to delegate, automate, or eliminate",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Find Five",
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: "website",
    siteName: "Find Five",
    title: "Find Five - Time Tracker", 
    description: "Voice-powered time tracking to identify tasks to delegate, automate, or eliminate",
  },
  icons: {
    shortcut: "/favicon.svg",
    apple: [
      { url: "/icon-192x192.svg", sizes: "192x192", type: "image/svg+xml" },
    ],
  },
};

export const viewport: Viewport = {
  themeColor: "#FF6B6B",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <ColorSchemeScript defaultColorScheme="light" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>
          <AuthenticatedLayout>
            {children}
          </AuthenticatedLayout>
        </Providers>
      </body>
    </html>
  );
}

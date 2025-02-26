import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { LanguageProvider } from './contexts/LanguageContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { AudioProvider } from './contexts/AudioContext';
import { Inter } from 'next/font/google'
import { Toaster } from 'sonner'

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: "InnoCard",
  description: "InnoCard - 혁신적인 전자 명함 솔루션",
  icons: {
    icon: '/favicon.ico',
  },
  openGraph: {
    title: "InnoCard",
    description: "InnoCard - 혁신적인 전자 명함 솔루션",
    type: "website",
    images: [{
      url: '/og-image.png',
      width: 1200,
      height: 630,
      alt: 'InnoCard'
    }]
  },
  twitter: {
    card: 'summary_large_image',
    title: 'INNOCURVE',
    description: 'INNOCURVE - AI 기반 디지털 혁신 기업',
    images: ['/images/og-image.png'],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-icon.png" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased ${inter.className}`}
      >
        <Toaster 
          position="bottom-center"
          theme="light"
          richColors
          toastOptions={{
            duration: 2000,
            className: 'my-toast',
            style: {
              background: '#ffffff',
              border: '1px solid var(--border)',
              padding: '10px 16px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
              fontSize: '0.9rem',
              fontWeight: '500',
              borderRadius: '12px',
              marginBottom: '5rem',
              color: 'var(--foreground)'
            }
          }}
        />
        <ThemeProvider>
          <LanguageProvider>
            <AudioProvider>
              {children}
            </AudioProvider>
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
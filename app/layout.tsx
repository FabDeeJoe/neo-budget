import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SupabaseProvider } from '@/components/providers/supabase-provider'
import { AuthProvider } from '@/components/providers/auth-provider'
import { ExpensesProvider } from '@/components/providers/expenses-provider'

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Budget Tracker",
  description: "Simple and fast expense tracking - Record expenses in < 5 seconds",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Budget Tracker"
  }
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#10B981',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#10B981" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Budget Tracker" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen`}
      >
        <SupabaseProvider>
          <AuthProvider>
            <ExpensesProvider>
              {children}
            </ExpensesProvider>
          </AuthProvider>
        </SupabaseProvider>
      </body>
    </html>
  );
}

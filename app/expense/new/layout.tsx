import { Metadata, Viewport } from 'next'

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#059669',
}

export const metadata: Metadata = {
  title: '💰 Ajouter une dépense | Neo Budget',
  description: 'Ajoutez rapidement une nouvelle dépense en 2 taps seulement',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: '💰 Nouvelle dépense',
  },
  formatDetection: {
    telephone: false,
  },
  other: {
    'mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'default',
    'apple-mobile-web-app-title': '💰 Nouvelle dépense',
    'application-name': 'Neo Budget - Nouvelle dépense',
    'msapplication-TileColor': '#059669',
    'msapplication-config': '/browserconfig.xml',
  },
}

export default function NewExpenseLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
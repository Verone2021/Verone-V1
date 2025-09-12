import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import '../styles/globals.css'
import { AuthProviderSSR } from '@/providers/auth-provider-ssr'
import { ToastProvider } from '@/components/ui/toast'
import { Toaster } from 'sonner'
import { getServerAuthData } from '@/lib/auth/server-auth'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: {
    default: 'Want It Now — Gestion locative & sous-location',
    template: '%s | Want It Now'
  },
  description: 'Plateforme complète de gestion locative et sous-location immobilière. Gérez vos propriétaires, propriétés, contrats et réservations en toute simplicité.',
  keywords: ['gestion locative', 'sous-location', 'immobilier', 'propriétés', 'contrats', 'réservations'],
  authors: [{ name: 'Want It Now' }],
  creator: 'Want It Now',
  publisher: 'Want It Now',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://want-it-now.vercel.app'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'Want It Now — Gestion locative & sous-location',
    description: 'Plateforme complète de gestion locative et sous-location immobilière.',
    url: 'https://want-it-now.vercel.app',
    siteName: 'Want It Now',
    locale: 'fr_FR',
    type: 'website',
  },
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      noimageindex: false,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Charger les données auth côté serveur
  const initialAuthData = await getServerAuthData()

  return (
    <html lang="fr">
      <body className={inter.className}>
        <AuthProviderSSR initialData={initialAuthData}>
          <ToastProvider>
            {children}
            <Toaster position="top-right" richColors />
          </ToastProvider>
        </AuthProviderSSR>
      </body>
    </html>
  )
}
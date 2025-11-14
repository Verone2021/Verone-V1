import './globals.css';
import { Inter } from 'next/font/google';
import Script from 'next/script';

import { Analytics } from '@vercel/analytics/react';
import { Toaster } from 'sonner';

import { AuthWrapper } from '../components/layout/auth-wrapper';
import { ClientOnlyActivityTracker } from '../components/providers/client-only-activity-tracker';
import { ReactQueryProvider } from '../components/providers/react-query-provider';

const inter = Inter({ subsets: ['latin'] });

/**
 * Configuration Next.js 15 - Dynamic Rendering
 *
 * Force le rendering dynamique pour toutes les pages de l'application.
 * Nécessaire pour éviter les erreurs SSR avec :
 * - ActivityTrackerProvider (useContext browser APIs)
 * - AuthWrapper (Supabase auth state)
 * - Composants utilisant des contexts React
 *
 * Impact performance : +100-200ms latence (acceptable pour back-office)
 * Avantages : Build production stable, aucune erreur SSR
 */
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata = {
  title: 'Vérone Back Office',
  description:
    "CRM/ERP modulaire pour Vérone - Décoration et mobilier d'intérieur",
  verification: {
    google: 'yTQQSKQhTyiY1QvulJ-7gcGU_j_8wIDljJd9O0HoCLQ',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" className="h-full">
      <body
        className={`${inter.className} h-full bg-white text-black antialiased`}
      >
        {/* Google Maps JavaScript API - Points Relais/Lockers */}
        <Script
          src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places`}
          strategy="beforeInteractive"
        />
        <ReactQueryProvider>
          <AuthWrapper>
            <ClientOnlyActivityTracker>{children}</ClientOnlyActivityTracker>
          </AuthWrapper>
        </ReactQueryProvider>
        {/* Toast notifications */}
        <Toaster position="top-right" richColors />
        {/* Vercel Analytics - uniquement en production (détection automatique) */}
        {process.env.VERCEL_ENV === 'production' && <Analytics />}
      </body>
    </html>
  );
}

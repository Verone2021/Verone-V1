import './globals.css';
import { Inter } from 'next/font/google';
import Script from 'next/script';

import { Analytics } from '@vercel/analytics/react';
import { TooltipProvider } from '@verone/ui';
import { Toaster } from 'sonner';

import { AuthWrapper } from '../components/layout/auth-wrapper';
import { ClientOnlyActivityTracker } from '../components/providers/client-only-activity-tracker';
import { ReactQueryProvider } from '../components/providers/react-query-provider';
import { SentryUserProvider } from '../components/providers/sentry-user-provider';
import { SupabaseProvider } from '../components/providers/supabase-provider';

const inter = Inter({ subsets: ['latin'] });

/**
 * Configuration Next.js 15 - Dynamic Rendering
 *
 * Force le rendering dynamique pour l'authentification Supabase.
 * Nécessaire car le middleware et AuthWrapper accèdent aux cookies/session.
 *
 * TODO PERF: Migrer vers un pattern où seules les routes authentifiées
 * sont dynamiques, permettant le cache sur les pages publiques.
 */
export const dynamic = 'force-dynamic';

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
        <TooltipProvider>
          <ReactQueryProvider>
            <SupabaseProvider>
              <SentryUserProvider>
                <AuthWrapper>
                  <ClientOnlyActivityTracker>
                    {children}
                  </ClientOnlyActivityTracker>
                </AuthWrapper>
              </SentryUserProvider>
            </SupabaseProvider>
          </ReactQueryProvider>
        </TooltipProvider>
        {/* Toast notifications */}
        <Toaster position="top-right" richColors />
        {/* Vercel Analytics - uniquement en production (détection automatique) */}
        {process.env.VERCEL_ENV === 'production' && <Analytics />}
      </body>
    </html>
  );
}

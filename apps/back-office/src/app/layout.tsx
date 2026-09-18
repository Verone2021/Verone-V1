import './globals.css';
import { Inter } from 'next/font/google';

import { TooltipProvider } from '@verone/ui';
import { Toaster } from 'sonner';

import { AuthWrapper } from '../components/layout/auth-wrapper';
import { ClientOnlyActivityTracker } from '../components/providers/client-only-activity-tracker';
import { ErrorBoundary } from '../components/providers/error-boundary';
import { PosthogProvider } from '../components/providers/posthog-provider';
import { ReactQueryProvider } from '../components/providers/react-query-provider';
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
  /**
   * Outil interne, entierement en francais. La traduction automatique de Chrome
   * reecrit des noeuds de texte dans le DOM, React perd ses reperes et leve une
   * erreur non rattrapee. Cause probable du plantage du 17/09 (capture d'ecran
   * en portugais alors que le code est en francais). [BO-OBS-001]
   */
  other: {
    google: 'notranslate',
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" className="h-full" translate="no">
      <body
        className={`${inter.className} notranslate h-full bg-white text-black antialiased`}
      >
        {/*
          PostHog en premier : quand le filet ci-dessous attrape une erreur,
          l'outil doit deja etre pret a la remonter.
          Puis le filet AU-DESSUS des fournisseurs : une erreur nee dans l'un
          d'eux echappe a `app/error.tsx` et demonte toute l'application.
        */}
        <PosthogProvider>
          <ErrorBoundary>
            <TooltipProvider>
              <ReactQueryProvider>
                <SupabaseProvider>
                  <AuthWrapper>
                    <ClientOnlyActivityTracker>
                      {children}
                    </ClientOnlyActivityTracker>
                  </AuthWrapper>
                </SupabaseProvider>
              </ReactQueryProvider>
            </TooltipProvider>
          </ErrorBoundary>
        </PosthogProvider>
        {/* Toast notifications */}
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}

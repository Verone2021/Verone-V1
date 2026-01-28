/**
 * Layout pour les pages marketing LinkMe
 *
 * Inclut Header et Footer publics + Providers minimaux
 * (QueryClient uniquement, pas d'AuthProvider)
 *
 * @module MarketingLayout
 * @since 2026-01-23
 */

import { LandingHeader, LandingFooter } from '@/components/landing';
import { MarketingProviders } from '@/components/providers/MarketingProviders';

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <MarketingProviders>
      <div className="min-h-screen flex flex-col bg-white">
        <LandingHeader />
        <main className="flex-1 pt-16">{children}</main>
        <LandingFooter />
      </div>
    </MarketingProviders>
  );
}

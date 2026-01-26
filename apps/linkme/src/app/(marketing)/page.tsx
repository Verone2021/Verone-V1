/**
 * Page d'accueil LinkMe - Landing page publique
 *
 * Page marketing accessible sans connexion.
 * Le Header et Footer sont fournis par le layout (marketing).
 *
 * @module HomePage
 * @since 2026-01-23
 */

// Force dynamic rendering car les composants utilisent react-query
export const dynamic = 'force-dynamic';

import {
  LandingHero,
  LandingFeatures,
  LandingHowItWorks,
  LandingPricing,
  LandingMarketplace,
  LandingCTA,
} from '@/components/landing';

export default function HomePage(): JSX.Element {
  return (
    <>
      <LandingHero />
      <LandingFeatures />
      <LandingHowItWorks />
      <LandingPricing />
      <LandingMarketplace />
      <LandingCTA />
    </>
  );
}

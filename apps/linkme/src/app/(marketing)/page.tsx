/**
 * Page d'accueil LinkMe - Landing page publique
 *
 * Page marketing accessible sans connexion.
 * Le Header et Footer sont fournis par le layout (marketing).
 *
 * @module HomePage
 * @since 2026-01-23
 * @updated 2026-05-13 - LM-MKT-001 : composants 100 % statiques, plus de
 *                       fetch côté client → on laisse Next.js prérendrer.
 */

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

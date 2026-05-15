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
 * @updated 2026-05-15 - LM-SEO-NAV-BLOG-001 : SSG forcé + Organization JSON-LD.
 */

import {
  LandingHero,
  LandingFeatures,
  LandingHowItWorks,
  LandingPricing,
  LandingMarketplace,
  LandingCTA,
} from '@/components/landing';
import { OrganizationJsonLd } from '@/components/seo/JsonLd';

export const dynamic = 'force-static';
export const revalidate = 3600;

export default function HomePage(): JSX.Element {
  return (
    <>
      <OrganizationJsonLd />
      <LandingHero />
      <LandingFeatures />
      <LandingHowItWorks />
      <LandingPricing />
      <LandingMarketplace />
      <LandingCTA />
    </>
  );
}

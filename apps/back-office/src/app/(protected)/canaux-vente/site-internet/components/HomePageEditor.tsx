'use client';

/**
 * HomePageEditor — sous-onglet "Accueil" du canal site-internet (BO-SITE-CMS-001).
 *
 * Regroupe tout ce qui est configurable sur la page d'accueil
 * veronecollections.fr :
 *  - Bandeau promotionnel (top du site, toutes pages)
 *  - Section Hero (titre + sous-titre + CTA + image)
 *  - Produits mis en avant (4 slots)
 *  - Barre de réassurance
 *
 * Réutilise les éditeurs existants de CMSSection et ajoute le manager produits.
 */

import {
  CMSBannerEditor,
  CMSHeroEditor,
  CMSReassuranceEditor,
} from './CMSSection';
import { FeaturedProductsManager } from './FeaturedProductsManager';

export function HomePageEditor() {
  return (
    <div className="space-y-6">
      <CMSBannerEditor />
      <CMSHeroEditor />
      <FeaturedProductsManager />
      <CMSReassuranceEditor />
    </div>
  );
}

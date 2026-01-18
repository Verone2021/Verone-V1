import { ConfigurableDashboard } from './components/configurable-dashboard';

/**
 * Dashboard Principal Verone - Version Configurable
 *
 * Note: Route renommée de /dashboard à /accueil pour contourner bug Vercel.
 * Un redirect /dashboard → /accueil est configuré dans next.config.js
 *
 * Features:
 * - Navigation par onglets (Aperçu, Ventes, Stock, Finances, LinkMe)
 * - KPIs configurables par utilisateur
 * - Période modifiable par KPI (jour/semaine/mois/trimestre/année)
 * - Présets par rôle (Direction, Commercial, Logistique, Comptabilité, LinkMe)
 *
 * @see /accueil/lib/kpi-catalog.ts - Catalogue des 25+ KPIs disponibles
 * @see /accueil/lib/role-presets.ts - Présets par rôle
 * @see /accueil/hooks/use-dashboard-preferences.ts - Gestion des préférences
 */

/**
 * Force dynamic rendering at request time.
 * This ensures the route is included in Vercel builds.
 */
export const dynamic = 'force-dynamic';

export default function AccueilPage() {
  return <ConfigurableDashboard />;
}

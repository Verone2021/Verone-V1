import { ConfigurableDashboard } from './components/configurable-dashboard';

/**
 * Dashboard Principal Verone - Version Configurable
 *
 * Features:
 * - Navigation par onglets (Aperçu, Ventes, Stock, Finances, LinkMe)
 * - KPIs configurables par utilisateur
 * - Période modifiable par KPI (jour/semaine/mois/trimestre/année)
 * - Présets par rôle (Direction, Commercial, Logistique, Comptabilité, LinkMe)
 *
 * @see /dashboard/lib/kpi-catalog.ts - Catalogue des 25+ KPIs disponibles
 * @see /dashboard/lib/role-presets.ts - Présets par rôle
 * @see /dashboard/hooks/use-dashboard-preferences.ts - Gestion des préférences
 *
 * IMPORTANT: This page is a Server Component (no 'use client').
 * The dynamic rendering is already handled by the (protected)/layout.tsx.
 * ConfigurableDashboard is the Client Component that handles all interactivity.
 */

/**
 * Force dynamic rendering at request time.
 * This ensures the route is included in Vercel builds.
 * Without this, Next.js might skip this route during build due to auth checks in the layout.
 */
export const dynamic = 'force-dynamic';

export default function DashboardPage() {
  return <ConfigurableDashboard />;
}

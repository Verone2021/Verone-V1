'use client';

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
 */
export default function DashboardPage() {
  return <ConfigurableDashboard />;
}

/**
 * @verone/kpi
 * Documentation KPI et métriques business pour le monorepo Vérone
 */

// Types KPI
export interface KPIConfig {
  id: string;
  name: string;
  description: string;
  category:
    | 'users'
    | 'organisations'
    | 'catalogue'
    | 'stocks'
    | 'orders'
    | 'finance';
  query: string;
  format?: 'number' | 'currency' | 'percentage' | 'date';
  threshold?: {
    warning?: number;
    critical?: number;
  };
}

// Export configuration KPI (à étendre avec fichiers YAML)
export const kpiRegistry: KPIConfig[] = [];

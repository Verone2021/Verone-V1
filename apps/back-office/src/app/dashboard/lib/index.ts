// Dashboard Lib - Exports centralisés

export {
  KPI_CATALOG,
  getDefaultKPIsForTab,
  getKPIsByCategory,
  PERIOD_LABELS,
  CATEGORY_LABELS,
} from './kpi-catalog';

export type { KPIPeriod, KPICategory, KPIDefinition } from './kpi-catalog';

export {
  ROLE_PRESETS,
  getDefaultPreset,
  getAvailablePresets,
  getPresetWidgetsForTab,
} from './role-presets';

export type { UserRole, RolePreset } from './role-presets';

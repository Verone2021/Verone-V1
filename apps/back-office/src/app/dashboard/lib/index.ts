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
  WIDGET_CATALOG,
  getDefaultWidgetsForTab,
  getWidgetsByCategory,
  SIZE_LABELS,
  SIZE_COLUMNS,
} from './widget-catalog';

export type { WidgetSize, WidgetDefinition } from './widget-catalog';

export {
  CHART_CATALOG,
  CHART_COLORS,
  getDefaultChartsForTab,
  getChartsByCategory,
  getChartsByType,
  CHART_TYPE_LABELS,
  CHART_SIZE_LABELS,
  CHART_SIZE_COLUMNS,
} from './chart-catalog';

export type { ChartType, ChartSize, ChartDefinition } from './chart-catalog';

export {
  ROLE_PRESETS,
  getDefaultPreset,
  getAvailablePresets,
  getPresetWidgetsForTab,
} from './role-presets';

export type { UserRole, RolePreset } from './role-presets';

'use client';

import { useCallback, useEffect, useState } from 'react';

import { createClient } from '@verone/utils/supabase/client';

import type { Json } from '@/types/supabase';

import type { DashboardTab } from '../components/dashboard-tabs';
import {
  type KPIPeriod,
  KPI_CATALOG,
  getDefaultKPIsForTab,
} from '../lib/kpi-catalog';

// ============================================================================
// Types
// ============================================================================

export interface DashboardWidget {
  type: 'kpi' | 'chart' | 'list';
  kpi_id: string;
  period: KPIPeriod;
  position: number;
}

export interface DashboardPreferences {
  id: string;
  user_id: string;
  tab: DashboardTab;
  widgets: DashboardWidget[];
  created_at: string;
  updated_at: string;
}

interface UseDashboardPreferencesReturn {
  preferences: DashboardPreferences | null;
  widgets: DashboardWidget[];
  isLoading: boolean;
  error: Error | null;
  // Actions
  updateWidgets: (widgets: DashboardWidget[]) => Promise<void>;
  addWidget: (kpiId: string, period?: KPIPeriod) => Promise<void>;
  removeWidget: (kpiId: string) => Promise<void>;
  updateWidgetPeriod: (kpiId: string, period: KPIPeriod) => Promise<void>;
  reorderWidgets: (fromIndex: number, toIndex: number) => Promise<void>;
  resetToDefaults: () => Promise<void>;
}

// ============================================================================
// Hook
// ============================================================================

export function useDashboardPreferences(
  tab: DashboardTab
): UseDashboardPreferencesReturn {
  const [preferences, setPreferences] = useState<DashboardPreferences | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // ============================================================================
  // Générer les widgets par défaut pour un onglet
  // ============================================================================
  const getDefaultWidgets = useCallback(
    (tabName: DashboardTab): DashboardWidget[] => {
      const defaultKPIs = getDefaultKPIsForTab(tabName);
      return defaultKPIs.slice(0, 6).map((kpi, index) => ({
        type: 'kpi' as const,
        kpi_id: kpi.id,
        period: kpi.defaultPeriod,
        position: index,
      }));
    },
    []
  );

  // ============================================================================
  // Charger les préférences depuis Supabase
  // ============================================================================
  const loadPreferences = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const supabase = createClient();

      // Vérifier l'authentification
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        // Si pas d'utilisateur, utiliser les widgets par défaut
        setPreferences(null);
        setIsLoading(false);
        return;
      }

      // Charger les préférences existantes
      const { data, error: fetchError } = await supabase
        .from('user_dashboard_preferences')
        .select('*')
        .eq('user_id', user.id)
        .eq('tab', tab)
        .single();

      if (fetchError) {
        // Si pas de préférences trouvées (PGRST116), créer avec les défauts
        if (fetchError.code === 'PGRST116') {
          const defaultWidgets = getDefaultWidgets(tab);

          const { data: newPrefs, error: insertError } = await supabase
            .from('user_dashboard_preferences')
            .insert({
              user_id: user.id,
              tab,
              widgets: defaultWidgets as unknown as Json,
            })
            .select()
            .single();

          if (insertError) {
            // Si la table n'existe pas encore, utiliser les défauts localement
            console.warn(
              'Dashboard preferences table may not exist yet:',
              insertError.message
            );
            setPreferences(null);
          } else {
            setPreferences(newPrefs as unknown as DashboardPreferences);
          }
        } else {
          throw fetchError;
        }
      } else {
        setPreferences(data as unknown as DashboardPreferences);
      }
    } catch (err) {
      console.error('Error loading dashboard preferences:', err);
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setIsLoading(false);
    }
  }, [tab, getDefaultWidgets]);

  // ============================================================================
  // Sauvegarder les widgets
  // ============================================================================
  const saveWidgets = useCallback(
    async (newWidgets: DashboardWidget[]) => {
      try {
        const supabase = createClient();

        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          throw new Error('User not authenticated');
        }

        const { data, error: updateError } = await supabase
          .from('user_dashboard_preferences')
          .upsert(
            {
              user_id: user.id,
              tab,
              widgets: newWidgets as unknown as Json,
              updated_at: new Date().toISOString(),
            },
            {
              onConflict: 'user_id,tab',
            }
          )
          .select()
          .single();

        if (updateError) {
          // Si la table n'existe pas, sauvegarder localement
          console.warn('Could not save preferences:', updateError.message);
          setPreferences(prev =>
            prev ? { ...prev, widgets: newWidgets } : null
          );
          return;
        }

        setPreferences(data as unknown as DashboardPreferences);
      } catch (err) {
        console.error('Error saving dashboard preferences:', err);
        setError(err instanceof Error ? err : new Error(String(err)));
      }
    },
    [tab]
  );

  // ============================================================================
  // Actions
  // ============================================================================

  const updateWidgets = useCallback(
    async (widgets: DashboardWidget[]) => {
      await saveWidgets(widgets);
    },
    [saveWidgets]
  );

  const addWidget = useCallback(
    async (kpiId: string, period?: KPIPeriod) => {
      const kpiDef = KPI_CATALOG[kpiId];
      if (!kpiDef) {
        console.error(`KPI not found: ${kpiId}`);
        return;
      }

      const currentWidgets = preferences?.widgets || getDefaultWidgets(tab);

      // Vérifier si le KPI est déjà présent
      if (currentWidgets.some(w => w.kpi_id === kpiId)) {
        console.warn(`KPI already in dashboard: ${kpiId}`);
        return;
      }

      // Limite max 6 KPIs
      if (currentWidgets.length >= 6) {
        console.warn('Maximum widgets reached (6)');
        return;
      }

      const newWidget: DashboardWidget = {
        type: 'kpi',
        kpi_id: kpiId,
        period: period || kpiDef.defaultPeriod,
        position: currentWidgets.length,
      };

      await saveWidgets([...currentWidgets, newWidget]);
    },
    [preferences, tab, getDefaultWidgets, saveWidgets]
  );

  const removeWidget = useCallback(
    async (kpiId: string) => {
      const currentWidgets = preferences?.widgets || getDefaultWidgets(tab);
      const filteredWidgets = currentWidgets
        .filter(w => w.kpi_id !== kpiId)
        .map((w, index) => ({ ...w, position: index }));

      await saveWidgets(filteredWidgets);
    },
    [preferences, tab, getDefaultWidgets, saveWidgets]
  );

  const updateWidgetPeriod = useCallback(
    async (kpiId: string, period: KPIPeriod) => {
      const currentWidgets = preferences?.widgets || getDefaultWidgets(tab);
      const updatedWidgets = currentWidgets.map(w =>
        w.kpi_id === kpiId ? { ...w, period } : w
      );

      await saveWidgets(updatedWidgets);
    },
    [preferences, tab, getDefaultWidgets, saveWidgets]
  );

  const reorderWidgets = useCallback(
    async (fromIndex: number, toIndex: number) => {
      const currentWidgets = preferences?.widgets || getDefaultWidgets(tab);
      const newWidgets = [...currentWidgets];
      const [movedWidget] = newWidgets.splice(fromIndex, 1);
      newWidgets.splice(toIndex, 0, movedWidget);

      // Recalculer les positions
      const reorderedWidgets = newWidgets.map((w, index) => ({
        ...w,
        position: index,
      }));

      await saveWidgets(reorderedWidgets);
    },
    [preferences, tab, getDefaultWidgets, saveWidgets]
  );

  const resetToDefaults = useCallback(async () => {
    const defaultWidgets = getDefaultWidgets(tab);
    await saveWidgets(defaultWidgets);
  }, [tab, getDefaultWidgets, saveWidgets]);

  // ============================================================================
  // Charger au montage et quand l'onglet change
  // ============================================================================
  useEffect(() => {
    loadPreferences();
  }, [loadPreferences]);

  // ============================================================================
  // Retourner les widgets (depuis les préférences ou les défauts)
  // ============================================================================
  const widgets = preferences?.widgets || getDefaultWidgets(tab);

  return {
    preferences,
    widgets,
    isLoading,
    error,
    updateWidgets,
    addWidget,
    removeWidget,
    updateWidgetPeriod,
    reorderWidgets,
    resetToDefaults,
  };
}

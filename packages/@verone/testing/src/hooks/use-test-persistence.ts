/**
 * 🔒 Hook Validation Persistante - Meilleures Pratiques 2025
 * Tests verrouillés automatiquement après validation
 * Protection du code contre les régressions
 */

'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';

import { createClient } from '@verone/utils/supabase/client';

interface TestValidationState {
  id: string;
  test_id: string;
  status: 'pending' | 'running' | 'validated' | 'failed';
  execution_time_ms?: number;
  error_details?: any;
  validation_timestamp?: string;
  locked: boolean;
  module_name: string;
  test_title: string;
  browser_screenshot_url?: string;
  performance_metrics?: any;
  console_errors?: any;
  created_at: string;
  updated_at: string;
}

interface ModuleProgress {
  module_name: string;
  total_tests: number;
  validated_tests: number;
  failed_tests: number;
  locked_tests: number;
  completion_percentage: number;
  last_validation?: string;
}

export function useTestPersistence() {
  const [validationStates, setValidationStates] = useState<
    TestValidationState[]
  >([]);
  const [moduleProgress, setModuleProgress] = useState<ModuleProgress[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ✅ FIX: Use singleton client via useMemo
  const supabase = useMemo(() => createClient(), []);

  // 📊 Charger l'état de validation des tests
  const loadValidationStates = useCallback(
    async (moduleFilter?: string) => {
      try {
        setIsLoading(true);
        setError(null);

        // Note: test_validation_state is an optional testing table
        let query = (supabase.from as any)('test_validation_state')
          .select('*')
          .order('test_id');

        if (moduleFilter) {
          query = query.eq('module_name', moduleFilter);
        }

        const { data, error: fetchError } = await query;

        if (fetchError) {
          throw fetchError;
        }

        setValidationStates(data || []);

        // Charger aussi les statistiques des modules
        const { data: progressData, error: progressError } = await (
          supabase.from as any
        )('module_test_progress')
          .select('*')
          .order('module_name');

        if (progressError) {
          console.warn('Erreur chargement progress:', progressError);
        } else {
          setModuleProgress(progressData || []);
        }
      } catch (err: any) {
        console.error('Erreur chargement validation states:', err);
        setError(err.message || 'Erreur inconnue');
      } finally {
        setIsLoading(false);
      }
    },
    [supabase]
  );

  // 🔄 Mettre à jour le statut d'un test (avec verrouillage automatique)
  const updateTestStatus = useCallback(
    async (
      testId: string,
      status: TestValidationState['status'],
      additionalData?: {
        execution_time_ms?: number;
        error_details?: any;
        browser_screenshot_url?: string;
        performance_metrics?: any;
        console_errors?: any;
      }
    ) => {
      try {
        setError(null);

        const updateData: any = {
          status,
          ...additionalData,
        };

        // Le trigger auto_lock_validated_test() se charge du verrouillage automatique
        const { data, error: updateError } = await (supabase.from as any)(
          'test_validation_state'
        )
          .update(updateData)
          .eq('test_id', testId)
          .select('*')
          .single();

        if (updateError) {
          throw updateError;
        }

        // Mettre à jour l'état local immédiatement
        setValidationStates(prev =>
          prev.map(test =>
            test.test_id === testId ? { ...test, ...data } : test
          )
        );

        // Recharger les statistiques des modules
        const { data: progressData } = await (supabase.from as any)(
          'module_test_progress'
        )
          .select('*')
          .order('module_name');

        if (progressData) {
          setModuleProgress(progressData);
        }

        console.log(`🔒 Test ${testId} mis à jour:`, {
          status,
          locked: (data as TestValidationState)?.locked,
          validation_timestamp: (data as TestValidationState)
            ?.validation_timestamp,
        });

        return data;
      } catch (err: any) {
        console.error('Erreur mise à jour test status:', err);
        setError(err.message || 'Erreur mise à jour');
        throw err;
      }
    },
    [supabase]
  );

  // 🎯 Obtenir le statut d'un test spécifique
  const getTestStatus = useCallback(
    (testId: string): TestValidationState | null => {
      return validationStates.find(test => test.test_id === testId) || null;
    },
    [validationStates]
  );

  // 🔒 Vérifier si un test est verrouillé (protection code)
  const isTestLocked = useCallback(
    (testId: string): boolean => {
      const test = getTestStatus(testId);
      return test?.locked || false;
    },
    [getTestStatus]
  );

  // 📊 Obtenir les stats d'un module
  const getModuleStats = useCallback(
    (moduleName: string): ModuleProgress | null => {
      return (
        moduleProgress.find(module => module.module_name === moduleName) || null
      );
    },
    [moduleProgress]
  );

  // 🧹 Réinitialiser les tests d'un module (pour développement)
  const resetModuleTests = useCallback(
    async (moduleName: string, force: boolean = false) => {
      try {
        if (!force) {
          console.warn(
            '🔒 SÉCURITÉ: Réinitialisation bloquée - utilisez force=true en dev uniquement'
          );
          return false;
        }

        const { error: resetError } = await (supabase.from as any)(
          'test_validation_state'
        )
          .update({
            status: 'pending',
            locked: false,
            validation_timestamp: null,
            execution_time_ms: null,
            error_details: null,
            console_errors: null,
          })
          .eq('module_name', moduleName);

        if (resetError) {
          throw resetError;
        }

        await loadValidationStates(moduleName);
        return true;
      } catch (err: any) {
        console.error('Erreur reset module:', err);
        setError(err.message);
        return false;
      }
    },
    [supabase, loadValidationStates]
  );

  // 🎯 Exécuter un test avec validation automatique
  const executeTestWithValidation = useCallback(
    async (
      testId: string,
      testExecution: () => Promise<{
        success: boolean;
        execution_time_ms: number;
        error_details?: any;
        browser_screenshot_url?: string;
        performance_metrics?: any;
        console_errors?: any;
      }>
    ) => {
      // Vérifier si le test est verrouillé
      if (isTestLocked(testId)) {
        console.log(`🔒 Test ${testId} verrouillé - exécution bloquée`);
        return {
          success: false,
          error: 'Test verrouillé - validation déjà effectuée',
          locked: true,
        };
      }

      try {
        // Marquer comme en cours
        await updateTestStatus(testId, 'running');

        // Exécuter le test
        const result = await testExecution();

        // Sauvegarder le résultat avec verrouillage automatique
        const finalStatus = result.success ? 'validated' : 'failed';
        await updateTestStatus(testId, finalStatus, result);

        return {
          locked: result.success, // Verrouillage automatique si validé
          ...result,
        };
      } catch (err: any) {
        // Marquer comme échoué
        await updateTestStatus(testId, 'failed', {
          error_details: { error: err.message, stack: err.stack },
        });

        return {
          success: false,
          error: err.message,
          locked: false,
        };
      }
    },
    [updateTestStatus, isTestLocked]
  );

  // Chargement initial
  useEffect(() => {
    loadValidationStates();
  }, [loadValidationStates]);

  // Abonnement temps réel aux changements
  useEffect(() => {
    const channel = supabase
      .channel('test_validation_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'test_validation_state',
        },
        payload => {
          console.log('🔄 Changement validation détecté:', payload);
          loadValidationStates();
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [supabase, loadValidationStates]);

  return {
    // État
    validationStates,
    moduleProgress,
    isLoading,
    error,

    // Actions principales
    loadValidationStates,
    updateTestStatus,
    executeTestWithValidation,

    // Utilitaires
    getTestStatus,
    isTestLocked,
    getModuleStats,
    resetModuleTests,

    // Stats rapides
    totalTests: validationStates.length,
    validatedTests: validationStates.filter(t => t.status === 'validated')
      .length,
    lockedTests: validationStates.filter(t => t.locked).length,
    failedTests: validationStates.filter(t => t.status === 'failed').length,
  };
}

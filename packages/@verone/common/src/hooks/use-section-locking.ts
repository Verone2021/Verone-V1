'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';

import { createClient } from '@verone/utils/supabase/client';

export type {
  LockStatus,
  DeploymentPhase,
  SectionLockConfig,
  LockEvent,
  UseSectionLockingOptions,
  TestSection,
  TestMetrics,
} from './use-section-lock-config';

import {
  DEFAULT_LOCK_CONFIG,
  type LockStatus,
  type DeploymentPhase,
  type SectionLockConfig,
  type LockEvent,
  type UseSectionLockingOptions,
  type TestSection,
  type TestMetrics,
} from './use-section-lock-config';

export function useSectionLocking(
  sections: TestSection[],
  getSectionMetrics: (sectionId: string) => TestMetrics,
  options: UseSectionLockingOptions = {}
) {
  const {
    enableAutoLock = true,
    enableNotifications = true,
    strictMode = false,
    validationRequired = false,
  } = options;

  const [lockConfigs, setLockConfigs] =
    useState<Record<string, SectionLockConfig>>(DEFAULT_LOCK_CONFIG);
  const [lockEvents, setLockEvents] = useState<LockEvent[]>([]);
  const [pendingValidations, setPendingValidations] = useState<Set<string>>(
    new Set()
  );
  const [currentPhase, setCurrentPhase] =
    useState<DeploymentPhase>('development');

  const supabase = createClient();
  const supabaseRaw = supabase as unknown as {
    from: (table: string) => {
      insert: (data: Record<string, unknown>) => Promise<unknown>;
      upsert: (
        data: Record<string, unknown>,
        opts?: Record<string, unknown>
      ) => Promise<{ error: { message: string } | null }>;
    };
  };

  // Calculer le statut de lock pour chaque section
  const sectionLockStatuses = useMemo(() => {
    const statuses: Record<
      string,
      {
        status: LockStatus;
        canLock: boolean;
        canUnlock: boolean;
        blockedReason?: string;
        completionRate: number;
        config: SectionLockConfig;
      }
    > = {};

    sections.forEach(section => {
      const config = lockConfigs[section.id] ?? {
        sectionId: section.id,
        completionThreshold: 100,
        requiresValidation: false,
        blockedBy: [],
        phase: 'development',
        criticalSection: false,
        rollbackAllowed: true,
      };

      const metrics = getSectionMetrics(section.id);
      const completionRate = metrics.progressPercent;

      const blockedByUnsatisfied = config.blockedBy.filter(depId => {
        const depSection = sections.find(s => s.id === depId);
        return !depSection?.isLocked;
      });

      let status: LockStatus = 'unlocked';
      let canLock = false;
      let canUnlock = false;
      let blockedReason: string | undefined;

      if (section.isLocked) {
        status = 'locked';
        canUnlock = !strictMode && config.rollbackAllowed;
      } else {
        if (completionRate >= config.completionThreshold) {
          if (blockedByUnsatisfied.length === 0) {
            if (
              config.requiresValidation &&
              pendingValidations.has(section.id)
            ) {
              status = 'pending_lock';
              canLock = false;
            } else {
              canLock = true;
            }
          } else {
            blockedReason = `Bloqué par: ${blockedByUnsatisfied.join(', ')}`;
          }
        } else {
          blockedReason = `Completion requise: ${config.completionThreshold}% (actuel: ${completionRate}%)`;
        }
      }

      statuses[section.id] = {
        status,
        canLock,
        canUnlock,
        blockedReason,
        completionRate,
        config,
      };
    });

    return statuses;
  }, [
    sections,
    lockConfigs,
    getSectionMetrics,
    pendingValidations,
    strictMode,
  ]);

  const getEligibleForAutoLock = useCallback(() => {
    return Object.entries(sectionLockStatuses)
      .filter(
        ([sectionId, status]) =>
          enableAutoLock &&
          status.canLock &&
          !status.config.requiresValidation &&
          !pendingValidations.has(sectionId)
      )
      .map(([sectionId]) => sectionId);
  }, [sectionLockStatuses, enableAutoLock, pendingValidations]);

  const logLockEvent = useCallback(
    async (event: Omit<LockEvent, 'id' | 'timestamp'>) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const lockEvent: LockEvent = {
        ...event,
        id: `lock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date(),
        triggeredBy: event.triggeredBy ?? user?.id ?? 'system',
      };

      try {
        await supabaseRaw.from('test_sections_lock_events').insert({
          id: lockEvent.id,
          section_id: lockEvent.sectionId,
          event_type: lockEvent.eventType,
          triggered_by: lockEvent.triggeredBy,
          completion_rate: lockEvent.completionRate,
          reason: lockEvent.reason,
          metadata: lockEvent.metadata,
          created_at: lockEvent.timestamp.toISOString(),
        });
      } catch (error) {
        console.error('Error logging lock event:', error);
      }

      setLockEvents(prev => [lockEvent, ...prev.slice(0, 99)]);
      return lockEvent;
    },
    [supabase, supabaseRaw]
  );

  const lockSection = useCallback(
    async (
      sectionId: string,
      force = false,
      reason?: string
    ): Promise<boolean> => {
      const sectionStatus = sectionLockStatuses[sectionId];
      if (!sectionStatus) return false;

      if (!force && !sectionStatus.canLock) {
        console.warn(
          `Cannot lock section ${sectionId}: ${sectionStatus.blockedReason}`
        );
        return false;
      }

      if (
        sectionStatus.config.requiresValidation &&
        !force &&
        validationRequired
      ) {
        setPendingValidations(prev => new Set([...prev, sectionId]));

        await logLockEvent({
          sectionId,
          eventType: 'validation_required',
          completionRate: sectionStatus.completionRate,
          reason: reason ?? 'Validation required before lock',
          triggeredBy: 'system',
        });

        return false;
      }

      try {
        const { error } = await supabaseRaw.from('test_sections_lock').upsert(
          {
            section_id: sectionId,
            locked: true,
            locked_at: new Date().toISOString(),
            completion_rate: sectionStatus.completionRate,
            phase: sectionStatus.config.phase,
            locked_reason: reason,
          },
          { onConflict: 'section_id' }
        );

        if (error) throw error;

        await logLockEvent({
          sectionId,
          eventType: force ? 'force_lock' : 'auto_lock',
          completionRate: sectionStatus.completionRate,
          reason:
            reason ?? `Section completed at ${sectionStatus.completionRate}%`,
          triggeredBy: force ? 'user' : 'system',
        });

        setPendingValidations(prev => {
          const newSet = new Set(prev);
          newSet.delete(sectionId);
          return newSet;
        });

        if (enableNotifications) {
          console.warn(`Section "${sectionId}" verrouillée avec succès`);
        }

        return true;
      } catch (error) {
        console.error('Error locking section:', error);
        return false;
      }
    },
    [
      sectionLockStatuses,
      supabaseRaw,
      logLockEvent,
      validationRequired,
      enableNotifications,
    ]
  );

  const unlockSection = useCallback(
    async (sectionId: string, reason?: string): Promise<boolean> => {
      const sectionStatus = sectionLockStatuses[sectionId];
      if (!sectionStatus) return false;

      if (!sectionStatus.canUnlock) {
        console.warn(
          `Cannot unlock section ${sectionId}: rollback not allowed or strict mode`
        );
        return false;
      }

      try {
        const { error } = await supabaseRaw.from('test_sections_lock').upsert(
          {
            section_id: sectionId,
            locked: false,
            unlocked_at: new Date().toISOString(),
            unlock_reason: reason,
          },
          { onConflict: 'section_id' }
        );

        if (error) throw error;

        await logLockEvent({
          sectionId,
          eventType: 'unlock',
          completionRate: sectionStatus.completionRate,
          reason: reason ?? 'Manual unlock',
          triggeredBy: 'user',
        });

        if (enableNotifications) {
          console.warn(`Section "${sectionId}" déverrouillée`);
        }

        return true;
      } catch (error) {
        console.error('Error unlocking section:', error);
        return false;
      }
    },
    [sectionLockStatuses, supabaseRaw, logLockEvent, enableNotifications]
  );

  const validateSection = useCallback(
    async (sectionId: string, approved: boolean, reason?: string) => {
      if (!pendingValidations.has(sectionId)) return false;

      if (approved) {
        const success = await lockSection(
          sectionId,
          true,
          reason ?? 'Manually validated'
        );
        if (success) {
          setPendingValidations(prev => {
            const newSet = new Set(prev);
            newSet.delete(sectionId);
            return newSet;
          });
        }
        return success;
      } else {
        setPendingValidations(prev => {
          const newSet = new Set(prev);
          newSet.delete(sectionId);
          return newSet;
        });

        await logLockEvent({
          sectionId,
          eventType: 'validation_required',
          completionRate: sectionLockStatuses[sectionId]?.completionRate ?? 0,
          reason: reason ?? 'Validation rejected',
          triggeredBy: 'user',
        });

        return false;
      }
    },
    [pendingValidations, lockSection, logLockEvent, sectionLockStatuses]
  );

  // Auto-lock des sections éligibles
  useEffect(() => {
    if (!enableAutoLock) return;

    const eligibleSections = getEligibleForAutoLock();
    eligibleSections.forEach(sectionId => {
      void lockSection(sectionId, false, 'Auto-lock triggered');
    });
  }, [enableAutoLock, getEligibleForAutoLock, lockSection]);

  // Calculer la progression de déploiement par phase
  const deploymentProgress = useMemo(() => {
    const phases = [
      'development',
      'staging',
      'pre_production',
      'production',
    ] as const;
    const progress: Record<
      DeploymentPhase,
      {
        total: number;
        locked: number;
        percentage: number;
        sections: string[];
      }
    > = {
      development: { total: 0, locked: 0, percentage: 0, sections: [] },
      staging: { total: 0, locked: 0, percentage: 0, sections: [] },
      pre_production: { total: 0, locked: 0, percentage: 0, sections: [] },
      production: { total: 0, locked: 0, percentage: 0, sections: [] },
    };

    sections.forEach(section => {
      const config = lockConfigs[section.id];
      if (config) {
        progress[config.phase].total++;
        progress[config.phase].sections.push(section.id);
        if (section.isLocked) {
          progress[config.phase].locked++;
        }
      }
    });

    phases.forEach(phase => {
      const p = progress[phase];
      p.percentage = p.total > 0 ? Math.round((p.locked / p.total) * 100) : 0;
    });

    return progress;
  }, [sections, lockConfigs]);

  return {
    lockConfigs,
    setLockConfigs,
    sectionLockStatuses,
    lockEvents,
    pendingValidations: Array.from(pendingValidations),
    currentPhase,
    deploymentProgress,

    lockSection,
    unlockSection,
    validateSection,

    getEligibleForAutoLock,
    canDeployPhase: (phase: DeploymentPhase) => {
      const phaseOrder: DeploymentPhase[] = [
        'development',
        'staging',
        'pre_production',
        'production',
      ];
      const currentIndex = phaseOrder.indexOf(currentPhase);
      const targetIndex = phaseOrder.indexOf(phase);
      return targetIndex <= currentIndex + 1;
    },

    getPhaseReadiness: (phase: DeploymentPhase) => deploymentProgress[phase],

    getCriticalSectionsStatus: () => {
      return sections
        .filter(section => lockConfigs[section.id]?.criticalSection)
        .map(section => ({
          sectionId: section.id,
          isLocked: section.isLocked,
          completionRate: sectionLockStatuses[section.id]?.completionRate ?? 0,
          canLock: sectionLockStatuses[section.id]?.canLock ?? false,
        }));
    },

    updatePhase: (newPhase: DeploymentPhase) => setCurrentPhase(newPhase),

    exportLockingReport: () => ({
      timestamp: new Date().toISOString(),
      currentPhase,
      sectionsStatus: sectionLockStatuses,
      deploymentProgress,
      lockEvents: lockEvents.slice(0, 20),
      pendingValidations: Array.from(pendingValidations),
    }),
  };
}

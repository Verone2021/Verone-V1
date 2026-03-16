'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';

import { createClient } from '@verone/utils/supabase/client';
// FIXME: Module './use-manual-tests' does not exist - TS2307
// import { TestSection, TestMetrics } from "./use-manual-tests"

// Temporary types until use-manual-tests is available
export interface TestSection {
  id: string;
  isLocked: boolean;
}

export interface TestMetrics {
  progressPercent: number;
}

// Types pour le système de verrouillage
export type LockStatus =
  | 'unlocked'
  | 'pending_lock'
  | 'locked'
  | 'force_locked';
export type DeploymentPhase =
  | 'development'
  | 'staging'
  | 'pre_production'
  | 'production';

export interface SectionLockConfig {
  sectionId: string;
  completionThreshold: number; // Pourcentage pour auto-lock (défaut: 100%)
  requiresValidation: boolean; // Nécessite validation manuelle avant lock
  blockedBy: string[]; // Sections qui doivent être lockées avant
  phase: DeploymentPhase;
  criticalSection: boolean; // Section critique nécessitant validation spéciale
  rollbackAllowed: boolean; // Permet le déverrouillage après lock
}

export interface LockEvent {
  id: string;
  sectionId: string;
  eventType:
    | 'auto_lock'
    | 'manual_lock'
    | 'unlock'
    | 'force_lock'
    | 'validation_required';
  triggeredBy: string; // userId
  timestamp: Date;
  completionRate: number;
  reason?: string;
  metadata?: Record<string, unknown>;
}

interface UseSectionLockingOptions {
  enableAutoLock?: boolean;
  enableNotifications?: boolean;
  strictMode?: boolean; // Mode strict empêche tout déverrouillage
  validationRequired?: boolean; // Nécessite validation avant lock
}

// Configuration par défaut des sections avec phases de déploiement
const DEFAULT_LOCK_CONFIG: Record<string, SectionLockConfig> = {
  // Phase 1: Core Business (Foundation)
  dashboard: {
    sectionId: 'dashboard',
    completionThreshold: 100,
    requiresValidation: true,
    blockedBy: [],
    phase: 'development',
    criticalSection: true,
    rollbackAllowed: true,
  },
  catalogue: {
    sectionId: 'catalogue',
    completionThreshold: 100,
    requiresValidation: true,
    blockedBy: ['dashboard'],
    phase: 'development',
    criticalSection: true,
    rollbackAllowed: true,
  },

  // Phase 2: Operations (Requires Core)
  stocks: {
    sectionId: 'stocks',
    completionThreshold: 95, // Peut être déployé à 95%
    requiresValidation: true,
    blockedBy: ['catalogue'],
    phase: 'staging',
    criticalSection: true,
    rollbackAllowed: true,
  },
  sourcing: {
    sectionId: 'sourcing',
    completionThreshold: 90,
    requiresValidation: false,
    blockedBy: ['stocks'],
    phase: 'staging',
    criticalSection: false,
    rollbackAllowed: true,
  },

  // Phase 3: Client Relations (Requires Operations)
  interactions: {
    sectionId: 'interactions',
    completionThreshold: 95,
    requiresValidation: true,
    blockedBy: ['stocks'],
    phase: 'staging',
    criticalSection: true,
    rollbackAllowed: true,
  },
  commandes: {
    sectionId: 'commandes',
    completionThreshold: 100,
    requiresValidation: true,
    blockedBy: ['interactions'],
    phase: 'pre_production',
    criticalSection: true,
    rollbackAllowed: false, // Pas de rollback en pré-prod
  },

  // Phase 4: Sales Channels (Requires Client Relations)
  canaux: {
    sectionId: 'canaux',
    completionThreshold: 100,
    requiresValidation: true,
    blockedBy: ['commandes'],
    phase: 'pre_production',
    criticalSection: true,
    rollbackAllowed: false,
  },
  contacts: {
    sectionId: 'contacts',
    completionThreshold: 90,
    requiresValidation: false,
    blockedBy: ['interactions'],
    phase: 'staging',
    criticalSection: false,
    rollbackAllowed: true,
  },

  // Phase 5: Configuration & Admin (Final)
  parametres: {
    sectionId: 'parametres',
    completionThreshold: 100,
    requiresValidation: true,
    blockedBy: ['canaux', 'contacts'],
    phase: 'production',
    criticalSection: true,
    rollbackAllowed: false,
  },
  pages: {
    sectionId: 'pages',
    completionThreshold: 95,
    requiresValidation: false,
    blockedBy: [],
    phase: 'development',
    criticalSection: false,
    rollbackAllowed: true,
  },
};

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

  // États du hook
  const [lockConfigs, setLockConfigs] =
    useState<Record<string, SectionLockConfig>>(DEFAULT_LOCK_CONFIG);
  const [lockEvents, setLockEvents] = useState<LockEvent[]>([]);
  const [pendingValidations, setPendingValidations] = useState<Set<string>>(
    new Set()
  );
  const [currentPhase, setCurrentPhase] =
    useState<DeploymentPhase>('development');

  const supabase = createClient();

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

      // Vérifier si les dépendances sont satisfaites
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
        // Vérifier si peut être verrouillé
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

  // Obtenir les sections éligibles pour auto-lock
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

  // Logger un événement de verrouillage
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

      // Sauvegarder dans Supabase
      try {
        await supabase.from('test_sections_lock_events' as string).insert({
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

      setLockEvents(prev => [lockEvent, ...prev.slice(0, 99)]); // Garder max 100 événements
      return lockEvent;
    },
    [supabase]
  );

  // Verrouiller une section
  const lockSection = useCallback(
    async (
      sectionId: string,
      force = false,
      reason?: string
    ): Promise<boolean> => {
      const sectionStatus = sectionLockStatuses[sectionId];
      if (!sectionStatus) return false;

      // Vérifier les permissions
      if (!force && !sectionStatus.canLock) {
        console.warn(
          `Cannot lock section ${sectionId}: ${sectionStatus.blockedReason}`
        );
        return false;
      }

      // Si validation requise et pas forcé
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
        // Mettre à jour dans Supabase
        const { error } = await supabase
          .from('test_sections_lock' as string)
          .upsert(
            {
              section_id: sectionId,
              locked: true,
              locked_at: new Date().toISOString(),
              completion_rate: sectionStatus.completionRate,
              phase: sectionStatus.config.phase,
              locked_reason: reason,
            },
            {
              onConflict: 'section_id',
            }
          );

        if (error) throw error;

        // Logger l'événement
        await logLockEvent({
          sectionId,
          eventType: force ? 'force_lock' : 'auto_lock',
          completionRate: sectionStatus.completionRate,
          reason:
            reason ?? `Section completed at ${sectionStatus.completionRate}%`,
          triggeredBy: force ? 'user' : 'system',
        });

        // Retirer de la validation en attente
        setPendingValidations(prev => {
          const newSet = new Set(prev);
          newSet.delete(sectionId);
          return newSet;
        });

        // Notification si activée
        if (enableNotifications) {
          console.warn(`🔒 Section "${sectionId}" verrouillée avec succès`);
        }

        return true;
      } catch (error) {
        console.error('Error locking section:', error);
        return false;
      }
    },
    [
      sectionLockStatuses,
      supabase,
      logLockEvent,
      validationRequired,
      enableNotifications,
    ]
  );

  // Déverrouiller une section
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
        // Mettre à jour dans Supabase
        const { error } = await supabase
          .from('test_sections_lock' as string)
          .upsert(
            {
              section_id: sectionId,
              locked: false,
              unlocked_at: new Date().toISOString(),
              unlock_reason: reason,
            },
            {
              onConflict: 'section_id',
            }
          );

        if (error) throw error;

        // Logger l'événement
        await logLockEvent({
          sectionId,
          eventType: 'unlock',
          completionRate: sectionStatus.completionRate,
          reason: reason ?? 'Manual unlock',
          triggeredBy: 'user',
        });

        if (enableNotifications) {
          console.warn(`🔓 Section "${sectionId}" déverrouillée`);
        }

        return true;
      } catch (error) {
        console.error('Error unlocking section:', error);
        return false;
      }
    },
    [sectionLockStatuses, supabase, logLockEvent, enableNotifications]
  );

  // Validation manuelle d'une section
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
        // Validation refusée
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
    // États et configuration
    lockConfigs,
    setLockConfigs,
    sectionLockStatuses,
    lockEvents,
    pendingValidations: Array.from(pendingValidations),
    currentPhase,
    deploymentProgress,

    // Actions principales
    lockSection,
    unlockSection,
    validateSection,

    // Méthodes utilitaires
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

    // Statistiques et monitoring
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

    // Configuration avancée
    updatePhase: (newPhase: DeploymentPhase) => setCurrentPhase(newPhase),

    exportLockingReport: () => ({
      timestamp: new Date().toISOString(),
      currentPhase,
      sectionsStatus: sectionLockStatuses,
      deploymentProgress,
      lockEvents: lockEvents.slice(0, 20), // Derniers 20 événements
      pendingValidations: Array.from(pendingValidations),
    }),
  };
}

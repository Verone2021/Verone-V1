'use client';

/**
 * Configuration et types pour le système de verrouillage de sections
 */

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
  completionThreshold: number;
  requiresValidation: boolean;
  blockedBy: string[];
  phase: DeploymentPhase;
  criticalSection: boolean;
  rollbackAllowed: boolean;
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
  triggeredBy: string;
  timestamp: Date;
  completionRate: number;
  reason?: string;
  metadata?: Record<string, unknown>;
}

export interface UseSectionLockingOptions {
  enableAutoLock?: boolean;
  enableNotifications?: boolean;
  strictMode?: boolean;
  validationRequired?: boolean;
}

// Temporary types until use-manual-tests is available
export interface TestSection {
  id: string;
  isLocked: boolean;
}

export interface TestMetrics {
  progressPercent: number;
}

// ============================================================================
// Pure computation helpers (extracted from useSectionLocking)
// ============================================================================

export interface SectionLockStatus {
  status: LockStatus;
  canLock: boolean;
  canUnlock: boolean;
  blockedReason?: string;
  completionRate: number;
  config: SectionLockConfig;
}

export interface DeploymentPhaseStats {
  total: number;
  locked: number;
  percentage: number;
  sections: string[];
}

const DEFAULT_SECTION_CONFIG: Omit<SectionLockConfig, 'sectionId'> = {
  completionThreshold: 100,
  requiresValidation: false,
  blockedBy: [],
  phase: 'development',
  criticalSection: false,
  rollbackAllowed: true,
};

export function computeSectionLockStatus(
  section: TestSection,
  lockConfigs: Record<string, SectionLockConfig>,
  allSections: TestSection[],
  getSectionMetrics: (sectionId: string) => TestMetrics,
  pendingValidations: Set<string>,
  strictMode: boolean
): SectionLockStatus {
  const config = lockConfigs[section.id] ?? {
    sectionId: section.id,
    ...DEFAULT_SECTION_CONFIG,
  };

  const metrics = getSectionMetrics(section.id);
  const completionRate = metrics.progressPercent;

  const blockedByUnsatisfied = config.blockedBy.filter(depId => {
    const depSection = allSections.find(s => s.id === depId);
    return !depSection?.isLocked;
  });

  let status: LockStatus = 'unlocked';
  let canLock = false;
  let canUnlock = false;
  let blockedReason: string | undefined;

  if (section.isLocked) {
    status = 'locked';
    canUnlock = !strictMode && config.rollbackAllowed;
  } else if (completionRate >= config.completionThreshold) {
    if (blockedByUnsatisfied.length === 0) {
      if (config.requiresValidation && pendingValidations.has(section.id)) {
        status = 'pending_lock';
      } else {
        canLock = true;
      }
    } else {
      blockedReason = `Bloqué par: ${blockedByUnsatisfied.join(', ')}`;
    }
  } else {
    blockedReason = `Completion requise: ${config.completionThreshold}% (actuel: ${completionRate}%)`;
  }

  return { status, canLock, canUnlock, blockedReason, completionRate, config };
}

export function computeDeploymentProgress(
  sections: TestSection[],
  lockConfigs: Record<string, SectionLockConfig>
): Record<DeploymentPhase, DeploymentPhaseStats> {
  const progress: Record<DeploymentPhase, DeploymentPhaseStats> = {
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

  (
    [
      'development',
      'staging',
      'pre_production',
      'production',
    ] as DeploymentPhase[]
  ).forEach(phase => {
    const p = progress[phase];
    p.percentage = p.total > 0 ? Math.round((p.locked / p.total) * 100) : 0;
  });

  return progress;
}

// Configuration par défaut des sections avec phases de déploiement
export const DEFAULT_LOCK_CONFIG: Record<string, SectionLockConfig> = {
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

  // Phase 2: Operations
  stocks: {
    sectionId: 'stocks',
    completionThreshold: 95,
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

  // Phase 3: Client Relations
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
    rollbackAllowed: false,
  },

  // Phase 4: Sales Channels
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

  // Phase 5: Configuration & Admin
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

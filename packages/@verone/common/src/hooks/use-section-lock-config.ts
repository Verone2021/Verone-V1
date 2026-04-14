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

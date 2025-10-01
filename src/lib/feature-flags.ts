/**
 * 🚀 Feature Flags Configuration - Déploiement Progressif Phase 1
 *
 * Système de feature flags pour le déploiement progressif par phases
 * Phase 1: Dashboard + Profiles + Catalogue Complet
 * Phase 2: Stocks + Sourcing + Commandes
 * Phase 3: Interactions + Canaux + Contacts
 */

export interface FeatureFlags {
  // Phases de déploiement
  phase1Enabled: boolean
  phase2Enabled: boolean
  phase3Enabled: boolean

  // Modules Phase 1 (ACTIFS)
  dashboardEnabled: boolean
  profilesEnabled: boolean
  catalogueEnabled: boolean

  // Modules Phase 2 (INACTIFS pour Phase 1)
  stocksEnabled: boolean
  sourcingEnabled: boolean
  commandesEnabled: boolean

  // Modules Phase 3 (INACTIFS pour Phase 1)
  interactionsEnabled: boolean
  canauxVenteEnabled: boolean
  contactsEnabled: boolean

  // Modules spéciaux (toujours actifs)
  adminEnabled: boolean
  parametresEnabled: boolean
  testsManuelsEnabled: boolean

  // Features spécifiques
  photoUploadWorkflowEnabled: boolean
  googleMerchantSyncEnabled: boolean
  mcpMonitoringEnabled: boolean
}

/**
 * Configuration des feature flags basée sur les variables d'environnement
 */
export const featureFlags: FeatureFlags = {
  // Phases
  phase1Enabled: process.env.NEXT_PUBLIC_PHASE_1_ENABLED === 'true',
  phase2Enabled: process.env.NEXT_PUBLIC_PHASE_2_ENABLED === 'true',
  phase3Enabled: process.env.NEXT_PUBLIC_PHASE_3_ENABLED === 'true',

  // Phase 1 - ACTIFS
  dashboardEnabled: process.env.NEXT_PUBLIC_DASHBOARD_ENABLED === 'true',
  profilesEnabled: process.env.NEXT_PUBLIC_PROFILES_ENABLED === 'true',
  catalogueEnabled: process.env.NEXT_PUBLIC_CATALOGUE_ENABLED === 'true',

  // Phase 2 - INACTIFS
  stocksEnabled: process.env.NEXT_PUBLIC_STOCKS_ENABLED === 'true',
  sourcingEnabled: process.env.NEXT_PUBLIC_SOURCING_ENABLED === 'true',
  commandesEnabled: process.env.NEXT_PUBLIC_COMMANDES_ENABLED === 'true',

  // Phase 3 - INACTIFS
  interactionsEnabled: process.env.NEXT_PUBLIC_INTERACTIONS_ENABLED === 'true',
  canauxVenteEnabled: process.env.NEXT_PUBLIC_CANAUX_VENTE_ENABLED === 'true',
  contactsEnabled: process.env.NEXT_PUBLIC_CONTACTS_ENABLED === 'true',

  // Modules spéciaux
  adminEnabled: process.env.NEXT_PUBLIC_ADMIN_ENABLED === 'true',
  parametresEnabled: process.env.NEXT_PUBLIC_PARAMETRES_ENABLED === 'true',
  testsManuelsEnabled: process.env.NEXT_PUBLIC_TESTS_MANUELS_ENABLED === 'true',

  // Features spécifiques
  photoUploadWorkflowEnabled: process.env.NEXT_PUBLIC_PHOTO_UPLOAD_WORKFLOW_ENABLED === 'true',
  googleMerchantSyncEnabled: process.env.NEXT_PUBLIC_GOOGLE_MERCHANT_SYNC_ENABLED === 'true',
  mcpMonitoringEnabled: process.env.NEXT_PUBLIC_MCP_MONITORING_ENABLED === 'true'
}

/**
 * Helper pour vérifier si un module est activé
 */
export function isModuleEnabled(moduleName: keyof FeatureFlags): boolean {
  return featureFlags[moduleName]
}

/**
 * Helper pour obtenir la phase d'un module
 */
export function getModulePhase(moduleName: string): number {
  const phase1Modules = ['dashboard', 'profiles', 'catalogue', 'organisation']
  const phase2Modules = ['stocks', 'sourcing', 'commandes']
  const phase3Modules = ['interactions', 'canaux-vente', 'contacts']

  if (phase1Modules.includes(moduleName)) return 1
  if (phase2Modules.includes(moduleName)) return 2
  if (phase3Modules.includes(moduleName)) return 3

  return 0 // Modules spéciaux
}

/**
 * Helper pour obtenir le statut de déploiement d'un module
 */
export function getModuleDeploymentStatus(moduleName: string): 'active' | 'coming-soon' | 'disabled' {
  const phase = getModulePhase(moduleName)

  if (phase === 1 && featureFlags.phase1Enabled) return 'active'
  if (phase === 2 && featureFlags.phase2Enabled) return 'active'
  if (phase === 3 && featureFlags.phase3Enabled) return 'active'

  if (phase === 0) return 'active' // Modules spéciaux toujours actifs

  return 'coming-soon'
}

/**
 * Configuration des labels pour les phases
 */
export const PHASE_LABELS = {
  1: 'Phase 1',
  2: 'Phase 2 - Bientôt disponible',
  3: 'Phase 3 - Bientôt disponible'
} as const

/**
 * Configuration des couleurs pour les badges de phase
 */
export const PHASE_COLORS = {
  active: 'bg-green-100 text-green-800',
  'coming-soon': 'bg-orange-100 text-orange-800',
  disabled: 'bg-gray-100 text-gray-600'
} as const
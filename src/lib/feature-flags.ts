/**
 * 🚀 Feature Flags Configuration - Déploiement Progressif Phase 1
 *
 * Système de feature flags pour le déploiement progressif par phases
 * Phase 1: Dashboard + Profiles + Catalogue + Sourcing
 * Phase 2: Stocks + Commandes
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
  sourcingEnabled: boolean

  // Modules Phase 2 (INACTIFS pour Phase 1)
  stocksEnabled: boolean
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

  // Modules Finance (Phase 2)
  financeEnabled: boolean
  facturationEnabled: boolean
  tresorerieEnabled: boolean
  rapprochementEnabled: boolean
}

/**
 * Configuration des feature flags - PHASE 1 DÉPLOIEMENT: Auth + Profil uniquement
 *
 * ✅ ACTIVÉ Phase 1:
 * - Auth (login/logout)
 * - Profil utilisateur
 * - Admin (gestion users)
 * - Dashboard (vue basique)
 *
 * 🚧 DÉSACTIVÉ Phase 2+:
 * - Produits (catalogue, sourcing)
 * - Consultations
 * - Commandes (clients, fournisseurs)
 * - Stocks
 * - Finance
 * - Canaux vente
 */
export const featureFlags: FeatureFlags = {
  // Phases - PHASE 1 SEULEMENT
  phase1Enabled: true,   // Auth + Profil + Dashboard basique
  phase2Enabled: false,  // Stocks + Commandes (désactivé)
  phase3Enabled: false,  // Interactions + Canaux (désactivé)

  // Phase 1 - Dashboard basique + Profil
  dashboardEnabled: true,      // Dashboard basique (sans dépendances produits/stock)
  profilesEnabled: true,       // ✅ Profil utilisateur
  catalogueEnabled: false,     // 🚧 Produits désactivés Phase 1
  sourcingEnabled: false,      // 🚧 Sourcing désactivé Phase 1

  // Phase 2 - DÉSACTIVÉ
  stocksEnabled: false,        // 🚧 Stocks désactivés
  commandesEnabled: false,     // 🚧 Commandes désactivées

  // Phase 3 - DÉSACTIVÉ
  interactionsEnabled: false,  // 🚧 Consultations désactivées
  canauxVenteEnabled: false,   // 🚧 Canaux vente désactivés
  contactsEnabled: false,      // 🚧 Contacts désactivés

  // Modules spéciaux - Admin + Paramètres actifs
  adminEnabled: true,          // ✅ Gestion users/rôles
  parametresEnabled: true,     // ✅ Paramètres application
  testsManuelsEnabled: false,  // 🚧 Tests manuels désactivés

  // Features spécifiques - TOUT DÉSACTIVÉ Phase 1
  photoUploadWorkflowEnabled: false,     // 🚧 Upload photos désactivé
  googleMerchantSyncEnabled: false,      // 🚧 Google Merchant désactivé
  mcpMonitoringEnabled: false,           // 🚧 Monitoring désactivé

  // Modules Finance - TOUT DÉSACTIVÉ Phase 1
  financeEnabled: false,
  facturationEnabled: false,
  tresorerieEnabled: false,
  rapprochementEnabled: false
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
  const phase1Modules = ['dashboard', 'profiles', 'catalogue', 'organisation', 'sourcing']
  const phase2Modules = ['stocks', 'commandes']
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
  'coming-soon': 'bg-gray-100 text-gray-900',
  disabled: 'bg-gray-100 text-gray-600'
} as const
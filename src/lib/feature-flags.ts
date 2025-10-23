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
 * Configuration des feature flags - PHASE 1 DÉPLOIEMENT STABILISÉ
 *
 * ✅ MODULES ACTIFS (Phase 1 - Déployés) :
 * - Auth (login/logout) : /login
 * - Dashboard : /dashboard
 * - Profil utilisateur : /profile
 * - Organisations & Contacts : /organisation + /contacts-organisations
 * - Administration : /admin (gestion users, rôles)
 * - Paramètres : /parametres
 *
 * ❌ MODULES DÉSACTIVÉS (Phase 2+ - Code préservé, accès bloqué) :
 * - Produits & Catalogue : /produits/catalogue, /produits/sourcing
 * - Stocks & Inventaire : /stocks
 * - Commandes : /commandes (achats/ventes)
 * - Finance & Trésorerie : /finance, /factures, /tresorerie
 * - Canaux de Vente : /canaux-vente, /ventes
 * - Interactions & Consultations : /interactions, /consultations
 * - Notifications : /notifications
 *
 * ⚠️ IMPORTANT : Les modules désactivés restent dans le code mais sont bloqués via middleware.
 * Activation future via modification de ce fichier uniquement.
 *
 * Dernière mise à jour : 2025-10-23 (Audit stabilisation Phase 1)
 */
export const featureFlags: FeatureFlags = {
  // Phases - PHASE 1 SEULEMENT
  phase1Enabled: true,   // Auth + Profil + Dashboard basique
  phase2Enabled: false,  // Stocks + Commandes (désactivé)
  phase3Enabled: false,  // Interactions + Canaux (désactivé)

  // Phase 1 - Modules Core ACTIFS
  dashboardEnabled: true,      // ✅ Dashboard (vue d'ensemble, KPIs)
  profilesEnabled: true,       // ✅ Profil utilisateur (préférences, activité)
  catalogueEnabled: false,     // ❌ Produits désactivés (Phase 2)
  sourcingEnabled: false,      // ❌ Sourcing désactivé (Phase 2)

  // Phase 2 - DÉSACTIVÉ
  stocksEnabled: false,        // 🚧 Stocks désactivés
  commandesEnabled: false,     // 🚧 Commandes désactivées

  // Phase 3 - DÉSACTIVÉ
  interactionsEnabled: false,  // ❌ Interactions/Consultations désactivées
  canauxVenteEnabled: false,   // ❌ Canaux vente désactivés
  contactsEnabled: true,       // ✅ Organisations & Contacts ACTIFS (fournisseurs, clients, prestataires)

  // Modules spéciaux - Toujours accessibles (authentification requise)
  adminEnabled: true,          // ✅ Administration (gestion utilisateurs, rôles, permissions)
  parametresEnabled: true,     // ✅ Paramètres (configuration application)
  testsManuelsEnabled: false,  // ❌ Tests manuels désactivés (environnement dev uniquement)

  // Features spécifiques - TOUT DÉSACTIVÉ Phase 1
  photoUploadWorkflowEnabled: false,     // ❌ Upload photos désactivé (dépend module Produits)
  googleMerchantSyncEnabled: false,      // ❌ Google Merchant désactivé (dépend module Catalogue)
  mcpMonitoringEnabled: false,           // ❌ Monitoring MCP désactivé (Phase 3)

  // Modules Finance - TOUT DÉSACTIVÉ Phase 1 (Phase 3 prévu)
  financeEnabled: false,         // ❌ Module Finance global
  facturationEnabled: false,     // ❌ Facturation (dépend Finance)
  tresorerieEnabled: false,      // ❌ Trésorerie (dépend Finance)
  rapprochementEnabled: false    // ❌ Rapprochement bancaire (dépend Finance)
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
  const phase1Modules = ['dashboard', 'profiles', 'catalogue', 'organisation', 'sourcing', 'contacts']
  const phase2Modules = ['stocks', 'commandes']
  const phase3Modules = ['interactions', 'canaux-vente']

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
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
  phase1Enabled: boolean;
  phase2Enabled: boolean;
  phase3Enabled: boolean;

  // Modules Phase 1 (ACTIFS)
  dashboardEnabled: boolean;
  profilesEnabled: boolean;
  catalogueEnabled: boolean;
  sourcingEnabled: boolean;

  // Modules Phase 2 (INACTIFS pour Phase 1)
  stocksEnabled: boolean;
  commandesEnabled: boolean;

  // Modules Phase 3 (INACTIFS pour Phase 1)
  interactionsEnabled: boolean;
  canauxVenteEnabled: boolean;
  contactsEnabled: boolean;

  // Modules spéciaux (toujours actifs)
  adminEnabled: boolean;
  parametresEnabled: boolean;
  testsManuelsEnabled: boolean;

  // Features spécifiques
  photoUploadWorkflowEnabled: boolean;
  googleMerchantSyncEnabled: boolean;
  mcpMonitoringEnabled: boolean;

  // Modules Finance (Phase 2)
  financeEnabled: boolean;
  facturationEnabled: boolean;
  tresorerieEnabled: boolean;
  rapprochementEnabled: boolean;
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
  // Phases - TOUTES PHASES ACTIVÉES
  phase1Enabled: true, // Auth + Profil + Dashboard basique
  phase2Enabled: true, // Stocks + Commandes (ACTIVÉ)
  phase3Enabled: true, // Interactions + Canaux (ACTIVÉ)

  // Phase 1 - Modules Core ACTIFS
  dashboardEnabled: true, // ✅ Dashboard (vue d'ensemble, KPIs)
  profilesEnabled: true, // ✅ Profil utilisateur (préférences, activité)
  catalogueEnabled: true, // ✅ Produits activés
  sourcingEnabled: true, // ✅ Sourcing activé

  // Phase 2 - ACTIVÉ
  stocksEnabled: true, // ✅ Stocks activés
  commandesEnabled: true, // ✅ Commandes activées

  // Phase 3 - ACTIVÉ
  interactionsEnabled: true, // ✅ Interactions/Consultations activées
  canauxVenteEnabled: true, // ✅ Canaux vente activés
  contactsEnabled: true, // ✅ Organisations & Contacts ACTIFS (fournisseurs, clients, prestataires)

  // Modules spéciaux - Toujours accessibles (authentification requise)
  adminEnabled: true, // ✅ Administration (gestion utilisateurs, rôles, permissions)
  parametresEnabled: true, // ✅ Paramètres (configuration application)
  testsManuelsEnabled: false, // ❌ Tests manuels désactivés (environnement dev uniquement)

  // Features spécifiques - ACTIVÉES
  photoUploadWorkflowEnabled: true, // ✅ Upload photos activé
  googleMerchantSyncEnabled: true, // ✅ Google Merchant activé
  mcpMonitoringEnabled: true, // ✅ Monitoring MCP activé

  // Modules Finance - ACTIVÉS (Phase 3+ - Tests Qonto)
  financeEnabled: true, // ✅ Module Finance global activé (2025-12-23)
  facturationEnabled: true, // ✅ Facturation activée
  tresorerieEnabled: true, // ✅ Trésorerie activée
  rapprochementEnabled: true, // ✅ Rapprochement bancaire activé
};

/**
 * Helper pour vérifier si un module est activé
 */
export function isModuleEnabled(moduleName: keyof FeatureFlags): boolean {
  return featureFlags[moduleName];
}

/**
 * Helper pour obtenir la phase d'un module
 */
export function getModulePhase(moduleName: string): number {
  const phase1Modules = [
    'dashboard',
    'profiles',
    'catalogue',
    'organisation',
    'sourcing',
    'contacts',
  ];
  const phase2Modules = ['stocks', 'commandes'];
  const phase3Modules = ['interactions', 'canaux-vente'];

  if (phase1Modules.includes(moduleName)) return 1;
  if (phase2Modules.includes(moduleName)) return 2;
  if (phase3Modules.includes(moduleName)) return 3;

  return 0; // Modules spéciaux
}

/**
 * Helper pour obtenir le statut de déploiement d'un module
 */
export function getModuleDeploymentStatus(
  moduleName: string
): 'active' | 'coming-soon' | 'disabled' {
  // Modules Finance activés (2025-12-23)
  const financeModules = ['finance', 'factures', 'tresorerie', 'rapprochement'];
  if (financeModules.includes(moduleName) && featureFlags.financeEnabled)
    return 'active';

  const phase = getModulePhase(moduleName);

  if (phase === 1 && featureFlags.phase1Enabled) return 'active';
  if (phase === 2 && featureFlags.phase2Enabled) return 'active';
  if (phase === 3 && featureFlags.phase3Enabled) return 'active';

  if (phase === 0) return 'active'; // Modules spéciaux toujours actifs

  return 'coming-soon';
}

/**
 * Configuration des labels pour les phases
 */
export const PHASE_LABELS = {
  1: 'Phase 1',
  2: 'Phase 2',
  3: 'Phase 3',
} as const;

/**
 * Configuration des couleurs pour les badges de phase
 */
export const PHASE_COLORS = {
  active: 'bg-green-100 text-green-800',
  'coming-soon': 'bg-gray-100 text-gray-900',
  disabled: 'bg-gray-100 text-gray-600',
} as const;

/**
 * 🚀 VÉRONE BACK OFFICE - Configuration Modules Déployés
 *
 * Centralise l'état de déploiement des modules pour griser automatiquement
 * les onglets des fonctionnalités non disponibles.
 *
 * ✅ Phase 1 (Déployé) : Contacts, Commandes Fournisseurs
 * 🚧 Phase 2 (En développement) : Commandes Clients, Produits, Stocks
 * 🚧 Phase 3 (Planifié) : Factures, Analytics, Feeds
 *
 * @example
 * ```typescript
 * import { isModuleDeployed, getModulePhase } from '@/lib/deployed-modules'
 *
 * const tabs = [
 *   {
 *     id: 'products',
 *     label: 'Produits',
 *     disabled: !isModuleDeployed('products'),
 *     disabledBadge: getModulePhase('products') // "Phase 2"
 *   }
 * ]
 * ```
 */

export const DEPLOYED_MODULES = {
  // ✅ Phase 1 - Déployé
  contacts: true, // Gestion contacts (personnes physiques)
  purchase_orders: true, // Commandes fournisseurs
  products: true, // ✅ ACTIVÉ - Catalogue produits
  invoices: true, // ✅ ACTIVÉ - Facturation

  // 🚧 Phase 2 - En développement
  sales_orders: false, // Commandes clients
  stock: false, // Gestion stocks

  // 🚧 Phase 3 - Planifié
  analytics: false, // Analytics & KPI avancés
  feeds: false, // Flux Google Merchant, Facebook, etc.
} as const;

export type DeployedModule = keyof typeof DEPLOYED_MODULES;

/**
 * Vérifie si un module est déployé et accessible
 */
export function isModuleDeployed(module: DeployedModule): boolean {
  return DEPLOYED_MODULES[module];
}

/**
 * Retourne le label de phase pour un module non déployé
 */
export function getModulePhase(module: DeployedModule): string {
  const phases: Record<DeployedModule, string> = {
    // Phase 1
    contacts: 'Déployé',
    purchase_orders: 'Déployé',

    // Phase 2
    sales_orders: 'Phase 2',
    products: 'Phase 2',
    stock: 'Phase 2',

    // Phase 3
    invoices: 'Phase 3',
    analytics: 'Phase 3',
    feeds: 'Phase 3',
  };

  return phases[module] || 'Bientôt';
}

/**
 * Retourne tous les modules déployés
 */
export function getDeployedModules(): DeployedModule[] {
  return (Object.keys(DEPLOYED_MODULES) as DeployedModule[]).filter(
    module => DEPLOYED_MODULES[module]
  );
}

/**
 * Retourne tous les modules en développement
 */
export function getPendingModules(): DeployedModule[] {
  return (Object.keys(DEPLOYED_MODULES) as DeployedModule[]).filter(
    module => !DEPLOYED_MODULES[module]
  );
}

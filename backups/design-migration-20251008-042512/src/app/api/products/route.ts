/**
 * 🔄 API Products Alias - Vérone Back Office
 *
 * Redirection transparente vers /api/catalogue/products
 * Créé pour compatibilité avec tests automatisés et API externe
 */

// Réexporter les handlers de l'API catalogue
export { GET, POST, OPTIONS } from '../catalogue/products/route'

/**
 * Note technique:
 * Cette route est un alias vers /api/catalogue/products
 * pour maintenir la compatibilité avec:
 * - Tests Playwright automatisés
 * - Intégrations externes existantes
 * - Documentation API legacy
 */
/**
 * Feature Flags - Verone Back Office
 *
 * Usage:
 * ```tsx
 * import { useFinanceV2 } from '@/lib/feature-flags';
 *
 * function MyComponent() {
 *   const isV2 = useFinanceV2();
 *   return isV2 ? <NewComponent /> : <LegacyComponent />;
 * }
 * ```
 */

// =====================================================================
// FINANCE V2
// =====================================================================

/**
 * Feature flag pour le nouveau module Finance v2
 *
 * Activation:
 * - .env.local: NEXT_PUBLIC_FINANCE_V2=true
 * - Vercel: Settings > Environment Variables
 */
export function useFinanceV2(): boolean {
  return process.env.NEXT_PUBLIC_FINANCE_V2 === 'true';
}

/**
 * Version serveur du flag (pour Server Components)
 */
export function isFinanceV2Enabled(): boolean {
  return process.env.NEXT_PUBLIC_FINANCE_V2 === 'true';
}

// =====================================================================
// AUTRES FLAGS (futurs)
// =====================================================================

// Ajouter d'autres feature flags ici si necessaire

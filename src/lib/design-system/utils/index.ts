/**
 * Design System Vérone - Utils
 *
 * Réexport des utilitaires communs (cn, etc.)
 */

// Re-export cn from shadcn utils
export { cn } from '@/lib/utils'

// Type helper pour conditional classnames
export type ClassValue = Parameters<typeof cn>[0]

/**
 * Design System Vérone - Utils
 *
 * Réexport des utilitaires communs (cn, etc.)
 */

// Import cn from shadcn utils
import { cn } from '@/lib/utils'

// Re-export cn
export { cn }

// Type helper pour conditional classnames
export type ClassValue = Parameters<typeof cn>[0]

'use client'

import React from 'react'
import {
  Edit,
  Archive,
  Trash2,
  Eye,
  Download,
  Upload,
  Copy,
  Check,
  X,
  LucideIcon,
  Loader2,
} from 'lucide-react'
import { ButtonV2, ButtonV2Props } from './button'
import { cn } from '@/lib/utils'

/**
 * Type d'action prédéfinie pour ModernActionButton
 */
export type ActionType =
  | 'edit'      // Secondary (bordure noire) + Edit icon
  | 'archive'   // Warning (orange #ff9b3e) + Archive icon
  | 'delete'    // Danger (rouge #ff4d6b) + Trash2 icon
  | 'view'      // Ghost + Eye icon
  | 'download'  // Secondary + Download icon
  | 'upload'    // Primary (noir) + Upload icon
  | 'copy'      // Ghost + Copy icon
  | 'approve'   // Success (vert #38ce3c) + Check icon
  | 'reject'    // Danger (rouge) + X icon

/**
 * Configuration d'une action (variant + icon + label)
 */
interface ActionConfig {
  variant: ButtonV2Props['variant']
  icon: LucideIcon
  defaultLabel: string
}

/**
 * Mapping des 9 actions prédéfinies
 */
const ACTION_CONFIGS: Record<ActionType, ActionConfig> = {
  edit: {
    variant: 'secondary',
    icon: Edit,
    defaultLabel: 'Modifier',
  },
  archive: {
    variant: 'warning',
    icon: Archive,
    defaultLabel: 'Archiver',
  },
  delete: {
    variant: 'destructive',
    icon: Trash2,
    defaultLabel: 'Supprimer',
  },
  view: {
    variant: 'ghost',
    icon: Eye,
    defaultLabel: 'Voir',
  },
  download: {
    variant: 'secondary',
    icon: Download,
    defaultLabel: 'Télécharger',
  },
  upload: {
    variant: 'primary',
    icon: Upload,
    defaultLabel: 'Importer',
  },
  copy: {
    variant: 'ghost',
    icon: Copy,
    defaultLabel: 'Copier',
  },
  approve: {
    variant: 'success',
    icon: Check,
    defaultLabel: 'Approuver',
  },
  reject: {
    variant: 'destructive',
    icon: X,
    defaultLabel: 'Rejeter',
  },
}

/**
 * Props pour ModernActionButton
 */
export interface ModernActionButtonProps {
  /** Type d'action prédéfinie */
  action: ActionType
  /** Callback au clic */
  onClick?: () => void
  /** État désactivé */
  disabled?: boolean
  /** État loading (affiche spinner) */
  loading?: boolean
  /** Taille du bouton */
  size?: 'sm' | 'md' | 'lg'
  /** Classes CSS additionnelles */
  className?: string
  /** Override du label par défaut */
  children?: React.ReactNode
}

/**
 * ModernActionButton - Bouton d'action réutilisable Design System V2
 *
 * 9 actions prédéfinies avec couleurs et icons cohérents :
 * - edit (secondary + Edit)
 * - archive (warning + Archive)
 * - delete (danger + Trash2)
 * - view (ghost + Eye)
 * - download (secondary + Download)
 * - upload (primary + Upload)
 * - copy (ghost + Copy)
 * - approve (success + Check)
 * - reject (danger + X)
 *
 * Microinteractions 2025 :
 * - Hover : scale(1.05) en 150ms
 * - Active : scale(0.95)
 * - Loading : Spinner lucide-react
 * - Disabled : opacity-50 + cursor-not-allowed
 *
 * Remplace StandardModifyButton obsolète
 *
 * @example
 * ```tsx
 * <ModernActionButton action="edit" onClick={() => handleEdit()} />
 * <ModernActionButton action="delete" loading={deleting} />
 * <ModernActionButton action="approve" disabled={!canApprove}>
 *   Valider maintenant
 * </ModernActionButton>
 * ```
 *
 * @see /src/lib/theme-v2.ts pour Design System V2
 * @see /src/components/ui/button.tsx pour ButtonV2
 */
export function ModernActionButton({
  action,
  onClick,
  disabled = false,
  loading = false,
  size = 'md',
  className,
  children,
}: ModernActionButtonProps) {
  const config = ACTION_CONFIGS[action]

  // Label final : children override, sinon defaultLabel
  const label = children || config.defaultLabel

  return (
    <ButtonV2
      variant={config.variant}
      size={size}
      icon={loading ? Loader2 : config.icon}
      iconPosition="left"
      onClick={onClick}
      disabled={disabled || loading}
      className={cn(
        // Microinteraction hover scale 1.05 (override ButtonV2 qui fait 1.02)
        'hover:scale-[1.05] active:scale-[0.95]',
        // Transition ultra-rapide pour action button
        'transition-all duration-150',
        className
      )}
      aria-label={typeof label === 'string' ? label : config.defaultLabel}
    >
      {label}
    </ButtonV2>
  )
}

/**
 * Export default pour compatibilité
 */
export default ModernActionButton

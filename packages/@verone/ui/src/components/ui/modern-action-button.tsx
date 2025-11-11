'use client';

import React from 'react';

import { cn } from '@verone/utils';
import type { LucideIcon } from 'lucide-react';
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
} from 'lucide-react';

import type { ButtonProps } from './button';
import { Button } from './button';

/**
 * Type d'action prédéfinie pour ModernActionButton
 */
export type ActionType =
  | 'edit' // Secondary (bordure noire) + Edit icon
  | 'archive' // Warning (orange #ff9b3e) + Archive icon
  | 'delete' // Danger (rouge #ff4d6b) + Trash2 icon
  | 'view' // Ghost + Eye icon
  | 'download' // Secondary + Download icon
  | 'upload' // Primary (noir) + Upload icon
  | 'copy' // Ghost + Copy icon
  | 'approve' // Success (vert #38ce3c) + Check icon
  | 'reject'; // Danger (rouge) + X icon

/**
 * Configuration d'une action (variant + icon + label)
 */
interface ActionConfig {
  variant: ButtonProps['variant'];
  icon: LucideIcon;
  defaultLabel: string;
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
    variant: 'destructive',
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
    variant: 'default',
    icon: Upload,
    defaultLabel: 'Importer',
  },
  copy: {
    variant: 'ghost',
    icon: Copy,
    defaultLabel: 'Copier',
  },
  approve: {
    variant: 'default',
    icon: Check,
    defaultLabel: 'Approuver',
  },
  reject: {
    variant: 'destructive',
    icon: X,
    defaultLabel: 'Rejeter',
  },
};

/**
 * Props pour ModernActionButton
 */
export interface ModernActionButtonProps {
  /** Type d'action prédéfinie */
  action: ActionType;
  /** Callback au clic */
  onClick?: () => void;
  /** État désactivé */
  disabled?: boolean;
  /** État loading (affiche spinner) */
  loading?: boolean;
  /** Taille du bouton */
  size?: 'sm' | 'md' | 'lg';
  /** Classes CSS additionnelles */
  className?: string;
  /** Override du label par défaut */
  children?: React.ReactNode;
}

/**
 * @deprecated Utilisez ButtonUnified à la place
 * @see src/components/ui/button-unified.tsx
 * @see scripts/codemods/MIGRATION-GUIDE.md
 *
 * ModernActionButton - Bouton d'action réutilisable Design System V2
 *
 * ⚠️ DEPRECATED: Ce composant sera supprimé le 2025-11-21
 * Migration: ModernActionButton → ButtonUnified
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
  // Deprecation warning en développement
  if (process.env.NODE_ENV === 'development') {
    console.warn(
      '⚠️ DEPRECATED: ModernActionButton sera supprimé le 2025-11-21. Utilisez ButtonUnified à la place. Voir scripts/codemods/MIGRATION-GUIDE.md'
    );
  }

  const config = ACTION_CONFIGS[action];

  // Label final : children override, sinon defaultLabel
  const label = children || config.defaultLabel;

  // Mapper size 'md' vers 'default' pour Button restauré
  const mappedSize = size === 'md' ? 'default' : size;

  return (
    <Button
      variant={config.variant}
      size={mappedSize}
      onClick={onClick}
      disabled={disabled || loading}
      className={cn(
        // Microinteraction hover scale 1.05
        'hover:scale-[1.05] active:scale-[0.95]',
        // Transition ultra-rapide pour action button
        'transition-all duration-150',
        className
      )}
      aria-label={typeof label === 'string' ? label : config.defaultLabel}
    >
      {label}
    </Button>
  );
}

/**
 * Export default pour compatibilité
 */
export default ModernActionButton;

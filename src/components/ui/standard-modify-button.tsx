'use client';

import { Edit } from 'lucide-react';

import { Button } from './button';
import { cn } from '../../lib/utils';

/**
 * @deprecated Utilisez ButtonUnified à la place
 * @see src/components/ui/button-unified.tsx
 * @see scripts/codemods/MIGRATION-GUIDE.md
 *
 * StandardModifyButton - Bouton "Modifier" standardisé
 *
 * ⚠️ DEPRECATED: Ce composant sera supprimé le 2025-11-21
 * Migration: StandardModifyButton → ButtonUnified variant="outline" size="sm" icon={Edit}
 */
interface StandardModifyButtonProps {
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  children?: React.ReactNode;
}

export function StandardModifyButton({
  onClick,
  disabled = false,
  className,
  children,
}: StandardModifyButtonProps) {
  // Deprecation warning en développement
  if (process.env.NODE_ENV === 'development') {
    console.warn(
      '⚠️ DEPRECATED: StandardModifyButton sera supprimé le 2025-11-21. Utilisez ButtonUnified à la place. Voir scripts/codemods/MIGRATION-GUIDE.md'
    );
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'text-xs px-2 py-1 h-6', // Taille standard uniformisée
        className
      )}
    >
      <Edit className="h-3 w-3 mr-1" />
      {children || 'Modifier'}
    </Button>
  );
}

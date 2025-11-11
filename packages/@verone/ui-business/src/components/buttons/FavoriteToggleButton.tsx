/**
 * 💖 Favorite Toggle Button
 *
 * Bouton cœur cliquable pour marquer/démarquer les favoris
 * directement depuis les vues listes/grilles
 */

'use client';

import { useState } from 'react';

import { useToggleFavorite } from '@verone/common';
import { ButtonUnified } from '@verone/ui';
import { cn } from '@verone/utils';
import { Heart } from 'lucide-react';

interface FavoriteToggleButtonProps {
  organisationId: string;
  isFavorite: boolean;
  organisationType: 'customer' | 'supplier' | 'partner';
  disabled?: boolean;
  onToggleComplete?: () => void;
  className?: string;
}

export function FavoriteToggleButton({
  organisationId,
  isFavorite,
  organisationType,
  disabled = false,
  onToggleComplete,
  className,
}: FavoriteToggleButtonProps) {
  const [isAnimating, setIsAnimating] = useState(false);

  const { toggleFavorite, isLoading } = useToggleFavorite({
    organisationId,
    organisationType,
    onSuccess: () => {
      // Animation de succès
      setIsAnimating(true);
      setTimeout(() => setIsAnimating(false), 300);
      // Callback pour refetch data
      onToggleComplete?.();
    },
    onError: error => {
      console.error('Erreur toggle favori:', error);
      // TODO: Afficher un toast d'erreur
    },
  });

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (disabled || isLoading) return;

    await toggleFavorite(isFavorite);
  };

  const isDisabled = disabled || isLoading;

  return (
    <ButtonUnified
      variant="ghost"
      size="icon"
      onClick={handleClick}
      disabled={isDisabled}
      loading={isLoading}
      className={cn(
        'transition-all duration-200',
        !isDisabled && 'hover:scale-110',
        isAnimating && 'animate-pulse',
        className
      )}
      title={
        isDisabled
          ? 'Non disponible pour les éléments archivés'
          : isFavorite
            ? 'Retirer des favoris'
            : 'Ajouter aux favoris'
      }
      aria-label={isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
    >
      <Heart
        className={cn(
          'h-4 w-4 transition-colors duration-200',
          isFavorite && !isDisabled && 'fill-red-500 text-red-500',
          !isFavorite && !isDisabled && 'text-gray-400',
          isDisabled && 'text-gray-300'
        )}
      />
    </ButtonUnified>
  );
}

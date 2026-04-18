/**
 * 📄 PageHeader - Composant Header de Page Unifié
 *
 * Header standardisé pour toutes les pages de l'application
 * Garantit la cohérence visuelle et l'économie d'espace vertical
 */

'use client';

import React from 'react';

import { useRouter } from 'next/navigation';

import { ButtonV2 } from '@verone/ui';
import type { LucideIcon } from 'lucide-react';
import { ArrowLeft } from 'lucide-react';

export interface PageHeaderProps {
  /** Titre principal de la page */
  title: string;
  /** Description optionnelle sous le titre */
  description?: string;
  /** Icône optionnelle à côté du titre */
  icon?: LucideIcon;
  /** Afficher le bouton retour */
  showBackButton?: boolean;
  /** URL de retour (utilise router.push) */
  backButtonHref?: string;
  /** Callback personnalisé pour le bouton retour */
  onBackClick?: () => void;
  /** Action(s) à afficher à droite du header (bouton, etc.) */
  action?: React.ReactNode;
}

export function PageHeader({
  title,
  description,
  icon: Icon,
  showBackButton = false,
  backButtonHref,
  onBackClick,
  action,
}: PageHeaderProps) {
  const router = useRouter();

  const handleBackClick = () => {
    if (onBackClick) {
      onBackClick();
    } else if (backButtonHref) {
      router.push(backButtonHref);
    } else {
      router.back();
    }
  };

  return (
    <div className="bg-white border-b border-slate-200 px-4 py-3 md:px-6 md:py-4">
      <div className="flex items-center gap-3">
        {/* Bouton Retour inline à gauche */}
        {showBackButton && (
          <ButtonV2
            variant="ghost"
            size="sm"
            icon={ArrowLeft}
            onClick={handleBackClick}
          >
            Retour
          </ButtonV2>
        )}

        {/* Titre + Description */}
        <div className="flex-1">
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            {Icon && <Icon className="h-6 w-6" />}
            {title}
          </h1>
          {description && (
            <p className="text-sm text-slate-600">{description}</p>
          )}
        </div>

        {/* Action(s) à droite */}
        {action && <div>{action}</div>}
      </div>
    </div>
  );
}

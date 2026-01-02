/**
 * SupplierCell - Composant d'affichage fournisseur/client avec suggestions
 *
 * Affiche le nom du fournisseur/client avec:
 * - Lien vers l'organisation si liée
 * - Suggestion basée sur les règles de matching
 * - Boutons confirmer/modifier pour les suggestions
 * - Bouton "+" pour lier une organisation si inconnu
 */

'use client';

import { useState } from 'react';

import Link from 'next/link';

import { Badge, Button, cn } from '@verone/ui';
import { Check, Edit2, Link2, AlertCircle } from 'lucide-react';

import { OrganisationLinkingModal } from './OrganisationLinkingModal';
import { getPcgCategory } from '../lib/pcg-categories';

export interface SupplierCellProps {
  /** Nom de la contrepartie (depuis la transaction) */
  counterpartyName?: string | null;
  /** Libellé de la transaction (pour affichage) */
  label?: string | null;
  /** ID de l'organisation liée (si déjà associée) */
  organisationId?: string | null;
  /** Nom de l'organisation liée */
  organisationName?: string | null;
  /** Suggestion d'organisation (depuis les règles de matching) */
  suggestedOrganisationId?: string | null;
  suggestedOrganisationName?: string | null;
  /** Catégorie PCG suggérée */
  suggestedCategory?: string | null;
  /** Niveau de confiance de la suggestion */
  confidence?: 'high' | 'medium' | 'none';
  /**
   * Type de match:
   * - 'exact': label = pattern → BLEU "Règle appliquée" (pas de bouton confirmer)
   * - 'similar': label contient pattern → ORANGE "Suggéré" (avec bouton confirmer)
   * - 'none': pas de match
   */
  matchType?: 'exact' | 'similar' | 'none';
  /** ID de la transaction (pour lier une organisation) */
  transactionId?: string;
  /** Callback après confirmation d'une suggestion */
  onConfirm?: (organisationId: string) => void;
  /** Callback après liaison d'une organisation */
  onLink?: (organisationId: string) => void;
  /** Afficher la catégorie PCG suggérée */
  showCategory?: boolean;
  /** Classes CSS additionnelles */
  className?: string;
}

export function SupplierCell({
  counterpartyName,
  label,
  organisationId,
  organisationName,
  suggestedOrganisationId,
  suggestedOrganisationName,
  suggestedCategory,
  confidence = 'none',
  matchType = 'none',
  transactionId,
  onConfirm,
  onLink,
  showCategory = false,
  className,
}: SupplierCellProps) {
  // Utiliser matchType pour déterminer le style (prioritaire sur confidence)
  const isExactMatch =
    matchType === 'exact' || (matchType === 'none' && confidence === 'high');
  const isSimilarMatch =
    matchType === 'similar' ||
    (matchType === 'none' && confidence === 'medium');
  const [isLinkingModalOpen, setIsLinkingModalOpen] = useState(false);

  // Cas 1: Organisation déjà liée - Afficher avec lien
  if (organisationId && organisationName) {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <Link
          href={`/contacts-organisations/${organisationId}`}
          className="text-blue-600 hover:text-blue-800 hover:underline font-medium"
        >
          {organisationName}
        </Link>
        {showCategory && suggestedCategory && (
          <Badge variant="outline" className="text-xs">
            {getPcgCategory(suggestedCategory)?.label || suggestedCategory}
          </Badge>
        )}
      </div>
    );
  }

  // Cas 2: Suggestion disponible - Afficher suggestion + boutons
  if (suggestedOrganisationId && suggestedOrganisationName) {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <span
          className={cn(
            'font-medium',
            isExactMatch ? 'text-blue-600' : 'text-amber-600'
          )}
        >
          {suggestedOrganisationName}
        </span>

        {/* Badge de type de match - BLEU si exact, ORANGE si similaire */}
        <Badge
          className={cn(
            'text-xs',
            isExactMatch
              ? 'bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-100'
              : 'bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-100'
          )}
        >
          {isExactMatch ? 'Auto' : 'Suggéré'}
        </Badge>

        {/* Catégorie PCG */}
        {showCategory && suggestedCategory && (
          <Badge variant="outline" className="text-xs">
            {getPcgCategory(suggestedCategory)?.label || suggestedCategory}
          </Badge>
        )}

        {/* Bouton Confirmer - UNIQUEMENT pour les suggestions (pas pour exact) */}
        {isSimilarMatch && onConfirm && (
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-amber-600 hover:text-amber-800 hover:bg-amber-50"
            onClick={() => onConfirm(suggestedOrganisationId)}
            title="Confirmer cette suggestion"
          >
            <Check className="h-4 w-4" />
          </Button>
        )}

        {/* Bouton Modifier - toujours disponible */}
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 text-gray-500 hover:text-gray-700"
          onClick={() => setIsLinkingModalOpen(true)}
          title="Modifier l'association"
        >
          <Edit2 className="h-3 w-3" />
        </Button>

        {/* Modal de liaison */}
        {transactionId && (
          <OrganisationLinkingModal
            open={isLinkingModalOpen}
            onOpenChange={setIsLinkingModalOpen}
            label={label || counterpartyName || 'Transaction'}
            onSuccess={() => {
              onLink?.(suggestedOrganisationId || '');
              setIsLinkingModalOpen(false);
            }}
          />
        )}
      </div>
    );
  }

  // Cas 3: Pas d'organisation ni de suggestion
  // Afficher counterpartyName ou "Inconnu" + bouton lier
  const displayName = counterpartyName || label || 'Inconnu';
  const isUnknown = !counterpartyName && !label;

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <span
        className={cn(
          isUnknown ? 'text-muted-foreground italic' : 'text-gray-700'
        )}
      >
        {displayName}
      </span>

      {/* Catégorie PCG suggérée (même sans organisation) */}
      {showCategory && suggestedCategory && (
        <Badge variant="outline" className="text-xs">
          {getPcgCategory(suggestedCategory)?.label || suggestedCategory}
        </Badge>
      )}

      {/* Icône d'avertissement si inconnu */}
      {isUnknown && (
        <span title="Non identifié">
          <AlertCircle className="h-4 w-4 text-amber-500" />
        </span>
      )}

      {/* Bouton Lier */}
      {transactionId && (
        <>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-blue-500 hover:text-blue-700 hover:bg-blue-50"
            onClick={() => setIsLinkingModalOpen(true)}
            title="Lier une organisation"
          >
            <Link2 className="h-4 w-4" />
          </Button>

          <OrganisationLinkingModal
            open={isLinkingModalOpen}
            onOpenChange={setIsLinkingModalOpen}
            label={label || counterpartyName || 'Transaction'}
            onSuccess={() => {
              onLink?.('');
              setIsLinkingModalOpen(false);
            }}
          />
        </>
      )}
    </div>
  );
}

/**
 * Version simplifiée pour affichage en lecture seule
 */
export function SupplierCellReadOnly({
  counterpartyName,
  label,
  organisationId,
  organisationName,
  suggestedOrganisationName,
  confidence = 'none',
  matchType = 'none',
  className,
}: Pick<
  SupplierCellProps,
  | 'counterpartyName'
  | 'label'
  | 'organisationId'
  | 'organisationName'
  | 'suggestedOrganisationName'
  | 'confidence'
  | 'matchType'
  | 'className'
>) {
  // Utiliser matchType pour déterminer le style
  const isExactMatch =
    matchType === 'exact' || (matchType === 'none' && confidence === 'high');

  // Organisation liée
  if (organisationId && organisationName) {
    return (
      <Link
        href={`/contacts-organisations/${organisationId}`}
        className={cn(
          'text-blue-600 hover:text-blue-800 hover:underline font-medium',
          className
        )}
      >
        {organisationName}
      </Link>
    );
  }

  // Suggestion
  if (suggestedOrganisationName) {
    return (
      <span
        className={cn(
          isExactMatch ? 'text-blue-600' : 'text-amber-600',
          className
        )}
      >
        {suggestedOrganisationName}
      </span>
    );
  }

  // Fallback
  const displayName = counterpartyName || label || 'Inconnu';
  return (
    <span
      className={cn(
        !counterpartyName && !label
          ? 'text-muted-foreground italic'
          : 'text-gray-700',
        className
      )}
    >
      {displayName}
    </span>
  );
}

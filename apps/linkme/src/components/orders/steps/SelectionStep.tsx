'use client';

/**
 * SelectionStep - Étape 2 du formulaire de commande
 *
 * Permet de choisir la sélection de produits à utiliser.
 * - Si l'affilié n'a qu'une sélection : sélection automatique
 * - Si plusieurs : choix parmi les sélections
 *
 * Important: Les prix et marges varient selon la sélection choisie
 *
 * @module SelectionStep
 * @since 2026-01-20
 */

import { useEffect, useMemo } from 'react';

import { Card, cn } from '@verone/ui';
import {
  ListChecks,
  Package,
  CheckCircle,
  AlertTriangle,
  Loader2,
  Calendar,
  Star,
} from 'lucide-react';

import type { OrderFormData, SelectionStepData } from '../schemas/order-form.schema';
import { useUserSelections, useUserAffiliate } from '../../../lib/hooks/use-user-selection';

// ============================================================================
// TYPES
// ============================================================================

interface SelectionStepProps {
  formData: OrderFormData;
  errors: string[];
  onUpdate: (data: Partial<SelectionStepData>) => void;
  onClearCart: () => void;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function SelectionStep({
  formData,
  errors,
  onUpdate,
  onClearCart,
}: SelectionStepProps) {
  const { data: affiliate, isLoading: affiliateLoading } = useUserAffiliate();
  const { data: selections, isLoading: selectionsLoading } = useUserSelections();

  const isLoading = affiliateLoading || selectionsLoading;

  // Filtrer uniquement les sélections publiées (avec produits)
  const availableSelections = useMemo(() => {
    if (!selections) return [];
    return selections.filter((s) => s.products_count > 0);
  }, [selections]);

  // Auto-sélection si une seule sélection disponible
  useEffect(() => {
    if (availableSelections.length === 1 && !formData.selection.selectionId) {
      const selection = availableSelections[0];
      onUpdate({
        selectionId: selection.id,
        selectionName: selection.name,
        productsCount: selection.products_count,
      });
    }
  }, [availableSelections, formData.selection.selectionId, onUpdate]);

  // Handler de changement de sélection
  const handleSelectSelection = (selection: typeof availableSelections[0]) => {
    // Si changement de sélection et panier non vide, avertir
    if (
      formData.selection.selectionId &&
      formData.selection.selectionId !== selection.id &&
      formData.cart.items.length > 0
    ) {
      if (
        !confirm(
          'Changer de sélection va vider votre panier. Voulez-vous continuer ?'
        )
      ) {
        return;
      }
      onClearCart();
    }

    onUpdate({
      selectionId: selection.id,
      selectionName: selection.name,
      productsCount: selection.products_count,
    });
  };

  // Loading
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  // Pas de sélection disponible
  if (availableSelections.length === 0) {
    return (
      <div className="text-center py-16">
        <AlertTriangle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Aucune sélection disponible
        </h3>
        <p className="text-gray-500 max-w-md mx-auto">
          Vous devez d&apos;abord créer une sélection de produits avec au moins un
          article avant de pouvoir créer une commande.
        </p>
      </div>
    );
  }

  // Une seule sélection : affichage simplifié
  if (availableSelections.length === 1) {
    const selection = availableSelections[0];
    const isSelected = formData.selection.selectionId === selection.id;

    return (
      <div className="space-y-6">
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start gap-3">
            <CheckCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-blue-800">
                Sélection unique - Sélectionnée automatiquement
              </p>
              <p className="text-sm text-blue-600 mt-1">
                Vous n&apos;avez qu&apos;une seule sélection avec des produits.
              </p>
            </div>
          </div>
        </div>

        <Card className="p-6 border-2 border-green-500 bg-green-50/30">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-lg bg-linkme-turquoise/10 flex items-center justify-center flex-shrink-0">
              <ListChecks className="h-6 w-6 text-linkme-turquoise" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold text-gray-900">
                  {selection.name}
                </h3>
                <CheckCircle className="h-5 w-5 text-green-500" />
              </div>
              {selection.description && (
                <p className="text-sm text-gray-500 mt-1">{selection.description}</p>
              )}
              <div className="flex items-center gap-4 mt-3 text-sm">
                <div className="flex items-center gap-1 text-gray-600">
                  <Package className="h-4 w-4" />
                  <span>{selection.products_count} produits</span>
                </div>
                <div className="flex items-center gap-1 text-gray-500">
                  <Calendar className="h-4 w-4" />
                  <span>
                    Créée le{' '}
                    {new Date(selection.created_at).toLocaleDateString('fr-FR')}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  // Plusieurs sélections : affichage en grille
  return (
    <div className="space-y-6">
      <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-amber-800">
              Les prix et marges varient selon la sélection
            </p>
            <p className="text-sm text-amber-600 mt-1">
              Choisissez la sélection à utiliser pour cette commande.
              {formData.cart.items.length > 0 && (
                <span className="font-medium">
                  {' '}
                  Attention : changer de sélection videra votre panier.
                </span>
              )}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {availableSelections.map((selection) => {
          const isSelected = formData.selection.selectionId === selection.id;
          const isPublished = selection.published_at !== null;

          return (
            <Card
              key={selection.id}
              className={cn(
                'p-5 cursor-pointer transition-all hover:shadow-md',
                isSelected
                  ? 'border-2 border-green-500 bg-green-50/30'
                  : 'hover:border-gray-300'
              )}
              onClick={() => handleSelectSelection(selection)}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className="w-10 h-10 rounded-lg bg-linkme-turquoise/10 flex items-center justify-center flex-shrink-0">
                    <ListChecks className="h-5 w-5 text-linkme-turquoise" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-900 truncate">
                        {selection.name}
                      </h3>
                      {isPublished && (
                        <span className="px-2 py-0.5 text-xs font-medium bg-green-100 text-green-700 rounded">
                          Publié
                        </span>
                      )}
                    </div>
                    {selection.description && (
                      <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                        {selection.description}
                      </p>
                    )}
                  </div>
                </div>
                {isSelected && (
                  <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 ml-2" />
                )}
              </div>

              {/* Stats */}
              <div className="flex items-center gap-4 mt-4 pt-4 border-t text-sm">
                <div className="flex items-center gap-1 text-gray-600">
                  <Package className="h-4 w-4" />
                  <span className="font-medium">{selection.products_count}</span>
                  <span className="text-gray-400">produits</span>
                </div>
                <div className="flex items-center gap-1 text-gray-500">
                  <Calendar className="h-4 w-4" />
                  <span>
                    {new Date(selection.created_at).toLocaleDateString('fr-FR')}
                  </span>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Sélection choisie */}
      {formData.selection.selectionId && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <span className="font-medium text-green-800">
              Sélection choisie : {formData.selection.selectionName}
            </span>
            <span className="text-green-600">
              ({formData.selection.productsCount} produits)
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

export default SelectionStep;

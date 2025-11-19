'use client';

import { useState, useCallback } from 'react';

// import { deleteProductAlerts } from '@/app/actions/delete-product-alerts'; // ❌ Cannot import Server Actions from packages
import { createClient } from '@verone/utils/supabase/client';

/**
 * Hook pour gérer le statut commercial manuel d'un produit
 *
 * Statuts disponibles :
 * - 'active' : Produit actif au catalogue
 * - 'preorder' : Produit en précommande (disponible sous 2-8 semaines)
 * - 'discontinued' : Produit arrêté du catalogue
 * - 'draft' : Produit en cours de sourcing (non publié)
 *
 * Business Rules :
 * - Si statut passe à 'preorder' ou 'discontinued' → min_stock = 0 + suppression alertes stock
 *
 * Ce statut est MANUEL et MODIFIABLE par l'utilisateur via inline edit
 */

export type ProductStatus = 'active' | 'preorder' | 'discontinued' | 'draft';

export interface ProductStatusOption {
  value: ProductStatus;
  label: string;
  description: string;
  variant: 'success' | 'default' | 'secondary' | 'destructive';
  icon: string;
}

export const PRODUCT_STATUS_OPTIONS: ProductStatusOption[] = [
  {
    value: 'active',
    label: 'Actif',
    description: 'Produit actif au catalogue',
    variant: 'success',
    icon: '✓',
  },
  {
    value: 'preorder',
    label: 'Précommande',
    description: 'Disponible sous 2-8 semaines',
    variant: 'default',
    icon: '📅',
  },
  {
    value: 'discontinued',
    label: 'Arrêté',
    description: 'Produit arrêté du catalogue',
    variant: 'destructive',
    icon: '⚠',
  },
  {
    value: 'draft',
    label: 'Brouillon',
    description: 'En cours de sourcing',
    variant: 'secondary',
    icon: '📝',
  },
];

export interface UseProductStatusOptions {
  productId: string;
  initialStatus: ProductStatus;
  onUpdate: (newStatus: ProductStatus) => void;
  onError?: (error: string) => void;
}

export interface UseProductStatusReturn {
  currentStatus: ProductStatus;
  isEditing: boolean;
  isSaving: boolean;
  error: string | null;
  startEdit: () => void;
  cancelEdit: () => void;
  saveStatus: (newStatus: ProductStatus) => Promise<void>;
  getStatusOption: (status: ProductStatus) => ProductStatusOption;
}

export function useProductStatus({
  productId,
  initialStatus,
  onUpdate,
  onError,
}: UseProductStatusOptions): UseProductStatusReturn {
  const [currentStatus, setCurrentStatus] =
    useState<ProductStatus>(initialStatus);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  const startEdit = useCallback(() => {
    setIsEditing(true);
    setError(null);
  }, []);

  const cancelEdit = useCallback(() => {
    setIsEditing(false);
    setError(null);
  }, []);

  const saveStatus = useCallback(
    async (newStatus: ProductStatus) => {
      if (newStatus === currentStatus) {
        setIsEditing(false);
        return;
      }

      setIsSaving(true);
      setError(null);

      try {
        const updates: any = { product_status: newStatus };

        // ✅ BUSINESS RULE: Précommande/Arrêté → min_stock=0 + Supprimer alertes
        if (newStatus === 'preorder' || newStatus === 'discontinued') {
          updates.min_stock = 0;

          // ❌ TODO: Supprimer alertes stock (must be handled in app layer, not package)
          // Cannot call Server Actions from packages - app must handle alert deletion separately
          // Supprimer les alertes stock en DB
          // try {
          //   const result = await deleteProductAlerts(productId);
          //   if (result.success) {
          //     console.log(
          //       `✅ ${result.deletedCount} alerte(s) supprimée(s) pour passage en ${newStatus}`
          //     );
          //   } else {
          //     console.warn(
          //       '⚠️ Erreur suppression alertes (non-bloquant):',
          //       result.error
          //     );
          //   }
          // } catch (alertError) {
          //   console.error(
          //     '⚠️ Erreur suppression alertes (non-bloquant):',
          //     alertError
          //   );
          // }
        }

        // Mise à jour produit
        const { error: updateError } = await supabase
          .from('products')
          .update(updates)
          .eq('id', productId);

        if (updateError) throw updateError;

        setCurrentStatus(newStatus);
        onUpdate(newStatus);
        setIsEditing(false);
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : 'Erreur de mise à jour du statut';
        setError(errorMessage);
        if (onError) {
          onError(errorMessage);
        }
      } finally {
        setIsSaving(false);
      }
    },
    [currentStatus, productId, onUpdate, onError, supabase]
  );

  const getStatusOption = useCallback(
    (status: ProductStatus): ProductStatusOption => {
      return (
        PRODUCT_STATUS_OPTIONS.find(opt => opt.value === status) ||
        PRODUCT_STATUS_OPTIONS[0]
      );
    },
    []
  );

  return {
    currentStatus,
    isEditing,
    isSaving,
    error,
    startEdit,
    cancelEdit,
    saveStatus,
    getStatusOption,
  };
}

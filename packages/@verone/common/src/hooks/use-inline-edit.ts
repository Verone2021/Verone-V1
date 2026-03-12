'use client';

import { useState, useCallback } from 'react';

// import { deleteProductAlerts } from '@/app/actions/delete-product-alerts'; // ❌ Cannot import Server Actions from packages
import { createClient } from '@verone/utils/supabase/client';

// Types des sections éditables
export type EditableSection =
  // Sections produits
  | 'general'
  | 'pricing'
  | 'supplier'
  | 'weight'
  | 'relations'
  | 'identifiers'
  | 'stock'
  // Sections organisations/contacts
  | 'contact'
  | 'address'
  | 'legal'
  | 'commercial'
  | 'performance'
  | 'personal'
  | 'roles'
  | 'preferences'
  // Sections commandes
  | 'order_header'
  | 'order_items';

// Interface pour les options du hook
export interface UseInlineEditOptions {
  productId?: string; // Pour les produits
  organisationId?: string; // Pour les organisations/fournisseurs
  contactId?: string; // Pour les contacts
  salesOrderId?: string; // Pour les commandes clients
  purchaseOrderId?: string; // Pour les commandes fournisseurs
  onUpdate: (updatedData: any) => void;
  onError?: (error: string) => void;
}

// État d'édition par section
interface SectionEditState {
  isEditing: boolean;
  editedData: any;
  isSaving: boolean;
  error: string | null;
  hasChanges: boolean;
}

/**
 * Hook principal pour l'édition inline par sections
 * Compatible avec l'interface attendue par les composants EditSection
 */
export function useInlineEdit(options: UseInlineEditOptions) {
  const {
    productId,
    organisationId,
    contactId,
    salesOrderId,
    purchaseOrderId,
    onUpdate,
    onError,
  } = options;
  const [sections, setSections] = useState<
    Record<EditableSection, SectionEditState>
  >({} as any);
  const supabase = createClient();

  // Getters par section
  const isEditing = useCallback(
    (section: EditableSection) => {
      return sections[section]?.isEditing ?? false;
    },
    [sections]
  );

  const isSaving = useCallback(
    (section: EditableSection) => {
      return sections[section]?.isSaving ?? false;
    },
    [sections]
  );

  const getError = useCallback(
    (section: EditableSection) => {
      return sections[section]?.error ?? null;
    },
    [sections]
  );

  const getEditedData = useCallback(
    (section: EditableSection) => {
      return sections[section]?.editedData ?? null;
    },
    [sections]
  );

  const hasChanges = useCallback(
    (section: EditableSection) => {
      return sections[section]?.hasChanges ?? false;
    },
    [sections]
  );

  // Actions par section
  const startEdit = useCallback(
    (section: EditableSection, initialData: any) => {
      setSections(prev => ({
        ...prev,
        [section]: {
          isEditing: true,
          editedData: { ...initialData },
          isSaving: false,
          error: null,
          hasChanges: false,
        },
      }));
    },
    []
  );

  const cancelEdit = useCallback((section: EditableSection) => {
    setSections(prev => ({
      ...prev,
      [section]: {
        isEditing: false,
        editedData: null,
        isSaving: false,
        error: null,
        hasChanges: false,
      },
    }));
  }, []);

  const updateEditedData = useCallback(
    (section: EditableSection, updates: any) => {
      setSections(prev => ({
        ...prev,
        [section]: {
          ...prev[section],
          editedData: { ...prev[section]?.editedData, ...updates },
          hasChanges: true,
        },
      }));
    },
    []
  );

  const saveChanges = useCallback(
    async (section: EditableSection): Promise<boolean> => {
      const sectionState = sections[section];
      if (!sectionState?.editedData || !sectionState.hasChanges) return false;

      setSections(prev => ({
        ...prev,
        [section]: { ...prev[section], isSaving: true, error: null },
      }));

      try {
        let success = false;

        if (productId) {
          // ✅ BUSINESS RULE: Précommande/Arrêté → min_stock=0 + Supprimer alertes
          if (section === 'stock') {
            const newStatus = sectionState.editedData.product_status;

            if (newStatus === 'preorder' || newStatus === 'discontinued') {
              // Forcer min_stock à 0 (règle métier)
              sectionState.editedData.min_stock = 0;

              // ❌ TODO: Supprimer alertes stock (géré dans l'app via use-product-status.ts)
              // Cannot call Server Actions from packages - must be called from app layer
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
              //     // Continue quand même (non-bloquant)
              //   }
              // } catch (alertError) {
              //   console.error(
              //     '⚠️ Erreur suppression alertes (non-bloquant):',
              //     alertError
              //   );
              //   // Continue quand même (non-bloquant)
              // }
            }
          }

          // Mise à jour produit
          const { error } = await supabase
            .from('products')
            .update(sectionState.editedData)
            .eq('id', productId);

          success = !error;
          if (error) throw error;
        } else if (organisationId) {
          // Mise à jour organisation/fournisseur
          console.log(
            '🔄 Updating organisation with data:',
            sectionState.editedData
          );

          // Nettoyer les données avant la mise à jour
          const cleanedData = { ...sectionState.editedData };

          // 🔧 FIX BUG #2 : Exclure les champs legacy pour éviter écrasement des données
          // Les champs legacy (address_line1, etc.) sont obsolètes, on utilise maintenant billing_* et shipping_*
          const LEGACY_ADDRESS_FIELDS = [
            'address_line1',
            'address_line2',
            'postal_code',
            'city',
            'region',
            'country',
          ];
          LEGACY_ADDRESS_FIELDS.forEach(field => {
            delete cleanedData[field];
          });

          // Convertir les chaînes vides en null pour les champs optionnels
          Object.keys(cleanedData).forEach(key => {
            if (cleanedData[key] === '') {
              cleanedData[key] = null;
            }
          });

          console.log(
            '🧹 Cleaned data for organisation update (sans legacy):',
            cleanedData
          );

          const { error, data } = await supabase
            .from('organisations')
            .update(cleanedData)
            .eq('id', organisationId)
            .select('id');

          success = !error;
          if (error) {
            console.error('❌ Supabase organisation update error:', error);
            console.error('❌ Error details:', {
              message: error.message,
              details: error.details,
              hint: error.hint,
              code: error.code,
            });
            throw new Error(
              error.message ||
                error.details ||
                'Erreur de mise à jour organisation'
            );
          } else {
            console.log('✅ Organisation update successful:', data);
          }
        } else if (contactId) {
          // Mise à jour contact
          console.log(
            '🔄 Updating contact with data:',
            sectionState.editedData
          );

          // Nettoyer les données avant la mise à jour
          const cleanedData = { ...sectionState.editedData };

          // Convertir les chaînes vides en null pour les champs optionnels
          Object.keys(cleanedData).forEach(key => {
            if (cleanedData[key] === '') {
              cleanedData[key] = null;
            }
          });

          console.log('🧹 Cleaned data for contact update:', cleanedData);

          const { error, data } = await supabase
            .from('contacts')
            .update(cleanedData)
            .eq('id', contactId)
            .select('id');

          success = !error;
          if (error) {
            console.error('❌ Supabase contact update error:', error);
            console.error('❌ Error details:', {
              message: error.message,
              details: error.details,
              hint: error.hint,
              code: error.code,
            });
            throw new Error(
              error.message || error.details || 'Erreur de mise à jour contact'
            );
          } else {
            console.log('✅ Contact update successful:', data);
          }
        } else if (salesOrderId) {
          // Mise à jour commande client
          console.log(
            '🔄 Updating sales order with data:',
            sectionState.editedData
          );

          const cleanedData = { ...sectionState.editedData };

          // Convertir les chaînes vides en null pour les champs optionnels
          Object.keys(cleanedData).forEach(key => {
            if (cleanedData[key] === '') {
              cleanedData[key] = null;
            }
          });

          console.log('🧹 Cleaned data for sales order update:', cleanedData);

          const { error, data } = await supabase
            .from('sales_orders')
            .update(cleanedData)
            .eq('id', salesOrderId)
            .select('id');

          success = !error;
          if (error) {
            console.error('❌ Supabase sales order update error:', error);
            throw new Error(
              error.message ||
                error.details ||
                'Erreur de mise à jour commande client'
            );
          } else {
            console.log('✅ Sales order update successful:', data);
          }
        } else if (purchaseOrderId) {
          // Mise à jour commande fournisseur
          console.log(
            '🔄 Updating purchase order with data:',
            sectionState.editedData
          );

          const cleanedData = { ...sectionState.editedData };

          // Convertir les chaînes vides en null pour les champs optionnels
          Object.keys(cleanedData).forEach(key => {
            if (cleanedData[key] === '') {
              cleanedData[key] = null;
            }
          });

          console.log(
            '🧹 Cleaned data for purchase order update:',
            cleanedData
          );

          const { error, data } = await supabase
            .from('purchase_orders')
            .update(cleanedData)
            .eq('id', purchaseOrderId)
            .select('id');

          success = !error;
          if (error) {
            console.error('❌ Supabase purchase order update error:', error);
            throw new Error(
              error.message ||
                error.details ||
                'Erreur de mise à jour commande fournisseur'
            );
          } else {
            console.log('✅ Purchase order update successful:', data);
          }
        }

        if (success) {
          onUpdate(sectionState.editedData);
          setSections(prev => ({
            ...prev,
            [section]: {
              isEditing: false,
              editedData: null,
              isSaving: false,
              error: null,
              hasChanges: false,
            },
          }));
        }

        return success;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Erreur inconnue';
        setSections(prev => ({
          ...prev,
          [section]: { ...prev[section], isSaving: false, error: errorMessage },
        }));

        if (onError) {
          onError(errorMessage);
        }

        return false;
      }
    },
    [
      sections,
      productId,
      organisationId,
      contactId,
      salesOrderId,
      purchaseOrderId,
      onUpdate,
      onError,
      supabase,
    ]
  );

  return {
    isEditing,
    isSaving,
    getError,
    getEditedData,
    hasChanges,
    startEdit,
    cancelEdit,
    updateEditedData,
    saveChanges,
  };
}

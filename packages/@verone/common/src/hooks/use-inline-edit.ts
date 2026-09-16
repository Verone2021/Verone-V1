'use client';

import { useState, useCallback, useRef } from 'react';

// import { deleteProductAlerts } from '@/app/actions/delete-product-alerts'; // ❌ Cannot import Server Actions from packages
import { createClient } from '@verone/utils/supabase/client';

import { persistSection } from './inline-edit-persist';

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
  | 'characteristics_attributes'
  | 'characteristics_dimensions'
  | 'characteristics_identification'
  // Sections organisations/contacts
  | 'contact'
  | 'address'
  | 'legal'
  | 'commercial'
  | 'performance'
  | 'personal'
  | 'roles'
  | 'preferences'
  // Sections sourcing
  | 'details'
  | 'notes'
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
  onUpdate: (updatedData: Record<string, unknown>) => void;
  onError?: (error: string) => void;
}

// Type pour les données de section d'édition
// Utilise unknown pour rester flexible pour tous les types de champs
export type SectionData = Record<string, unknown>;

/** Helper pour lire un champ string depuis les données de section éditée */
export function getStringField(
  data: SectionData | null | undefined,
  key: string,
  fallback = ''
): string {
  const val = data?.[key];
  return typeof val === 'string' ? val : fallback;
}

/** Helper pour lire un champ number depuis les données de section éditée */
export function getNumberField(
  data: SectionData | null | undefined,
  key: string,
  fallback = 0
): number {
  const val = data?.[key];
  return typeof val === 'number' ? val : fallback;
}

/** Helper pour lire un champ boolean depuis les données de section éditée */
export function getBooleanField(
  data: SectionData | null | undefined,
  key: string,
  fallback = false
): boolean {
  const val = data?.[key];
  return typeof val === 'boolean' ? val : fallback;
}

// État d'édition par section
interface SectionEditState {
  isEditing: boolean;
  editedData: SectionData | null;
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
  >({} as Record<EditableSection, SectionEditState>);
  /**
   * Miroir synchrone de `sections`.
   *
   * `saveChanges` doit lire l'état le plus récent, y compris lorsqu'un appelant
   * enchaîne `updateEditedData(...)` puis `saveChanges(...)` dans le même tick :
   * `sections` n'est alors pas encore rafraîchi et l'ancienne valeur partait en
   * base (section « Détails produit » du sourcing jamais enregistrée).
   */
  const sectionsRef = useRef<Record<EditableSection, SectionEditState>>(
    {} as Record<EditableSection, SectionEditState>
  );
  const supabase = createClient();

  /** Écrit l'état ET son miroir synchrone, dans le même geste. */
  const writeSections = useCallback(
    (
      updater: (
        prev: Record<EditableSection, SectionEditState>
      ) => Record<EditableSection, SectionEditState>
    ) => {
      sectionsRef.current = updater(sectionsRef.current);
      setSections(sectionsRef.current);
    },
    []
  );

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
    (section: EditableSection): SectionData | null => {
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
    (section: EditableSection, initialData: SectionData) => {
      writeSections(prev => ({
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
    [writeSections]
  );

  const cancelEdit = useCallback(
    (section: EditableSection) => {
      writeSections(prev => ({
        ...prev,
        [section]: {
          isEditing: false,
          editedData: null,
          isSaving: false,
          error: null,
          hasChanges: false,
        },
      }));
    },
    [writeSections]
  );

  const updateEditedData = useCallback(
    (section: EditableSection, updates: SectionData) => {
      writeSections(prev => ({
        ...prev,
        [section]: {
          ...prev[section],
          editedData: { ...prev[section]?.editedData, ...updates },
          hasChanges: true,
        },
      }));
    },
    [writeSections]
  );

  const saveChanges = useCallback(
    async (
      section: EditableSection,
      /**
       * Données à enregistrer. Quand elles sont fournies, elles REMPLACENT
       * l'état de la section : c'est le seul moyen sûr d'enregistrer une
       * transformation calculée dans le même tick que l'appel (l'état React
       * n'est pas encore rafraîchi à ce moment-là).
       */
      payload?: SectionData
    ): Promise<boolean> => {
      const sectionState = sectionsRef.current[section];
      const source = payload ?? sectionState?.editedData;
      if (!source) return false;
      if (payload === undefined && !sectionState?.hasChanges) return false;
      // Copie : la règle métier « stock » ci-dessous ajuste des champs, et on ne
      // mute ni l'état React ni l'objet fourni par l'appelant.
      const dataToSave: SectionData = { ...source };

      writeSections(prev => ({
        ...prev,
        [section]: { ...prev[section], isSaving: true, error: null },
      }));

      try {
        const success = await persistSection({
          supabase,
          section,
          dataToSave,
          productId,
          organisationId,
          contactId,
          salesOrderId,
          purchaseOrderId,
        });

        if (success) {
          onUpdate(dataToSave);
          writeSections(prev => ({
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
        writeSections(prev => ({
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
      writeSections,
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

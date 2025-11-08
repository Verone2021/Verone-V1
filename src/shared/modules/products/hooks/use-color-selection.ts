'use client';

import { useState, useEffect, useMemo } from 'react';

import { useProductColors } from './use-product-colors';

/**
 * Hook complet pour sélection de couleurs avec création dynamique
 * Utilisé par DynamicColorSelector
 *
 * Fonctionnalités:
 * - Recherche couleurs existantes avec filtrage
 * - Création nouvelle couleur à la volée
 * - Gestion sélection active
 * - Support exclude colors (couleurs déjà utilisées dans groupe variantes)
 *
 * @see src/shared/modules/ui/components/selectors/DynamicColorSelector.tsx
 */
export function useColorSelection(
  value?: string,
  excludeColors: string[] = []
) {
  const [selectedColor, setSelectedColor] = useState<string | undefined>(value);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const { colors, loading, createColor } = useProductColors();

  // Sync avec value externe
  useEffect(() => {
    if (value !== selectedColor) {
      setSelectedColor(value);
    }
  }, [value, selectedColor]);

  // Filtrer couleurs selon recherche et exclusions
  const filteredColors = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return colors
      .filter(color => {
        // Exclure couleurs déjà utilisées
        if (excludeColors.includes(color.name.toLowerCase())) {
          return false;
        }

        // Si pas de recherche, tout afficher
        if (!query) return true;

        // Recherche par nom
        return color.name.toLowerCase().includes(query);
      })
      .sort((a, b) => {
        // Prioriser couleurs prédéfinies
        if (a.is_predefined && !b.is_predefined) return -1;
        if (!a.is_predefined && b.is_predefined) return 1;
        return a.name.localeCompare(b.name);
      });
  }, [colors, searchQuery, excludeColors]);

  // Vérifier si couleur recherchée existe déjà
  const colorExists = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return false;

    return colors.some(color => color.name.toLowerCase() === query);
  }, [colors, searchQuery]);

  // Créer et sélectionner couleur automatiquement
  const handleCreateAndSelect = async () => {
    const colorName = searchQuery.trim();
    if (!colorName || colorExists) return;

    setIsCreating(true);

    try {
      // Créer couleur sans hex_code (sera généré automatiquement)
      const newColor = await createColor(colorName, '');

      if (newColor) {
        setSelectedColor(newColor.name);
        setSearchQuery('');
      }
    } catch (error) {
      console.error('[useColorSelection] Error creating color:', error);
    } finally {
      setIsCreating(false);
    }
  };

  return {
    selectedColor,
    setSelectedColor,
    searchQuery,
    setSearchQuery,
    filteredColors,
    colorExists,
    handleCreateAndSelect,
    isCreating,
    loading,
  };
}

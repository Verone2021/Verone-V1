'use client';

import { useState, useEffect, useMemo } from 'react';

import { createClient } from '@verone/utils/supabase/client';

/**
 * Hook pour récupérer les couleurs/valeurs variantes déjà utilisées dans un groupe
 * Utilisé pour éviter les doublons lors de la création de nouveaux produits
 */
export function useGroupUsedColors(
  groupId: string,
  variantType: 'color' | 'material' | 'size' | 'pattern' = 'color'
) {
  const [usedColors, setUsedColors] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  // ✅ FIX: Use singleton client via useMemo
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    async function fetchUsedColors() {
      setLoading(true);

      const { data, error } = await supabase
        .from('products')
        .select('variant_attributes')
        .eq('variant_group_id', groupId);

      if (error) {
        console.error(
          '[useGroupUsedColors] Error fetching used colors:',
          error
        );
        setUsedColors([]);
      } else {
        // Extraire les valeurs de variantes selon le type
        const colors = (data || [])
          .map((product: any) => {
            const attrs = product.variant_attributes || {};

            // Extraire la valeur selon le type de variante
            let value: string | null = null;

            if (variantType === 'color') {
              value = attrs.color_name || attrs.color || null;
            } else if (variantType === 'material') {
              value = attrs.material || null;
            } else if (variantType === 'size') {
              value = attrs.size || null;
            } else if (variantType === 'pattern') {
              value = attrs.pattern || null;
            }

            return value;
          })
          .filter((color): color is string => !!color)
          .map((color: string) => color.trim().toLowerCase()); // Normaliser pour comparaison

        setUsedColors([...new Set(colors)]); // Dédupliquer
      }

      setLoading(false);
    }

    if (groupId) {
      fetchUsedColors();
    } else {
      setUsedColors([]);
      setLoading(false);
    }
  }, [groupId, variantType]);

  return { usedColors, loading };
}

/**
 * Type pour une couleur produit
 */
export interface ProductColor {
  id?: string;
  name: string;
  hex_code: string;
  is_predefined?: boolean;
  created_at?: string;
}

/**
 * Hook pour récupérer et gérer les couleurs produits
 * Utilisé par DynamicColorSelector pour affichage et création dynamique
 *
 * Fonctionnalités:
 * - Charger couleurs depuis table product_colors
 * - Créer nouvelle couleur à la volée
 * - Fallback vers couleurs prédéfinies si table inexistante
 */
export function useProductColors() {
  const [colors, setColors] = useState<ProductColor[]>([]);
  const [loading, setLoading] = useState(true);
  // ✅ FIX: Use singleton client via useMemo
  const supabase = useMemo(() => createClient(), []);

  // Couleurs prédéfinies par défaut (fallback)
  const defaultColors: ProductColor[] = [
    { name: 'Noir', hex_code: '#000000', is_predefined: true },
    { name: 'Blanc', hex_code: '#FFFFFF', is_predefined: true },
    { name: 'Gris', hex_code: '#808080', is_predefined: true },
    { name: 'Beige', hex_code: '#F5F5DC', is_predefined: true },
    { name: 'Marron', hex_code: '#8B4513', is_predefined: true },
    { name: 'Bleu', hex_code: '#0000FF', is_predefined: true },
    { name: 'Vert', hex_code: '#008000', is_predefined: true },
    { name: 'Rouge', hex_code: '#FF0000', is_predefined: true },
    { name: 'Jaune', hex_code: '#FFFF00', is_predefined: true },
    { name: 'Orange', hex_code: '#FFA500', is_predefined: true },
  ];

  // Charger couleurs depuis DB
  useEffect(() => {
    async function fetchColors() {
      setLoading(true);

      const { data, error } = await supabase
        .from('product_colors')
        .select('id, name, hex_code, is_predefined, created_at')
        .order('is_predefined', { ascending: false })
        .order('name');

      if (error) {
        console.warn(
          '[useProductColors] Table product_colors might not exist, using default colors:',
          error.message
        );
        setColors(defaultColors);
      } else {
        // Map data to ensure proper types (handle nullable fields from DB)
        const mappedColors: ProductColor[] = (data || [])
          .filter((c): c is typeof c & { hex_code: string } => !!c.hex_code)
          .map(c => ({
            id: c.id,
            name: c.name,
            hex_code: c.hex_code,
            is_predefined: c.is_predefined ?? false,
            created_at: c.created_at ?? undefined,
          }));
        setColors(mappedColors.length > 0 ? mappedColors : defaultColors);
      }

      setLoading(false);
    }

    fetchColors();
  }, [supabase]);

  // Créer nouvelle couleur
  const createColor = async (
    name: string,
    hex_code: string
  ): Promise<ProductColor | null> => {
    // Normaliser nom couleur
    const normalizedName =
      name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();

    // Générer hex_code aléatoire si non fourni
    const finalHexCode =
      hex_code ||
      `#${Math.floor(Math.random() * 16777215)
        .toString(16)
        .padStart(6, '0')}`;

    try {
      const { data, error } = await supabase
        .from('product_colors')
        .insert({
          name: normalizedName,
          hex_code: finalHexCode,
          is_predefined: false,
        })
        .select()
        .single();

      if (error) {
        console.error('[useProductColors] Error creating color:', error);
        return null;
      }

      // Ajouter à la liste locale
      const newColor = data as ProductColor;
      setColors(prev => [...prev, newColor]);

      return newColor;
    } catch (err) {
      console.error('[useProductColors] Exception creating color:', err);
      return null;
    }
  };

  return {
    colors,
    loading,
    createColor,
  };
}

'use server';

import {
  getSubcategoryPrefix,
  generateVeroneSKU,
} from '@verone/products/utils/sku-generator';
import { createClient } from '@verone/utils/supabase/server';

/**
 * Récupère le prochain numéro SKU disponible pour une sous-catégorie
 *
 * @param subcategoryId - ID de la sous-catégorie
 * @returns Le prochain SKU disponible au format "XXX-0000"
 *
 * @example
 * const nextSKU = await getNextSKU('uuid-subcategory-fauteuil');
 * // Returns: 'FAU-0001' (si aucun produit existant)
 * // Returns: 'FAU-0024' (si le dernier est FAU-0023)
 */
export async function getNextSKU(subcategoryId: string): Promise<{
  success: boolean;
  sku?: string;
  prefix?: string;
  nextNumber?: number;
  error?: string;
}> {
  try {
    const supabase = await createClient();

    // 1. Récupérer le nom de la sous-catégorie
    const { data: subcategory, error: subcategoryError } = await supabase
      .from('subcategories')
      .select('name')
      .eq('id', subcategoryId)
      .single();

    if (subcategoryError || !subcategory) {
      return {
        success: false,
        error: `Sous-catégorie non trouvée: ${subcategoryError?.message || 'ID invalide'}`,
      };
    }

    const prefix = getSubcategoryPrefix(subcategory.name);

    // 2. Trouver le numéro max existant pour ce préfixe
    // Recherche tous les SKUs qui commencent par ce préfixe
    const { data: existingProducts, error: productsError } = await supabase
      .from('products')
      .select('sku')
      .like('sku', `${prefix}-%`)
      .order('sku', { ascending: false })
      .limit(100);

    if (productsError) {
      return {
        success: false,
        error: `Erreur lors de la recherche des SKUs existants: ${productsError.message}`,
      };
    }

    // 3. Extraire le numéro max
    let maxNumber = 0;

    if (existingProducts && existingProducts.length > 0) {
      for (const product of existingProducts) {
        const match = product.sku?.match(new RegExp(`^${prefix}-(\\d{4})$`));
        if (match) {
          const num = parseInt(match[1], 10);
          if (num > maxNumber) {
            maxNumber = num;
          }
        }
      }
    }

    // 4. Générer le prochain SKU
    const nextNumber = maxNumber + 1;
    const nextSKU = generateVeroneSKU(subcategory.name, nextNumber);

    return {
      success: true,
      sku: nextSKU,
      prefix,
      nextNumber,
    };
  } catch (error) {
    console.error('❌ Erreur getNextSKU:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue',
    };
  }
}

/**
 * Récupère le prochain numéro SKU disponible à partir du nom de la sous-catégorie
 * (utile quand on n'a pas l'ID mais juste le nom)
 *
 * @param subcategoryName - Nom de la sous-catégorie (ex: "Fauteuil")
 * @returns Le prochain SKU disponible
 */
export async function getNextSKUByName(subcategoryName: string): Promise<{
  success: boolean;
  sku?: string;
  prefix?: string;
  nextNumber?: number;
  error?: string;
}> {
  try {
    const supabase = await createClient();
    const prefix = getSubcategoryPrefix(subcategoryName);

    // Trouver le numéro max existant pour ce préfixe
    const { data: existingProducts, error: productsError } = await supabase
      .from('products')
      .select('sku')
      .like('sku', `${prefix}-%`)
      .order('sku', { ascending: false })
      .limit(100);

    if (productsError) {
      return {
        success: false,
        error: `Erreur lors de la recherche des SKUs existants: ${productsError.message}`,
      };
    }

    // Extraire le numéro max
    let maxNumber = 0;

    if (existingProducts && existingProducts.length > 0) {
      for (const product of existingProducts) {
        const match = product.sku?.match(new RegExp(`^${prefix}-(\\d{4})$`));
        if (match) {
          const num = parseInt(match[1], 10);
          if (num > maxNumber) {
            maxNumber = num;
          }
        }
      }
    }

    // Générer le prochain SKU
    const nextNumber = maxNumber + 1;
    const nextSKU = generateVeroneSKU(subcategoryName, nextNumber);

    return {
      success: true,
      sku: nextSKU,
      prefix,
      nextNumber,
    };
  } catch (error) {
    console.error('❌ Erreur getNextSKUByName:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue',
    };
  }
}

/**
 * Vérifie si un SKU est disponible (non utilisé)
 *
 * @param sku - SKU à vérifier
 * @returns true si le SKU est disponible
 */
export async function isSKUAvailable(sku: string): Promise<{
  available: boolean;
  error?: string;
}> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('products')
      .select('id')
      .eq('sku', sku)
      .maybeSingle();

    if (error) {
      return {
        available: false,
        error: error.message,
      };
    }

    return {
      available: data === null,
    };
  } catch (error) {
    console.error('❌ Erreur isSKUAvailable:', error);
    return {
      available: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue',
    };
  }
}

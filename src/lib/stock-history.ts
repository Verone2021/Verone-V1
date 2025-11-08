/**
 * Utilitaires pour vérifier l'historique du stock
 */

import { createClient } from '@/lib/supabase/client';

/**
 * Vérifie si un produit a déjà été en stock (a eu des mouvements d'entrée)
 * @param productId - ID du produit
 * @returns Promise<boolean> - true si le produit a déjà été en stock
 */
export async function hasProductBeenInStock(
  productId: string
): Promise<boolean> {
  try {
    const supabase = createClient();

    // Chercher des mouvements d'entrée pour ce produit
    const { data, error } = await supabase
      .from('stock_movements')
      .select('id')
      .eq('product_id', productId)
      .eq('movement_type', 'IN') // Mouvement d'entrée
      .limit(1); // On n'a besoin que de savoir s'il y en a au moins un

    if (error) {
      console.error(
        '❌ Erreur lors de la vérification historique stock:',
        error
      );
      // En cas d'erreur, on autorise par défaut (comportement moins restrictif)
      return false;
    }

    // S'il y a au moins un mouvement d'entrée, le produit a déjà été en stock
    return data && data.length > 0;
  } catch (error) {
    console.error('❌ Erreur inattendue historique stock:', error);
    // En cas d'erreur, on autorise par défaut
    return false;
  }
}

/**
 * Version hook pour React
 */
export function useProductStockHistory() {
  const checkProductStockHistory = async (
    productId: string
  ): Promise<boolean> => {
    return await hasProductBeenInStock(productId);
  };

  return { checkProductStockHistory };
}

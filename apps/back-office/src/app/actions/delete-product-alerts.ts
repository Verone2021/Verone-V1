'use server';

import { createClient } from '@verone/utils/supabase/server';

/**
 * Server Action: Suppression des alertes stock pour un produit
 *
 * Utilisé lorsqu'un produit passe en statut "preorder" ou "discontinued"
 * car ces statuts n'ont pas besoin de seuil d'alerte minimum.
 *
 * @param productId - ID du produit
 * @returns Success status
 */
export async function deleteProductAlerts(productId: string) {
  const supabase = createClient();

  try {
    // Vérifier d'abord combien d'alertes existent
    const { count: initialCount, error: countError } = await supabase
      .from('stock_alert_tracking')
      .select('*', { count: 'exact', head: true })
      .eq('product_id', productId);

    if (countError) {
      console.error('❌ Erreur comptage alertes:', countError);
      throw countError;
    }

    console.warn(
      `📊 Alertes à supprimer pour produit ${productId}:`,
      initialCount ?? 0
    );

    // Supprimer toutes les alertes du produit
    const { error: deleteError } = await supabase
      .from('stock_alert_tracking')
      .delete()
      .eq('product_id', productId);

    if (deleteError) {
      console.error('❌ Erreur suppression alertes:', deleteError);
      throw deleteError;
    }

    console.warn(
      `✅ ${initialCount || 0} alerte(s) supprimée(s) pour produit ${productId}`
    );

    return {
      success: true,
      deletedCount: initialCount ?? 0,
    };
  } catch (error) {
    console.error(
      '❌ Erreur suppression alertes produit:',
      error instanceof Error ? error.message : error
    );
    return {
      success: false,
      deletedCount: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

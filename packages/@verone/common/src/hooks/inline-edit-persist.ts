/**
 * Écriture d'une section éditée, table par table.
 *
 * Sorti de `use-inline-edit.ts` : le hook dépassait les 400 lignes imposées par
 * les standards du dépôt, et cette fonction en concentrait les deux tiers. Rien
 * n'a changé dans le comportement — c'est le même code, à un endroit à lui.
 */

import type { createBrowserClient } from '@supabase/ssr';

import type { Database } from '@verone/types';

import type { EditableSection, SectionData } from './use-inline-edit';

/** Client typé, identique à celui que rend `createClient()` de `@verone/utils`. */
type TypedSupabaseClient = ReturnType<typeof createBrowserClient<Database>>;

export interface PersistSectionParams {
  supabase: TypedSupabaseClient;
  section: EditableSection;
  /** Données à écrire. La règle métier « stock » peut les compléter. */
  dataToSave: SectionData;
  productId?: string;
  organisationId?: string;
  contactId?: string;
  salesOrderId?: string;
  purchaseOrderId?: string;
}

/**
 * Écrit la section dans la table correspondant à l'identifiant fourni.
 * Lève sur erreur Supabase — l'appelant traduit en message d'écran.
 */
export async function persistSection({
  supabase,
  section,
  dataToSave,
  productId,
  organisationId,
  contactId,
  salesOrderId,
  purchaseOrderId,
}: PersistSectionParams): Promise<boolean> {
  let success = false;

  if (productId) {
    // ✅ BUSINESS RULE: Précommande/Arrêté → min_stock=0 + Supprimer alertes
    if (section === 'stock') {
      const newStatus = dataToSave['product_status'] as string | undefined;

      if (newStatus === 'preorder' || newStatus === 'discontinued') {
        // Forcer min_stock à 0 (règle métier)
        dataToSave['min_stock'] = 0;

        // ❌ TODO: Supprimer alertes stock (géré dans l'app via use-product-status.ts)
        // Cannot call Server Actions from packages - must be called from app layer
        // Supprimer les alertes stock en DB
        // try {
        //   const result = await deleteProductAlerts(productId);
        //   if (result.success) {
        //     console.warn(
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
      .update(dataToSave)
      .eq('id', productId);

    success = !error;
    if (error) throw error;
  } else if (organisationId) {
    // Mise à jour organisation/fournisseur
    console.warn('🔄 Updating organisation with data:', dataToSave);

    // Nettoyer les données avant la mise à jour
    const cleanedData = { ...dataToSave };

    // Sync legacy address fields from billing_* (legacy fields still read by some components)
    const LEGACY_SYNC_MAP: Record<string, string> = {
      billing_address_line1: 'address_line1',
      billing_address_line2: 'address_line2',
      billing_postal_code: 'postal_code',
      billing_city: 'city',
      billing_region: 'region',
      billing_country: 'country',
    };
    for (const [billingField, legacyField] of Object.entries(LEGACY_SYNC_MAP)) {
      if (billingField in cleanedData) {
        cleanedData[legacyField] = cleanedData[billingField];
      }
    }

    // If shipping is not different, clear shipping fields
    if (cleanedData['has_different_shipping_address'] === false) {
      cleanedData['shipping_address_line1'] = null;
      cleanedData['shipping_address_line2'] = null;
      cleanedData['shipping_postal_code'] = null;
      cleanedData['shipping_city'] = null;
      cleanedData['shipping_region'] = null;
      cleanedData['shipping_country'] = null;
    }

    // Convertir les chaînes vides en null pour les champs optionnels
    Object.keys(cleanedData).forEach(key => {
      if (cleanedData[key] === '') {
        cleanedData[key] = null;
      }
    });

    console.warn(
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
        error.message ?? error.details ?? 'Erreur de mise à jour organisation'
      );
    } else {
      console.warn('✅ Organisation update successful:', data);
    }
  } else if (contactId) {
    // Mise à jour contact
    console.warn('🔄 Updating contact with data:', dataToSave);

    // Nettoyer les données avant la mise à jour
    const cleanedData = { ...dataToSave };

    // Convertir les chaînes vides en null pour les champs optionnels
    Object.keys(cleanedData).forEach(key => {
      if (cleanedData[key] === '') {
        cleanedData[key] = null;
      }
    });

    console.warn('🧹 Cleaned data for contact update:', cleanedData);

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
        error.message ?? error.details ?? 'Erreur de mise à jour contact'
      );
    } else {
      console.warn('✅ Contact update successful:', data);
    }
  } else if (salesOrderId) {
    // Mise à jour commande client
    console.warn('🔄 Updating sales order with data:', dataToSave);

    const cleanedData = { ...dataToSave };

    // Convertir les chaînes vides en null pour les champs optionnels
    Object.keys(cleanedData).forEach(key => {
      if (cleanedData[key] === '') {
        cleanedData[key] = null;
      }
    });

    console.warn('🧹 Cleaned data for sales order update:', cleanedData);

    const { error, data } = await supabase
      .from('sales_orders')
      .update(cleanedData)
      .eq('id', salesOrderId)
      .select('id');

    success = !error;
    if (error) {
      console.error('❌ Supabase sales order update error:', error);
      throw new Error(
        error.message ??
          error.details ??
          'Erreur de mise à jour commande client'
      );
    } else {
      console.warn('✅ Sales order update successful:', data);
    }
  } else if (purchaseOrderId) {
    // Mise à jour commande fournisseur
    console.warn('🔄 Updating purchase order with data:', dataToSave);

    const cleanedData = { ...dataToSave };

    // Convertir les chaînes vides en null pour les champs optionnels
    Object.keys(cleanedData).forEach(key => {
      if (cleanedData[key] === '') {
        cleanedData[key] = null;
      }
    });

    console.warn('🧹 Cleaned data for purchase order update:', cleanedData);

    const { error, data } = await supabase
      .from('purchase_orders')
      .update(cleanedData)
      .eq('id', purchaseOrderId)
      .select('id');

    success = !error;
    if (error) {
      console.error('❌ Supabase purchase order update error:', error);
      throw new Error(
        error.message ??
          error.details ??
          'Erreur de mise à jour commande fournisseur'
      );
    } else {
      console.warn('✅ Purchase order update successful:', data);
    }
  }

  return success;
}

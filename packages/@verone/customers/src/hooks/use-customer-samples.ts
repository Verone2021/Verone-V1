/**
 * Hook: useCustomerSamples
 * Description: Gestion complète échantillons clients (CRUD + Archive/Réactive)
 *
 * Fonctionnalités:
 * - Fetch échantillons avec filtres (type, archived, customer)
 * - Archive échantillon (retire du PO si draft)
 * - Réactive échantillon archivé
 * - Réinsère échantillon dans PO (regroupement ou création)
 * - Suppression définitive
 *
 * Workflow:
 * - Archive autorisé uniquement si PO status = 'draft' (trigger database)
 * - Réactivation toujours possible
 * - Réinsertion cherche PO draft existant ou crée nouveau
 */

'use client';

import { useState, useEffect } from 'react';

import { toast } from 'react-hot-toast';

import { createClient } from '@/lib/supabase/client';

// =====================================================================
// TYPES
// =====================================================================

export type SampleType = 'internal' | 'customer';
export type SampleStatus =
  | 'draft'
  | 'ordered'
  | 'received'
  | 'archived'
  | 'unknown';

export interface CustomerSample {
  // IDs
  sample_id: string;
  purchase_order_id: string;
  product_id: string;

  // Sample info
  sample_type: SampleType;
  quantity: number;
  unit_price_ht: number;
  sample_notes: string | null;
  archived_at: string | null;
  sample_created_at: string;
  sample_updated_at: string;

  // Status dérivé
  sample_status: SampleStatus;

  // Product
  product_sku: string;
  product_name: string;
  product_description: string | null;
  product_image: string | null;

  // Purchase Order
  po_number: string;
  po_status: string;
  supplier_id: string;
  expected_delivery_date: string | null;
  po_created_at: string;

  // Supplier
  supplier_name: string;
  supplier_trade_name: string | null;

  // Customer (B2B)
  customer_org_id: string | null;
  customer_org_legal_name: string | null;
  customer_org_trade_name: string | null;

  // Customer (B2C)
  customer_ind_id: string | null;
  customer_ind_first_name: string | null;
  customer_ind_last_name: string | null;
  customer_ind_email: string | null;

  // Helpers
  customer_display_name: string;
  customer_type: 'B2B' | 'B2C' | null;
}

export interface SampleFilters {
  sample_type?: SampleType;
  archived?: boolean;
  customer_org_id?: string;
  customer_ind_id?: string;
  supplier_id?: string;
  po_status?: string;
}

// =====================================================================
// HOOK
// =====================================================================

export function useCustomerSamples(filters?: SampleFilters) {
  const [samples, setSamples] = useState<CustomerSample[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  // ===================================================================
  // FETCH SAMPLES (via View customer_samples_view)
  // ===================================================================

  const fetchSamples = async () => {
    try {
      setLoading(true);
      setError(null);

      // @ts-ignore - View customer_samples_view not yet in generated types
      let query = supabase
        // @ts-ignore - View customer_samples_view type missing
        .from('customer_samples_view')
        .select('*')
        .order('sample_created_at', { ascending: false });

      // Appliquer filtres
      if (filters?.sample_type) {
        query = query.eq('sample_type', filters.sample_type);
      }

      if (filters?.archived !== undefined) {
        if (filters.archived) {
          query = query.not('archived_at', 'is', null);
        } else {
          query = query.is('archived_at', null);
        }
      }

      if (filters?.customer_org_id) {
        query = query.eq('customer_org_id', filters.customer_org_id);
      }

      if (filters?.customer_ind_id) {
        query = query.eq('customer_ind_id', filters.customer_ind_id);
      }

      if (filters?.supplier_id) {
        query = query.eq('supplier_id', filters.supplier_id);
      }

      if (filters?.po_status) {
        query = query.eq('po_status', filters.po_status as any);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      setSamples((data as any) || []);
    } catch (err: any) {
      console.error('Error fetching samples:', err);
      setError(err.message || 'Erreur chargement échantillons');
      toast.error(err.message || 'Erreur chargement');
    } finally {
      setLoading(false);
    }
  };

  // Auto-fetch au mount et quand filtres changent
  useEffect(() => {
    fetchSamples();
  }, [JSON.stringify(filters)]);

  // ===================================================================
  // ARCHIVE SAMPLE (retire du PO si draft)
  // ===================================================================

  const archiveSample = async (sampleId: string) => {
    try {
      // Trigger database vérifie automatiquement que PO status = 'draft'
      const { error: updateError } = await supabase
        .from('purchase_order_items')
        // @ts-ignore - archived_at column not yet in generated types
        .update({ archived_at: new Date().toISOString() })
        .eq('id', sampleId);

      if (updateError) {
        // Si trigger bloque (PO déjà envoyée), message explicatif
        if (updateError.message.includes('déjà validée')) {
          toast.error(
            "Impossible d'archiver : commande déjà envoyée au fournisseur"
          );
        } else {
          throw updateError;
        }
        return;
      }

      toast.success('Échantillon archivé avec succès');
      await fetchSamples(); // Refresh liste
    } catch (err: any) {
      console.error('Error archiving sample:', err);
      toast.error(err.message || 'Erreur archivage échantillon');
      throw err;
    }
  };

  // ===================================================================
  // REACTIVATE SAMPLE (archived_at → NULL)
  // ===================================================================

  const reactivateSample = async (sampleId: string) => {
    try {
      const { error: updateError } = await supabase
        .from('purchase_order_items')
        // @ts-ignore - archived_at column not yet in generated types
        .update({ archived_at: null })
        .eq('id', sampleId);

      if (updateError) throw updateError;

      toast.success('Échantillon réactivé avec succès');
      await fetchSamples();
    } catch (err: any) {
      console.error('Error reactivating sample:', err);
      toast.error(err.message || 'Erreur réactivation échantillon');
      throw err;
    }
  };

  // ===================================================================
  // INSERT SAMPLE IN PO (regroupement ou création)
  // ===================================================================

  const insertSampleInPO = async (sampleId: string) => {
    try {
      // 1. Récupérer infos échantillon
      const { data: sampleData, error: sampleError } = await supabase
        .from('purchase_order_items')
        .select(
          `
          product_id,
          quantity,
          unit_price_ht,
          notes,
          sample_type,
          customer_organisation_id,
          customer_individual_id,
          purchase_orders!inner(supplier_id)
        `
        )
        .eq('id', sampleId)
        .single();

      if (sampleError) throw sampleError;

      // @ts-ignore - Nested relation type inference
      const supplierId = (sampleData.purchase_orders as any).supplier_id;

      // 2. Chercher PO draft existant pour ce fournisseur
      const { data: existingPO, error: poError } = await supabase
        .from('purchase_orders')
        .select('id')
        .eq('supplier_id', supplierId)
        .eq('status', 'draft')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (poError) throw poError;

      let targetPOId: string;

      if (existingPO) {
        // PO draft existant trouvé
        targetPOId = existingPO.id;
        toast.success('Ajout à la commande brouillon existante');
      } else {
        // Créer nouveau PO draft
        const { data: newPO, error: createPOError } = await supabase
          .from('purchase_orders')
          // @ts-ignore - created_by handled by database trigger
          .insert({
            supplier_id: supplierId,
            status: 'draft',
            total_ht: 0,
            total_ttc: 0,
          })
          .select('id')
          .single();

        if (createPOError) throw createPOError;

        targetPOId = newPO.id;
        toast.success('Nouvelle commande brouillon créée');
      }

      // 3. Mettre à jour l'échantillon avec le nouveau PO
      // @ts-ignore - archived_at column not yet in generated types
      const { error: updateError } = await supabase
        .from('purchase_order_items')
        .update({
          purchase_order_id: targetPOId,
          archived_at: null, // S'assurer qu'il n'est plus archivé
        })
        .eq('id', sampleId);

      if (updateError) throw updateError;

      // 4. Recalculer totaux PO (trigger handle_purchase_order_forecast s'en charge)

      toast.success('Échantillon inséré dans la commande');
      await fetchSamples();
    } catch (err: any) {
      console.error('Error inserting sample in PO:', err);
      toast.error(err.message || 'Erreur insertion échantillon');
      throw err;
    }
  };

  // ===================================================================
  // DELETE SAMPLE (suppression définitive)
  // ===================================================================

  const deleteSample = async (sampleId: string) => {
    try {
      const { error: deleteError } = await supabase
        .from('purchase_order_items')
        .delete()
        .eq('id', sampleId);

      if (deleteError) throw deleteError;

      toast.success('Échantillon supprimé définitivement');
      await fetchSamples();
    } catch (err: any) {
      console.error('Error deleting sample:', err);
      toast.error(err.message || 'Erreur suppression échantillon');
      throw err;
    }
  };

  // ===================================================================
  // STATS
  // ===================================================================

  const getStats = () => {
    const actives = samples.filter(s => !s.archived_at);
    const archives = samples.filter(s => s.archived_at);
    const internal = samples.filter(s => s.sample_type === 'internal');
    const customer = samples.filter(s => s.sample_type === 'customer');

    return {
      total: samples.length,
      active: actives.length,
      archived: archives.length,
      internal: internal.length,
      customer: customer.length,
      by_status: samples.reduce(
        (acc, s) => {
          acc[s.sample_status] = (acc[s.sample_status] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      ),
    };
  };

  return {
    // Data
    samples,
    loading,
    error,
    stats: getStats(),

    // Actions
    refresh: fetchSamples,
    archiveSample,
    reactivateSample,
    insertSampleInPO,
    deleteSample,
  };
}

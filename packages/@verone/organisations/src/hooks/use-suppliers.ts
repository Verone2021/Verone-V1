'use client';

import { useState, useEffect, useRef } from 'react';

import { createClient } from '@/lib/supabase/client';

/**
 * @deprecated HOOK OBSOLÈTE - Utiliser useOrganisations({ type: 'supplier' }) à la place
 *
 * Ce hook charge depuis l'ancienne table `suppliers` qui est dépréciée.
 * La nouvelle architecture utilise la table `organisations` avec type='supplier'.
 *
 * ⚠️ PROBLÈME: Les IDs de cette table ne correspondent PAS aux foreign keys
 * qui pointent vers `organisations` (ex: variant_groups.supplier_id)
 *
 * Migration recommandée:
 * ```tsx
 * // AVANT
 * const { suppliers } = useSuppliers()
 *
 * // APRÈS
 * const { organisations: suppliers } = useOrganisations({ type: 'supplier', is_active: true })
 * ```
 */
export interface Supplier {
  id: string;
  name: string;
  contact_info?: any;
  payment_terms?: string;
  delivery_time_days?: number;
  is_active?: boolean;
}

/**
 * @deprecated Utiliser useOrganisations({ type: 'supplier' }) à la place
 */
export function useSuppliers() {
  console.warn(
    '⚠️ useSuppliers() est DEPRECATED - Utiliser useOrganisations({ type: "supplier" }) à la place'
  );
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Utiliser useRef pour créer le client UNE SEULE FOIS
  const supabaseRef = useRef(createClient());
  const supabase = supabaseRef.current;

  useEffect(() => {
    const fetchSuppliers = async () => {
      setLoading(true);
      setError(null);

      try {
        const { data, error: fetchError } = await supabase
          .from('suppliers' as any)
          .select(
            'id, name, contact_info, payment_terms, delivery_time_days, is_active'
          )
          .eq('is_active', true)
          .order('name', { ascending: true });

        if (fetchError) {
          setError(fetchError.message);
          console.error('Erreur fetch suppliers:', fetchError);
          return;
        }

        setSuppliers((data || []) as any);
      } catch (err) {
        console.error('Erreur fetch suppliers:', err);
        setError('Impossible de charger les fournisseurs');
      } finally {
        setLoading(false);
      }
    };

    fetchSuppliers();
  }, [supabase]);

  return { suppliers, loading, error };
}

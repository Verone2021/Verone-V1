'use client';

/**
 * Hook centralisé pour gérer les compteurs des onglets organisation
 * Utilisé dans pages détail fournisseur/client/prestataire
 */

import { useState, useEffect } from 'react';

import { usePurchaseOrders } from '@verone/orders/hooks/use-purchase-orders';
import { useProducts } from '@verone/products/hooks/use-products';
import { createClient } from '@verone/utils/supabase/client';

import { useContacts } from './use-contacts';

export interface OrganisationTabCounts {
  contacts: number;
  orders: number;
  products: number;
  invoices: number;
  samples: number; // Échantillons envoyés (clients professionnels)
  loading: boolean;
}

interface UseOrganisationTabCountsProps {
  organisationId: string;
  organisationType: 'supplier' | 'customer' | 'provider';
}

export function useOrganisationTabCounts({
  organisationId,
  organisationType,
}: UseOrganisationTabCountsProps) {
  const [counts, setCounts] = useState<OrganisationTabCounts>({
    contacts: 0,
    orders: 0,
    products: 0,
    invoices: 0,
    samples: 0,
    loading: true,
  });

  // Hooks pour récupérer les données
  const { contacts, fetchOrganisationContacts } = useContacts();
  const { orders, fetchOrders } = usePurchaseOrders();
  const { products, refetch: refetchProducts } = useProducts();

  // Charger et compter les contacts
  // Note: On utilise un ref pour éviter les re-fetch en cascade
  useEffect(() => {
    if (organisationId) {
      fetchOrganisationContacts(organisationId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [organisationId]);

  // Mettre à jour le count quand contacts change
  useEffect(() => {
    if (organisationId && contacts.length > 0) {
      const orgContacts = contacts.filter(
        c => c.organisation_id === organisationId
      );
      setCounts(prev => ({ ...prev, contacts: orgContacts.length }));
    }
  }, [organisationId, contacts]);

  // Charger les commandes (si fournisseur)
  useEffect(() => {
    if (organisationId && organisationType === 'supplier') {
      fetchOrders({ supplier_id: organisationId });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [organisationId, organisationType]);

  // Mettre à jour le count quand orders change
  useEffect(() => {
    if (
      organisationId &&
      organisationType === 'supplier' &&
      orders.length > 0
    ) {
      const orgOrders = orders.filter(o => o.supplier_id === organisationId);
      setCounts(prev => ({
        ...prev,
        orders: orgOrders.length,
        loading: false,
      }));
    }
  }, [organisationId, organisationType, orders]);

  // Charger les produits (si fournisseur)
  useEffect(() => {
    if (organisationId && organisationType === 'supplier') {
      refetchProducts();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [organisationId, organisationType]);

  // Mettre à jour le count quand products change
  useEffect(() => {
    if (
      organisationId &&
      organisationType === 'supplier' &&
      products.length > 0
    ) {
      const orgProducts = products.filter(
        p => p.supplier_id === organisationId
      );
      setCounts(prev => ({ ...prev, products: orgProducts.length }));
    }
  }, [organisationId, organisationType, products]);

  // Charger et compter les échantillons (si client)
  useEffect(() => {
    if (organisationId && organisationType === 'customer') {
      const fetchSamplesCount = async () => {
        try {
          const supabase = createClient();
          // Jointure avec sales_orders pour filtrer par customer_id
          const { count, error } = await supabase
            .from('sales_order_items')
            .select('id, sales_order:sales_orders!inner(customer_id)', {
              count: 'exact',
              head: true,
            })
            .eq('is_sample', true)
            .eq('sales_order.customer_id', organisationId);

          if (!error && count !== null) {
            setCounts(prev => ({ ...prev, samples: count }));
          }
        } catch (err) {
          console.error('Erreur comptage échantillons:', err);
        }
      };
      fetchSamplesCount();
    }
  }, [organisationId, organisationType]);

  // Rafraîchir tous les compteurs
  const refreshCounts = async () => {
    setCounts(prev => ({ ...prev, loading: true }));

    if (organisationId) {
      // Contacts
      await fetchOrganisationContacts(organisationId);

      // Commandes (fournisseurs)
      if (organisationType === 'supplier') {
        await fetchOrders({ supplier_id: organisationId });
      }

      // Produits (fournisseurs)
      if (organisationType === 'supplier') {
        await refetchProducts();
      }

      setCounts(prev => ({ ...prev, loading: false }));
    }
  };

  return {
    counts,
    refreshCounts,
  };
}

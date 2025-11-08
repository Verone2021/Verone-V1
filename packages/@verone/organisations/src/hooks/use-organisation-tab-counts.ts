/**
 * Hook centralisé pour gérer les compteurs des onglets organisation
 * Utilisé dans pages détail fournisseur/client/prestataire
 */

import { useState, useEffect } from 'react';

import { usePurchaseOrders } from '@verone/orders/hooks/use-purchase-orders';
import { useProducts } from '@verone/products/hooks/use-products';

import { useContacts } from './use-contacts';

export interface OrganisationTabCounts {
  contacts: number;
  orders: number;
  products: number;
  invoices: number;
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
    loading: true,
  });

  // Hooks pour récupérer les données
  const { contacts, fetchOrganisationContacts } = useContacts();
  const { orders, fetchOrders } = usePurchaseOrders();
  const { products, refetch: refetchProducts } = useProducts();

  // Charger et compter les contacts
  useEffect(() => {
    if (organisationId) {
      fetchOrganisationContacts(organisationId).then(() => {
        const orgContacts = contacts.filter(
          c => c.organisation_id === organisationId
        );
        setCounts(prev => ({ ...prev, contacts: orgContacts.length }));
      });
    }
  }, [organisationId, contacts.length]);

  // Charger et compter les commandes (si fournisseur)
  useEffect(() => {
    if (organisationId && organisationType === 'supplier') {
      fetchOrders({ supplier_id: organisationId }).then(() => {
        const orgOrders = orders.filter(o => o.supplier_id === organisationId);
        setCounts(prev => ({
          ...prev,
          orders: orgOrders.length,
          loading: false,
        }));
      });
    }
  }, [organisationId, organisationType, orders.length]);

  // Charger et compter les produits (si fournisseur)
  useEffect(() => {
    if (organisationId && organisationType === 'supplier') {
      refetchProducts().then(() => {
        const orgProducts = products.filter(
          p => p.supplier_id === organisationId
        );
        setCounts(prev => ({ ...prev, products: orgProducts.length }));
      });
    }
  }, [organisationId, organisationType, products.length]);

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

/**
 * Page Commandes Clients — Server Component
 *
 * Charge la liste initiale côté serveur (HTML pré-rendu, 0 aller-retour
 * réseau au premier affichage). Les interactions (modals, filtres, actions)
 * restent dans SalesOrdersClientsPage (Client Component).
 *
 * Workflow commandes:
 * - draft → validated → partially_shipped → shipped → delivered
 * - Annulation possible (draft uniquement, ou devalider d'abord)
 * - Les triggers stock sont automatiques (agnostiques du canal)
 *
 * Création commande LinkMe:
 * - Redirige vers /canaux-vente/linkme/commandes?action=new
 * - Single Source of Truth: un seul formulaire LinkMe (canaux-vente)
 *
 * [BO-PERF-ORDERS-001] Migré en Server Component pour pré-rendu SSR.
 */

import type { SalesOrder } from '@verone/orders';
import { createServerClient } from '@verone/utils/supabase/server';

import { SalesOrdersClientsPage } from './SalesOrdersClientsPage';

export default async function SalesOrdersPage() {
  const supabase = await createServerClient();

  // Fetch initial côté serveur — colonnes de base (sans items, sans stock).
  // SalesOrdersTable rechargera avec tous les enrichissements côté client
  // si nécessaire, mais l'affichage initial est immédiat.
  const { data: ordersData } = await supabase
    .from('sales_orders')
    .select(
      `
      id, order_number, linkme_display_number, created_at, status,
      total_ht, total_ttc, customer_id, customer_type,
      expected_delivery_date, created_by_affiliate_id,
      linkme_selection_id, pending_admin_validation,
      payment_status_v2, channel_id,
      individual_customer_id, eco_tax_total, order_date, created_by,
      responsable_contact_id, billing_contact_id, delivery_contact_id,
      shipping_cost_ht, handling_cost_ht, insurance_cost_ht, fees_vat_rate,
      quote_qonto_id, quote_number,
      updated_at,
      sales_channel:sales_channels!left(id, name, code),
      billing_contact:contacts!sales_orders_billing_contact_id_fkey(id, first_name, last_name, email, phone),
      delivery_contact:contacts!sales_orders_delivery_contact_id_fkey(id, first_name, last_name, email, phone),
      responsable_contact:contacts!sales_orders_responsable_contact_id_fkey(id, first_name, last_name, email, phone)
    `
    )
    .order('created_at', { ascending: false })
    .limit(500);

  // Cast via unknown : la requête SSR ne charge pas les enrichissements
  // (creator, invoice, shipment, etc.) — SalesOrdersTable les chargera
  // côté client au montage via fetchOrders(). L'affichage initial utilise
  // les données de base pour un rendu immédiat.
  const preloadedOrders = (ordersData ?? []) as unknown as SalesOrder[];

  return <SalesOrdersClientsPage preloadedOrders={preloadedOrders} />;
}

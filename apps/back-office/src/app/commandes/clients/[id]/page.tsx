/**
 * Page Détail Commande Client - VERSION COMPLÈTE
 * Route: /commandes/clients/[id]
 *
 * Features:
 * - Infos client (organisation OU individual) avec copy buttons
 * - Adresse livraison avec copy button
 * - Items commande avec progress expédition
 * - Section expéditions (composant dédié)
 */

import Link from 'next/link';
import { notFound } from 'next/navigation';

import { ShipmentsSection } from '@verone/orders';
import { Badge } from '@verone/ui';
import { Card } from '@verone/ui';
import { createClient } from '@verone/utils/supabase/server';
import {
  ArrowLeft,
  Package,
  MapPin,
  User,
  Mail,
  Phone,
  Building2,
} from 'lucide-react';

import { CopyButton } from './CopyButton';

interface OrderDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function OrderDetailPage({
  params,
}: OrderDetailPageProps) {
  const { id } = await params;
  const supabase = await createClient();

  // 1. Récupérer commande de base
  const { data: order, error } = await supabase
    .from('sales_orders')
    .select(
      `
      id,
      order_number,
      status,
      customer_id,
      customer_type,
      shipping_address,
      total_ht,
      total_ttc,
      created_at,
      sales_order_items (
        id,
        product_id,
        quantity,
        quantity_shipped,
        unit_price_ht,
        products (
          id,
          name,
          sku
        )
      )
    `
    )
    .eq('id', id)
    .single();

  if (error || !order) {
    console.error('[Order Detail] Error:', error);
    notFound();
  }

  // 2. Récupérer customer selon type
  let customerName = 'Client inconnu';
  let customerEmail = '';
  let customerPhone = '';
  let isOrganisation = false;

  if (order.customer_type === 'organization' && order.customer_id) {
    const { data: org } = await supabase
      .from('organisations')
      .select('id, legal_name, trade_name, email, phone')
      .eq('id', order.customer_id)
      .single();

    if (org) {
      customerName = org.trade_name || org.legal_name;
      customerEmail = org.email || '';
      customerPhone = org.phone || '';
      isOrganisation = true;
    }
  } else if (order.customer_type === 'individual' && order.customer_id) {
    const { data: individual } = await supabase
      .from('individual_customers')
      .select('id, first_name, last_name, email, phone')
      .eq('id', order.customer_id)
      .single();

    if (individual) {
      customerName = `${individual.first_name} ${individual.last_name}`;
      customerEmail = individual.email || '';
      customerPhone = individual.phone || '';
    }
  }

  // 3. Parser adresse
  const shippingAddr = order.shipping_address as any;
  const addressText =
    typeof shippingAddr === 'string'
      ? shippingAddr
      : shippingAddr?.address || 'Adresse non renseignée';

  const items = order.sales_order_items as any[];

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Link
            href="/commandes/clients"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour aux commandes
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-monarch font-semibold tracking-tight">
                Commande {order.order_number}
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                ID: {order.id}
              </p>
            </div>
            <Badge
              variant={order.status === 'delivered' ? 'default' : 'secondary'}
            >
              {order.status}
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Colonne gauche */}
          <div className="lg:col-span-2 space-y-6">
            {/* Client Info */}
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-4">
                {isOrganisation ? (
                  <Building2 className="h-5 w-5 text-muted-foreground" />
                ) : (
                  <User className="h-5 w-5 text-muted-foreground" />
                )}
                <h2 className="text-xl font-semibold">Informations client</h2>
              </div>

              <div className="space-y-4">
                {/* Nom */}
                <div>
                  <p className="text-sm text-muted-foreground">
                    Nom {isOrganisation ? '(Raison sociale)' : ''}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="font-medium">{customerName}</p>
                    <CopyButton text={customerName} label="Copier" />
                  </div>
                </div>

                {/* Email */}
                {customerEmail && (
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <p className="font-medium">{customerEmail}</p>
                      <CopyButton text={customerEmail} label="Copier" />
                    </div>
                  </div>
                )}

                {/* Téléphone */}
                {customerPhone && (
                  <div>
                    <p className="text-sm text-muted-foreground">Téléphone</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <p className="font-medium">{customerPhone}</p>
                      <CopyButton text={customerPhone} label="Copier" />
                    </div>
                  </div>
                )}
              </div>
            </Card>

            {/* Adresse livraison */}
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <MapPin className="h-5 w-5 text-muted-foreground" />
                <h2 className="text-xl font-semibold">Adresse de livraison</h2>
              </div>
              <p className="text-sm mb-2">{addressText}</p>
              <CopyButton
                text={addressText}
                label="Copier l'adresse complète"
              />
            </Card>

            {/* Articles */}
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Package className="h-5 w-5 text-muted-foreground" />
                <h2 className="text-xl font-semibold">
                  Articles ({items.length})
                </h2>
              </div>

              <div className="space-y-3">
                {items.map((item: any) => {
                  const percentShipped =
                    item.quantity > 0
                      ? Math.round(
                          (item.quantity_shipped / item.quantity) * 100
                        )
                      : 0;

                  return (
                    <div key={item.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-medium">
                            {item.products?.name || 'Produit inconnu'}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            SKU: {item.products?.sku || 'N/A'}
                          </p>
                        </div>
                        <p className="text-sm font-medium">
                          {item.quantity_shipped} / {item.quantity} expédiés
                        </p>
                      </div>

                      {/* Progress bar */}
                      <div className="w-full bg-muted rounded-full h-2 mt-2">
                        <div
                          className="bg-primary h-2 rounded-full transition-all"
                          style={{ width: `${percentShipped}%` }}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {percentShipped}% expédié
                      </p>
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>

          {/* Colonne droite */}
          <div className="space-y-6">
            {/* Totaux */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Totaux</h2>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">
                    Total HT
                  </span>
                  <span className="font-medium">
                    {order.total_ht?.toFixed(2)} €
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">
                    Total TTC
                  </span>
                  <span className="font-medium text-lg">
                    {order.total_ttc?.toFixed(2)} €
                  </span>
                </div>
              </div>
            </Card>

            {/* Informations complémentaires */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Informations</h2>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Statut:</span>
                  <span className="ml-2 font-medium">{order.status}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Type client:</span>
                  <span className="ml-2 font-medium">
                    {order.customer_type}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Date création:</span>
                  <span className="ml-2 font-medium">
                    {new Date(order.created_at).toLocaleDateString('fr-FR')}
                  </span>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Section Expéditions */}
        <div className="mt-6">
          <ShipmentsSection
            orderId={id}
            orderNumber={order.order_number}
            orderStatus={order.status}
            orderItems={items.map((item: any) => ({
              id: item.id,
              product_id: item.product_id,
              product_name: item.products?.name || 'Produit inconnu',
              quantity: item.quantity,
              quantity_shipped: item.quantity_shipped || 0,
            }))}
          />
        </div>
      </div>
    </div>
  );
}

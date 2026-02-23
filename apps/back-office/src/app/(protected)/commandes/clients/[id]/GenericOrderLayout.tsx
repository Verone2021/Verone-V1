/**
 * GenericOrderLayout - Layout pleine page pour commandes non-LinkMe
 *
 * Two-column grid layout:
 * - Products full width on top
 * - Client + Addresses | Payment + Fees + Invoices below
 */

import Link from 'next/link';

import { Badge, Card } from '@verone/ui';
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
import { FeesSection } from './FeesSection';
import { InvoicesSection } from './InvoicesSection';
import { PaymentSection } from './PaymentSection';

// Types
interface OrderItem {
  id: string;
  product_id: string | null;
  quantity: number;
  quantity_shipped: number | null;
  unit_price_ht: number | null;
  products?: {
    id: string;
    name: string;
    sku: string;
  } | null;
}

export interface GenericOrderData {
  id: string;
  order_number: string;
  status: string;
  payment_status: string | null;
  customer_type: string | null;
  billing_address: unknown;
  shipping_address: unknown;
  total_ht: number | null;
  total_ttc: number | null;
  shipping_cost_ht: number | null;
  handling_cost_ht: number | null;
  insurance_cost_ht: number | null;
  fees_vat_rate: number | null;
  created_at: string | null;
  channel_id: string | null;
  items: OrderItem[];
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  isOrganisation: boolean;
  creatorName: string;
  creatorEmail: string;
  channelName: string | null;
}

const STATUS_LABELS: Record<string, string> = {
  draft: 'Brouillon',
  validated: 'Validée',
  shipped: 'Expédiée',
  delivered: 'Livrée',
  cancelled: 'Annulée',
};

export function GenericOrderLayout({ order }: { order: GenericOrderData }) {
  const shippingAddr = order.shipping_address as
    | string
    | { address?: string }
    | null
    | undefined;
  const addressText =
    typeof shippingAddr === 'string'
      ? shippingAddr
      : ((shippingAddr as { address?: string } | undefined)?.address ??
        'Adresse non renseignée');

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="mb-2">
        <Link
          href="/commandes/clients"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour aux commandes
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Commande {order.order_number}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge
                variant={order.status === 'delivered' ? 'default' : 'secondary'}
              >
                {STATUS_LABELS[order.status] ?? order.status}
              </Badge>
              {order.channelName && (
                <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-blue-100 text-blue-700">
                  {order.channelName}
                </span>
              )}
              {order.created_at && (
                <span className="text-gray-500 text-sm">
                  {new Date(order.created_at).toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Products - Full Width */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Package className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-xl font-semibold">
            Articles ({order.items.length})
          </h2>
        </div>

        <div className="space-y-3">
          {order.items.map(item => {
            const percentShipped =
              item.quantity > 0
                ? Math.round(
                    ((item.quantity_shipped ?? 0) / item.quantity) * 100
                  )
                : 0;

            return (
              <div key={item.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="font-medium">
                      {item.products?.name ?? 'Produit inconnu'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      SKU: {item.products?.sku ?? 'N/A'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">
                      {(item.unit_price_ht ?? 0).toFixed(2)} € HT ×{' '}
                      {item.quantity}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {item.quantity_shipped ?? 0} / {item.quantity} expédiés
                    </p>
                  </div>
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

        {/* Totals */}
        <div className="flex justify-end mt-4 pt-4 border-t">
          <div className="w-full lg:w-48 space-y-2">
            <div className="flex justify-between text-sm">
              <span>Total HT</span>
              <span className="font-medium">
                {order.total_ht?.toFixed(2)} €
              </span>
            </div>
            <div className="flex justify-between text-sm font-bold">
              <span>Total TTC</span>
              <span>{order.total_ttc?.toFixed(2)} €</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Two-column grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left column: Client + Addresses */}
        <div className="space-y-6">
          {/* Client Info */}
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              {order.isOrganisation ? (
                <Building2 className="h-5 w-5 text-muted-foreground" />
              ) : (
                <User className="h-5 w-5 text-muted-foreground" />
              )}
              <h2 className="text-lg font-semibold">Client</h2>
              <Badge variant="outline" className="ml-auto">
                {order.isOrganisation ? 'Pro' : 'Particulier'}
              </Badge>
            </div>

            <div className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">
                  Nom {order.isOrganisation ? '(Raison sociale)' : ''}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <p className="font-medium">{order.customerName}</p>
                  <CopyButton text={order.customerName} label="Copier" />
                </div>
              </div>

              {order.customerEmail && (
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <p>{order.customerEmail}</p>
                  <CopyButton text={order.customerEmail} label="Copier" />
                </div>
              )}

              {order.customerPhone && (
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <p>{order.customerPhone}</p>
                  <CopyButton text={order.customerPhone} label="Copier" />
                </div>
              )}

              {order.creatorName && (
                <div className="pt-2 border-t text-sm">
                  <span className="text-muted-foreground">Créé par : </span>
                  <span className="font-medium">{order.creatorName}</span>
                  {order.creatorEmail && (
                    <span className="text-muted-foreground">
                      {' '}
                      ({order.creatorEmail})
                    </span>
                  )}
                </div>
              )}
            </div>
          </Card>

          {/* Addresses */}
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <MapPin className="h-5 w-5 text-muted-foreground" />
              <h2 className="text-lg font-semibold">Adresse de livraison</h2>
            </div>
            <p className="text-sm mb-2">{addressText}</p>
            <CopyButton text={addressText} label="Copier l'adresse complète" />
          </Card>

          {/* Informations */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">Informations</h2>
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-muted-foreground">Statut :</span>
                <span className="ml-2 font-medium">
                  {STATUS_LABELS[order.status] ?? order.status}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Type client :</span>
                <span className="ml-2 font-medium">
                  {order.isOrganisation ? 'Organisation' : 'Particulier'}
                </span>
              </div>
              {order.created_at && (
                <div>
                  <span className="text-muted-foreground">Date création :</span>
                  <span className="ml-2 font-medium">
                    {new Date(order.created_at).toLocaleDateString('fr-FR')}
                  </span>
                </div>
              )}
              {order.channelName && (
                <div>
                  <span className="text-muted-foreground">Source :</span>
                  <span className="ml-2 font-medium">{order.channelName}</span>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Right column: Payment + Fees + Invoices */}
        <div className="space-y-6">
          {/* Fees */}
          <FeesSection
            orderId={order.id}
            shippingCostHt={order.shipping_cost_ht ?? 0}
            handlingCostHt={order.handling_cost_ht ?? 0}
            insuranceCostHt={order.insurance_cost_ht ?? 0}
            feesVatRate={order.fees_vat_rate ?? 0.2}
          />

          {/* Payment */}
          <PaymentSection
            orderId={order.id}
            orderNumber={order.order_number}
            orderStatus={order.status}
            totalHt={order.total_ht ?? 0}
            totalTtc={order.total_ttc ?? 0}
            taxRate={20}
            currency="EUR"
            paymentTerms="immediate"
            paymentStatus={order.payment_status ?? 'pending'}
            customerName={order.customerName}
            customerEmail={order.customerEmail || null}
            customerType={
              order.customer_type === 'organization'
                ? 'organization'
                : 'individual'
            }
            shippingCostHt={order.shipping_cost_ht ?? 0}
            handlingCostHt={order.handling_cost_ht ?? 0}
            insuranceCostHt={order.insurance_cost_ht ?? 0}
            feesVatRate={order.fees_vat_rate ?? 0.2}
            billingAddress={
              order.billing_address as Record<string, string> | null
            }
            shippingAddress={
              order.shipping_address as Record<string, string> | null
            }
            orderItems={order.items.map(item => ({
              id: item.id,
              quantity: item.quantity,
              unit_price_ht: item.unit_price_ht ?? 0,
              tax_rate: 20,
              products: item.products ? { name: item.products.name } : null,
            }))}
          />

          {/* Invoices */}
          <InvoicesSection orderId={order.id} />
        </div>
      </div>
    </div>
  );
}

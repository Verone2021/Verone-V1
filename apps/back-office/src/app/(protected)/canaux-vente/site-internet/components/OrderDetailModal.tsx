'use client';

import { useState, useEffect } from 'react';

import { createClient } from '@verone/utils/supabase/client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@verone/ui';
import { Badge } from '@verone/ui';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@verone/ui';
import {
  Package,
  User,
  Mail,
  Phone,
  MapPin,
  CreditCard,
  Truck,
  FileText,
  Tag,
  Receipt,
} from 'lucide-react';

import { OrderStatusActions } from './OrderStatusActions';

// ── Types ──────────────────────────────────────────────────────

interface OrderItem {
  product_id: string;
  name: string;
  price_ttc: number;
  quantity: number;
  include_assembly: boolean;
  assembly_price: number;
  eco_participation: number;
}

interface SiteOrder {
  id: string;
  order_number: string | null;
  customer_email: string;
  customer_name: string;
  customer_phone: string | null;
  shipping_address: string | null;
  billing_address: string | null;
  status: string;
  total: number;
  subtotal: number;
  shipping_cost: number;
  total_ht: number | null;
  tax_amount: number | null;
  tax_rate: number | null;
  currency: string;
  items: unknown;
  stripe_session_id: string | null;
  discount_code: string | null;
  discount_amount: number;
  invoice_number: string | null;
  invoice_date: string | null;
  shipping_method: string | null;
  payment_method: string | null;
  created_at: string | null;
  updated_at: string | null;
}

interface OrderDetailModalProps {
  order: SiteOrder | null;
  open: boolean;
  onClose: () => void;
  onStatusChange: (order: SiteOrder, newStatus: string) => void;
  isUpdating: boolean;
}

// ── Helpers ────────────────────────────────────────────────────

function parseItems(items: unknown): OrderItem[] {
  if (Array.isArray(items)) {
    return items as OrderItem[];
  }
  return [];
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  }).format(amount);
}

function getItemTotal(item: OrderItem): number {
  return (
    (item.price_ttc +
      item.eco_participation +
      (item.include_assembly ? item.assembly_price : 0)) *
    item.quantity
  );
}

// ── Component ──────────────────────────────────────────────────

export function OrderDetailModal({
  order,
  open,
  onClose,
  onStatusChange,
  isUpdating,
}: OrderDetailModalProps) {
  const [shipments, setShipments] = useState<
    Array<{
      carrier_name: string | null;
      tracking_number: string | null;
      tracking_url: string | null;
      packlink_status: string | null;
      shipping_cost: number | null;
      label_url: string | null;
      shipped_at: string | null;
      delivery_method: string | null;
    }>
  >([]);

  useEffect(() => {
    if (!open || !order?.id) {
      setShipments([]);
      return;
    }
    const supabase = createClient();
    void supabase
      .from('sales_order_shipments')
      .select(
        'carrier_name, tracking_number, tracking_url, packlink_status, shipping_cost, label_url, shipped_at, delivery_method'
      )
      .eq('sales_order_id', order.id)
      .order('shipped_at', { ascending: false })
      .then(({ data }) => {
        const rows = (data ?? []) as unknown as typeof shipments;
        setShipments(rows);
      });
  }, [open, order?.id]);

  if (!order) return null;

  const items = parseItems(order.items);
  const hasBillingDifferent =
    order.billing_address && order.billing_address !== order.shipping_address;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <Package className="h-5 w-5" />
            {order.order_number
              ? `Commande ${order.order_number}`
              : `Commande du ${formatDate(order.created_at)}`}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Status + Invoice */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground">Statut :</span>
              <OrderStatusActions
                status={order.status}
                onStatusChange={newStatus => onStatusChange(order, newStatus)}
                isUpdating={isUpdating}
              />
            </div>
            <div className="text-right">
              {order.invoice_number && (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <FileText className="h-3.5 w-3.5" />
                  <span className="font-mono">{order.invoice_number}</span>
                </div>
              )}
              <span className="text-xs text-muted-foreground font-mono">
                {order.order_number ?? order.id.slice(0, 8)}
              </span>
            </div>
          </div>

          {/* Customer Info */}
          <div className="rounded-lg border p-4 space-y-3">
            <h3 className="font-semibold text-sm">Informations client</h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span>{order.customer_name}</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span>{order.customer_email}</span>
              </div>
              {order.customer_phone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{order.customer_phone}</span>
                </div>
              )}
              {order.payment_method && (
                <div className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                  <span className="capitalize">{order.payment_method}</span>
                </div>
              )}
            </div>
          </div>

          {/* Addresses */}
          <div className="rounded-lg border p-4 space-y-3">
            <h3 className="font-semibold text-sm">Adresses</h3>
            <div
              className={`grid ${hasBillingDifferent ? 'grid-cols-2' : 'grid-cols-1'} gap-4 text-sm`}
            >
              {order.shipping_address && (
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground mb-1">
                    <Truck className="h-3.5 w-3.5" />
                    Livraison
                    {order.shipping_method && (
                      <span className="ml-1">({order.shipping_method})</span>
                    )}
                  </div>
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                    <span>{order.shipping_address}</span>
                  </div>
                </div>
              )}
              {hasBillingDifferent && (
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground mb-1">
                    <Receipt className="h-3.5 w-3.5" />
                    Facturation
                  </div>
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                    <span>{order.billing_address}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Discount */}
          {order.discount_code && (
            <div className="rounded-lg border p-4">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <Tag className="h-4 w-4 text-green-600" />
                  <span>
                    Code promo :{' '}
                    <span className="font-mono font-medium">
                      {order.discount_code}
                    </span>
                  </span>
                </div>
                <span className="text-green-600 font-medium">
                  -{formatCurrency(order.discount_amount)}
                </span>
              </div>
            </div>
          )}

          {/* Items */}
          {items.length > 0 ? (
            <div className="rounded-lg border">
              <div className="p-4 border-b">
                <h3 className="font-semibold text-sm">
                  Articles ({items.length})
                </h3>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Produit</TableHead>
                    <TableHead className="text-right">Prix unit.</TableHead>
                    <TableHead className="text-center">Qte</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <div>
                          <span className="font-medium">{item.name}</span>
                          {item.include_assembly && (
                            <Badge variant="outline" className="ml-2 text-xs">
                              Montage
                            </Badge>
                          )}
                          {item.eco_participation > 0 && (
                            <span className="block text-xs text-muted-foreground">
                              Eco-part. :{' '}
                              {formatCurrency(item.eco_participation)}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(item.price_ttc)}
                      </TableCell>
                      <TableCell className="text-center">
                        {item.quantity}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(getItemTotal(item))}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="rounded-lg border p-4 text-center text-sm text-muted-foreground">
              Details des articles non disponibles
            </div>
          )}

          {/* Totals with TVA breakdown */}
          <div className="rounded-lg border p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-muted-foreground" />
                Sous-total TTC
              </span>
              <span>{formatCurrency(order.subtotal)}</span>
            </div>
            {order.discount_amount > 0 && (
              <div className="flex justify-between text-sm text-green-600">
                <span>Reduction</span>
                <span>-{formatCurrency(order.discount_amount)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="flex items-center gap-2">
                <Truck className="h-4 w-4 text-muted-foreground" />
                Livraison
              </span>
              <span>
                {order.shipping_cost > 0
                  ? formatCurrency(order.shipping_cost)
                  : 'Offerte'}
              </span>
            </div>
            <div className="flex justify-between font-semibold text-base border-t pt-2">
              <span>Total TTC</span>
              <span>{formatCurrency(order.total)}</span>
            </div>
            {order.total_ht != null && order.tax_amount != null && (
              <div className="border-t pt-2 space-y-1">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Total HT</span>
                  <span>{formatCurrency(order.total_ht)}</span>
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>TVA ({order.tax_rate ?? 20}%)</span>
                  <span>{formatCurrency(order.tax_amount)}</span>
                </div>
              </div>
            )}
          </div>
          {/* Section Expédition & Suivi */}
          {shipments.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-medium flex items-center gap-2">
                <Truck className="h-4 w-4" />
                Expédition ({shipments.length})
              </h3>
              {shipments.map((s, idx) => (
                <div
                  key={idx}
                  className="border rounded-lg p-3 bg-gray-50 text-sm space-y-1"
                >
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium">
                      {s.carrier_name ?? 'Transporteur non défini'}
                    </span>
                    {s.packlink_status && (
                      <Badge
                        className={`text-[10px] ${
                          s.packlink_status === 'a_payer'
                            ? 'bg-red-100 text-red-800'
                            : s.packlink_status === 'paye'
                              ? 'bg-green-100 text-green-800'
                              : s.packlink_status === 'in_transit'
                                ? 'bg-blue-100 text-blue-800'
                                : s.packlink_status === 'delivered'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {s.packlink_status === 'a_payer'
                          ? 'Transport à payer'
                          : s.packlink_status === 'paye'
                            ? 'Transport payé'
                            : s.packlink_status === 'in_transit'
                              ? 'En transit'
                              : s.packlink_status === 'delivered'
                                ? 'Livré'
                                : 'Incident'}
                      </Badge>
                    )}
                    {s.delivery_method && !s.packlink_status && (
                      <Badge variant="outline" className="text-[10px]">
                        {s.delivery_method === 'manual'
                          ? 'Manuel'
                          : s.delivery_method === 'pickup'
                            ? 'Retrait'
                            : s.delivery_method === 'hand_delivery'
                              ? 'Main propre'
                              : s.delivery_method}
                      </Badge>
                    )}
                    {s.shipped_at && (
                      <span className="text-xs text-muted-foreground">
                        {formatDate(s.shipped_at)}
                      </span>
                    )}
                  </div>
                  {s.tracking_number && (
                    <p className="text-xs text-muted-foreground">
                      Suivi :{' '}
                      {s.tracking_url ? (
                        <a
                          href={s.tracking_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          {s.tracking_number}
                        </a>
                      ) : (
                        s.tracking_number
                      )}
                    </p>
                  )}
                  {s.shipping_cost != null && s.shipping_cost > 0 && (
                    <p className="text-xs text-muted-foreground">
                      Coût : {formatCurrency(s.shipping_cost)}
                    </p>
                  )}
                  {s.label_url && (
                    <p className="text-xs">
                      <a
                        href={s.label_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        Télécharger étiquette
                      </a>
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

'use client';

import React from 'react';

import { ProductThumbnail } from '@verone/products';
import { Badge } from '@verone/ui';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@verone/ui';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@verone/ui';
import { formatPrice } from '@verone/utils';
import {
  ShoppingCart,
  Store,
  Building2,
  User,
  X,
  CalendarDays,
  Package,
} from 'lucide-react';

// ============================================
// TYPES
// ============================================

interface OrderItem {
  id: string;
  product_id: string;
  product_name: string;
  product_image_url: string | null;
  quantity: number;
  unit_price_ht: number;
  total_ht: number;
  selling_price_ht: number | null;
  affiliate_margin: number;
}

interface LinkMeOrderWithDetails {
  id: string;
  order_number: string;
  status: string;
  payment_status: string | null;
  total_ht: number;
  total_ttc: number;
  tax_rate?: number;
  customer_type: 'organization' | 'individual';
  customer_id: string;
  created_at: string;
  // Client
  customer_name: string;
  customer_email?: string | null;
  customer_phone?: string | null;
  customer_address?: string | null;
  customer_city: string | null;
  customer_postal_code?: string | null;
  // Affilié
  affiliate_name: string | null;
  affiliate_type?: 'enseigne' | 'organisation' | null;
  // Sélection
  selection_name: string | null;
  // Marge
  total_affiliate_margin: number;
  // Items
  items: OrderItem[];
}

interface LinkMeOrderDetailModalProps {
  order: LinkMeOrderWithDetails | null;
  open: boolean;
  onClose: () => void;
}

// ============================================
// STATUS LABELS
// ============================================

const STATUS_LABELS: Record<
  string,
  {
    label: string;
    variant:
      | 'default'
      | 'secondary'
      | 'success'
      | 'warning'
      | 'destructive'
      | 'outline';
  }
> = {
  draft: { label: 'Brouillon', variant: 'secondary' },
  validated: { label: 'Validée', variant: 'default' },
  partially_shipped: { label: 'Expédition partielle', variant: 'warning' },
  shipped: { label: 'Expédiée', variant: 'success' },
  delivered: { label: 'Livrée', variant: 'success' },
  cancelled: { label: 'Annulée', variant: 'destructive' },
};

const PAYMENT_STATUS_LABELS: Record<
  string,
  {
    label: string;
    variant: 'default' | 'secondary' | 'success' | 'warning' | 'destructive';
  }
> = {
  pending: { label: 'En attente', variant: 'secondary' },
  partial: { label: 'Partiel', variant: 'warning' },
  paid: { label: 'Payé', variant: 'success' },
  refunded: { label: 'Remboursé', variant: 'destructive' },
  overdue: { label: 'En retard', variant: 'destructive' },
};

// ============================================
// COMPONENT
// ============================================

export function LinkMeOrderDetailModal({
  order,
  open,
  onClose,
}: LinkMeOrderDetailModalProps) {
  if (!order) return null;

  const statusInfo = STATUS_LABELS[order.status] ?? {
    label: order.status,
    variant: 'secondary' as const,
  };

  const paymentInfo = order.payment_status
    ? PAYMENT_STATUS_LABELS[order.payment_status] ?? {
        label: order.payment_status,
        variant: 'secondary' as const,
      }
    : null;

  // Calculer TVA (défaut 20% si non spécifié)
  const taxRate = order.tax_rate ?? 0.2;
  const taxAmount = order.total_ttc - order.total_ht;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        {/* HEADER */}
        <DialogHeader className="pb-4 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100">
                <ShoppingCart className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <DialogTitle className="flex items-center gap-3">
                  <span className="font-mono text-lg">
                    {order.order_number}
                  </span>
                  <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
                  {paymentInfo && (
                    <Badge variant={paymentInfo.variant}>
                      {paymentInfo.label}
                    </Badge>
                  )}
                </DialogTitle>
                <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
                  <CalendarDays className="h-3 w-3" />
                  {new Date(order.created_at).toLocaleDateString('fr-FR', {
                    weekday: 'long',
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric',
                  })}
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>
        </DialogHeader>

        {/* SECTION 1: TABLEAU PRODUITS PLEINE LARGEUR */}
        <div className="mt-6 rounded-xl border border-slate-200 overflow-hidden">
          <div className="bg-slate-50 px-4 py-3 border-b">
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-slate-500" />
              <span className="text-sm font-semibold text-slate-700">
                {order.items.length} Produit{order.items.length > 1 ? 's' : ''}
              </span>
            </div>
          </div>
          <Table>
            <TableHeader>
              <TableRow className="bg-white">
                <TableHead className="w-16">Photo</TableHead>
                <TableHead>Produit</TableHead>
                <TableHead className="text-center w-20">Qté</TableHead>
                <TableHead className="text-right w-32">Prix unit. HT</TableHead>
                <TableHead className="text-right w-32">Total HT</TableHead>
                <TableHead className="text-right w-32 text-orange-600">
                  Marge affilié
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {order.items.map(item => (
                <TableRow key={item.id} className="hover:bg-slate-50">
                  <TableCell className="p-2">
                    <ProductThumbnail
                      src={item.product_image_url}
                      alt={item.product_name}
                      size="sm"
                    />
                  </TableCell>
                  <TableCell>
                    <span className="font-medium text-slate-900">
                      {item.product_name}
                    </span>
                  </TableCell>
                  <TableCell className="text-center text-slate-700">
                    {item.quantity}
                  </TableCell>
                  <TableCell className="text-right text-slate-700">
                    {formatPrice(item.selling_price_ht ?? item.unit_price_ht)}
                  </TableCell>
                  <TableCell className="text-right font-medium text-slate-900">
                    {formatPrice(item.total_ht)}
                  </TableCell>
                  <TableCell className="text-right">
                    {item.affiliate_margin > 0 ? (
                      <span className="font-semibold text-orange-600">
                        {formatPrice(item.affiliate_margin)}
                      </span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* SECTION 2: CARDS AFFILIÉ + CLIENT (2 colonnes) */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Card Affilié */}
          <div className="p-5 bg-purple-50 rounded-xl border border-purple-100">
            <div className="flex items-center gap-2 mb-4">
              <Store className="h-4 w-4 text-purple-500" />
              <span className="text-xs font-semibold text-purple-600 uppercase tracking-wide">
                Affilié
              </span>
            </div>
            {order.affiliate_name ? (
              <>
                <p className="font-semibold text-purple-900 text-lg">
                  {order.affiliate_name}
                </p>
                <p className="text-sm text-purple-700 mt-1">
                  {order.affiliate_type === 'enseigne'
                    ? 'Enseigne'
                    : order.affiliate_type === 'organisation'
                      ? 'Organisation indépendante'
                      : 'Affilié'}
                </p>
              </>
            ) : (
              <p className="text-sm text-purple-600 italic">
                Affilié non renseigné
              </p>
            )}
            {order.selection_name && (
              <div className="mt-3 pt-3 border-t border-purple-200">
                <span className="text-xs text-purple-500 uppercase">
                  Sélection
                </span>
                <p className="text-sm font-medium text-purple-800 mt-1">
                  {order.selection_name}
                </p>
              </div>
            )}
            {/* Encart commission */}
            <div className="mt-4 p-4 bg-white rounded-lg border border-purple-200">
              <span className="text-xs text-purple-500 uppercase tracking-wide">
                Commission à reverser
              </span>
              <p className="text-3xl font-bold text-orange-600 mt-1">
                {formatPrice(order.total_affiliate_margin)}
              </p>
            </div>
          </div>

          {/* Card Client */}
          <div className="p-5 bg-slate-50 rounded-xl border border-slate-100">
            <div className="flex items-center gap-2 mb-4">
              {order.customer_type === 'organization' ? (
                <Building2 className="h-4 w-4 text-slate-500" />
              ) : (
                <User className="h-4 w-4 text-slate-500" />
              )}
              <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                Client
              </span>
            </div>
            <p className="font-semibold text-slate-900 text-lg">
              {order.customer_name}
            </p>
            {order.customer_address && (
              <p className="text-sm text-slate-600 mt-1">
                {order.customer_address}
              </p>
            )}
            {(order.customer_postal_code || order.customer_city) && (
              <p className="text-sm text-slate-600">
                {[order.customer_postal_code, order.customer_city]
                  .filter(Boolean)
                  .join(' ')}
              </p>
            )}
            {order.customer_email && (
              <p className="text-sm text-slate-500 mt-1">
                {order.customer_email}
              </p>
            )}
            {order.customer_phone && (
              <p className="text-sm text-slate-500">{order.customer_phone}</p>
            )}

            {/* Encart montant à payer */}
            <div className="mt-4 p-4 bg-white rounded-lg border border-slate-200">
              <span className="text-xs text-slate-500 uppercase tracking-wide">
                Montant à payer
              </span>
              <div className="mt-3 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-600">Total HT</span>
                  <span className="text-slate-900">
                    {formatPrice(order.total_ht)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">
                    TVA ({(taxRate * 100).toFixed(taxRate === 0.055 ? 1 : 0)}%)
                  </span>
                  <span className="text-slate-900">
                    {formatPrice(taxAmount)}
                  </span>
                </div>
                <div className="flex justify-between pt-3 border-t border-slate-200">
                  <span className="font-semibold text-slate-900">
                    Total TTC
                  </span>
                  <span className="text-2xl font-bold text-slate-900">
                    {formatPrice(order.total_ttc)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

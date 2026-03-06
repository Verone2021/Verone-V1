'use client';

import { Fragment, useEffect, useState } from 'react';

import {
  Badge,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@verone/ui';
import { formatPrice } from '@verone/utils';
import { createClient } from '@verone/utils/supabase/client';
import { Package } from 'lucide-react';

// ============================================
// TYPES
// ============================================

interface Commission {
  id: string;
  order_id: string;
  order_amount_ht: number;
  affiliate_commission: number;
  affiliate_commission_ttc: number | null;
  margin_rate_applied: number;
  order_number: string | null;
  status: string | null;
  total_payout_ht: number | null;
  total_payout_ttc: number | null;
  affiliate?: {
    display_name: string;
  } | null;
  sales_order?: {
    order_number: string;
    total_ht: number | null;
    total_ttc: number | null;
  } | null;
}

interface OrderItem {
  id: string;
  quantity: number;
  unit_price_ht: number;
  total_ht: number;
  tax_rate: number | null;
  retrocession_rate: number | null;
  retrocession_amount: number | null;
  retrocession_amount_ttc: number | null;
  linkme_selection_item_id: string | null;
  selling_price_ht_locked: number | null;
  base_price_ht_locked: number | null;
  product: {
    name: string;
    sku: string | null;
    created_by_affiliate: string | null;
    affiliate_commission_rate: number | null;
  } | null;
}

interface CommissionDetailContentProps {
  commission: Commission;
}

// ============================================
// COMPONENT
// ============================================

export function CommissionDetailContent({
  commission,
}: CommissionDetailContentProps) {
  const [items, setItems] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchItems = async () => {
      setLoading(true);
      const supabase = createClient();

      const { data, error } = await supabase
        .from('sales_order_items')
        .select(
          `
          id,
          quantity,
          unit_price_ht,
          total_ht,
          tax_rate,
          retrocession_rate,
          retrocession_amount,
          retrocession_amount_ttc,
          linkme_selection_item_id,
          selling_price_ht_locked,
          base_price_ht_locked,
          product:products(name, sku, created_by_affiliate, affiliate_commission_rate)
        `
        )
        .eq('sales_order_id', commission.order_id);

      if (error) {
        console.error(
          '[CommissionDetailContent] Error fetching items:',
          error.message
        );
        setItems([]);
      } else {
        setItems(
          (data ?? []).map(row => ({
            ...row,
            product: Array.isArray(row.product)
              ? (row.product[0] ?? null)
              : row.product,
          })) as OrderItem[]
        );
      }
      setLoading(false);
    };

    void fetchItems().catch(err => {
      console.error('[CommissionDetailContent] fetchItems failed:', err);
    });
  }, [commission.order_id]);

  // Separer produits catalogue vs produits affilie
  const catalogueItems = items.filter(
    i => i.product?.created_by_affiliate == null
  );
  const affiliateItems = items.filter(
    i => i.product?.created_by_affiliate != null
  );

  const hasBothSections =
    catalogueItems.length > 0 && affiliateItems.length > 0;

  // Totaux catalogue
  const catalogueCommissionHT = catalogueItems.reduce(
    (sum, item) => sum + (item.retrocession_amount ?? 0),
    0
  );
  const catalogueCommissionTTC = catalogueItems.reduce(
    (sum, item) => sum + (item.retrocession_amount_ttc ?? 0),
    0
  );

  // Totaux affilie (calcul cote client car retrocession = 0 en DB)
  const affiliateTotalHT = affiliateItems.reduce(
    (sum, item) => sum + item.total_ht,
    0
  );
  const affiliateTotalTTC = affiliateItems.reduce(
    (sum, item) => sum + item.total_ht * (1 + (item.tax_rate ?? 0.2)),
    0
  );
  const affiliateCommissionLinkMeHT = affiliateItems.reduce((sum, item) => {
    const commissionRate =
      (item.product?.affiliate_commission_rate ?? 15) / 100;
    return sum + item.total_ht * commissionRate;
  }, 0);
  const affiliateCommissionLinkMeTTC = affiliateItems.reduce((sum, item) => {
    const commissionRate =
      (item.product?.affiliate_commission_rate ?? 15) / 100;
    const taxRate = item.tax_rate ?? 0.2;
    return sum + item.total_ht * commissionRate * (1 + taxRate);
  }, 0);
  const affiliateVersementHT = affiliateTotalHT - affiliateCommissionLinkMeHT;
  const affiliateVersementTTC =
    affiliateTotalTTC - affiliateCommissionLinkMeTTC;

  // Total a verser
  const totalPayoutHT = catalogueCommissionHT + affiliateVersementHT;
  const totalPayoutTTC = catalogueCommissionTTC + affiliateVersementTTC;

  if (loading) {
    return (
      <div className="space-y-2 py-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <Skeleton key={i} className="h-8" />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex items-center gap-2 py-3 text-sm text-muted-foreground">
        <Package className="h-4 w-4" />
        Aucune ligne produit trouvee
      </div>
    );
  }

  const orderNumber =
    commission.sales_order?.order_number ?? commission.order_number ?? '';

  return (
    <div>
      {/* Resume */}
      <div className="mb-3 rounded-lg border border-gray-200 bg-gray-50/80 p-3">
        <p className="text-[11px] font-semibold text-gray-700 mb-2">
          Resume {orderNumber ? `#${orderNumber}` : ''}
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10px]">
          {catalogueItems.length > 0 && (
            <div className="space-y-0.5">
              <p className="font-medium text-gray-500">
                Produits catalogue — {catalogueItems.length} ligne
                {catalogueItems.length > 1 ? 's' : ''}
              </p>
              <p className="text-emerald-600 font-medium">
                Commission HT : {formatPrice(catalogueCommissionHT)} | TTC :{' '}
                {formatPrice(catalogueCommissionTTC)}
              </p>
            </div>
          )}
          {affiliateItems.length > 0 && (
            <div className="space-y-0.5">
              <p className="font-medium text-orange-500">
                Produits affilie — {affiliateItems.length} ligne
                {affiliateItems.length > 1 ? 's' : ''}
              </p>
              <p className="text-gray-600">
                CA HT : {formatPrice(affiliateTotalHT)} | CA TTC :{' '}
                {formatPrice(affiliateTotalTTC)}
              </p>
              <p className="text-orange-500">
                Commission LinkMe HT :{' '}
                {formatPrice(affiliateCommissionLinkMeHT)} | TTC :{' '}
                {formatPrice(affiliateCommissionLinkMeTTC)}
              </p>
              <p className="text-emerald-600 font-medium">
                Versement HT : {formatPrice(affiliateVersementHT)} | TTC :{' '}
                {formatPrice(affiliateVersementTTC)}
              </p>
            </div>
          )}
        </div>
        <div className="mt-2 pt-2 border-t border-gray-300 flex items-center justify-between">
          <p className="text-[10px] font-semibold text-gray-700">
            Total a verser
          </p>
          <p className="text-[10px] text-emerald-600 font-semibold">
            HT : {formatPrice(totalPayoutHT)} | TTC :{' '}
            {formatPrice(totalPayoutTTC)}
          </p>
        </div>
      </div>

      {/* Section Produits Catalogue */}
      {catalogueItems.length > 0 && (
        <>
          {hasBothSections && (
            <p className="text-[10px] font-medium text-gray-400 mb-1.5 mt-3">
              Produits Catalogue — {catalogueItems.length} ligne
              {catalogueItems.length > 1 ? 's' : ''}
            </p>
          )}
          {!hasBothSections && (
            <p className="text-[10px] font-medium text-gray-400 mb-1.5">
              Detail par produit — {items.length} ligne
              {items.length > 1 ? 's' : ''}
            </p>
          )}
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Produit</TableHead>
                  <TableHead className="text-xs text-center">Qte</TableHead>
                  <TableHead className="text-xs text-right">PU HT</TableHead>
                  <TableHead className="text-xs text-right">Total HT</TableHead>
                  <TableHead className="text-xs text-center">Taux</TableHead>
                  <TableHead className="text-xs text-right">Retro HT</TableHead>
                  <TableHead className="text-xs text-right">
                    Retro TTC
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {catalogueItems.map(item => {
                  const priceOrigin = !item.linkme_selection_item_id
                    ? 'manual'
                    : Number(item.unit_price_ht) ===
                        Number(item.selling_price_ht_locked)
                      ? 'selection'
                      : 'adjusted';

                  return (
                    <Fragment key={item.id}>
                      <TableRow>
                        <TableCell className="text-xs">
                          <div>
                            <p className="font-medium truncate max-w-[200px]">
                              {item.product?.name ?? 'Produit inconnu'}
                            </p>
                            {item.product?.sku && (
                              <p className="text-muted-foreground text-[10px] font-mono">
                                {item.product.sku}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-xs text-center">
                          {item.quantity}
                        </TableCell>
                        <TableCell className="text-xs text-right">
                          {formatPrice(item.unit_price_ht)}
                        </TableCell>
                        <TableCell className="text-xs text-right">
                          {formatPrice(item.total_ht)}
                        </TableCell>
                        <TableCell className="text-xs text-center">
                          {item.retrocession_rate != null
                            ? `${(item.retrocession_rate * 100).toFixed(0)}%`
                            : '-'}
                        </TableCell>
                        <TableCell className="text-xs text-right font-medium text-blue-600">
                          {formatPrice(item.retrocession_amount ?? 0)}
                        </TableCell>
                        <TableCell className="text-xs text-right font-medium text-orange-600">
                          {formatPrice(item.retrocession_amount_ttc ?? 0)}
                        </TableCell>
                      </TableRow>
                      <TableRow className="border-0">
                        <TableCell
                          colSpan={7}
                          className="text-[10px] border-0 bg-transparent pt-0 pb-1 text-right"
                        >
                          {priceOrigin === 'selection' && (
                            <Badge
                              variant="outline"
                              className="text-[9px] px-1.5 py-0 border-green-300 text-green-700 bg-green-50"
                            >
                              Prix selection
                            </Badge>
                          )}
                          {priceOrigin === 'adjusted' && (
                            <Badge
                              variant="outline"
                              className="text-[9px] px-1.5 py-0 border-orange-300 text-orange-700 bg-orange-50"
                            >
                              Prix ajuste
                            </Badge>
                          )}
                          {priceOrigin === 'manual' && (
                            <Badge
                              variant="outline"
                              className="text-[9px] px-1.5 py-0 border-gray-300 text-gray-600 bg-gray-50"
                            >
                              Prix manuel
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    </Fragment>
                  );
                })}
                <TableRow className="bg-muted/50 font-medium">
                  <TableCell className="text-xs" colSpan={5}>
                    Total catalogue
                  </TableCell>
                  <TableCell className="text-xs text-right text-blue-600">
                    {formatPrice(catalogueCommissionHT)}
                  </TableCell>
                  <TableCell className="text-xs text-right text-orange-600">
                    {formatPrice(catalogueCommissionTTC)}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </>
      )}

      {/* Section Produits affilie */}
      {affiliateItems.length > 0 && (
        <>
          <p className="text-[10px] font-medium text-orange-500 mb-1.5 mt-3">
            Produits affilie — {affiliateItems.length} ligne
            {affiliateItems.length > 1 ? 's' : ''}
          </p>
          <div className="border border-orange-200 rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Produit</TableHead>
                  <TableHead className="text-xs text-center">Qte</TableHead>
                  <TableHead className="text-xs text-right">PU HT</TableHead>
                  <TableHead className="text-xs text-right">Total HT</TableHead>
                  <TableHead className="text-xs text-right text-orange-500">
                    Comm. LinkMe HT
                  </TableHead>
                  <TableHead className="text-xs text-right text-emerald-600">
                    Versement HT
                  </TableHead>
                  <TableHead className="text-xs text-right text-emerald-600">
                    Versement TTC
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {affiliateItems.map(item => {
                  const commissionRate =
                    (item.product?.affiliate_commission_rate ?? 15) / 100;
                  const taxRate = item.tax_rate ?? 0.2;
                  const totalTTCLine = item.total_ht * (1 + taxRate);
                  const commLinkMeHT = item.total_ht * commissionRate;
                  const commLinkMeTTC = commLinkMeHT * (1 + taxRate);
                  const versementHT = item.total_ht - commLinkMeHT;
                  const versementTTC = totalTTCLine - commLinkMeTTC;

                  return (
                    <TableRow key={item.id}>
                      <TableCell className="text-xs">
                        <div>
                          <p className="font-medium truncate max-w-[200px]">
                            {item.product?.name ?? 'Produit inconnu'}
                          </p>
                          {item.product?.sku && (
                            <p className="text-muted-foreground text-[10px] font-mono">
                              {item.product.sku}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-center">
                        {item.quantity}
                      </TableCell>
                      <TableCell className="text-xs text-right">
                        {formatPrice(item.unit_price_ht)}
                      </TableCell>
                      <TableCell className="text-xs text-right">
                        {formatPrice(item.total_ht)}
                      </TableCell>
                      <TableCell className="text-xs text-right text-orange-500">
                        {formatPrice(commLinkMeHT)}
                      </TableCell>
                      <TableCell className="text-xs text-right text-emerald-600">
                        {formatPrice(versementHT)}
                      </TableCell>
                      <TableCell className="text-xs text-right font-medium text-emerald-600">
                        {formatPrice(versementTTC)}
                      </TableCell>
                    </TableRow>
                  );
                })}
                <TableRow className="bg-orange-50/50 font-medium">
                  <TableCell className="text-xs" colSpan={4}>
                    Total produits affilie
                  </TableCell>
                  <TableCell className="text-xs text-right text-orange-500">
                    {formatPrice(affiliateCommissionLinkMeHT)}
                  </TableCell>
                  <TableCell className="text-xs text-right text-emerald-600">
                    {formatPrice(affiliateVersementHT)}
                  </TableCell>
                  <TableCell className="text-xs text-right text-emerald-600">
                    {formatPrice(affiliateVersementTTC)}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </>
      )}

      {/* Grand total */}
      <div className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50/50 p-2.5 flex items-center justify-between">
        <span className="text-[11px] font-semibold text-gray-700">
          Total a verser
        </span>
        <div className="flex gap-6 text-[11px]">
          <span className="text-gray-500">
            HT :{' '}
            <span className="font-semibold text-emerald-700">
              {formatPrice(totalPayoutHT)}
            </span>
          </span>
          <span className="text-gray-500">
            TTC :{' '}
            <span className="font-semibold text-emerald-700">
              {formatPrice(totalPayoutTTC)}
            </span>
          </span>
        </div>
      </div>
    </div>
  );
}

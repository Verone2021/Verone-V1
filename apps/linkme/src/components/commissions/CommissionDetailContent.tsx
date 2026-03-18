'use client';

import { useEffect, useState } from 'react';

import { createClient } from '@verone/utils/supabase/client';
import { Loader2, Package } from 'lucide-react';

import type { CommissionItem } from '../../types/analytics';
import { formatCurrency } from '../../types/analytics';

interface OrderItem {
  id: string;
  quantity: number;
  unit_price_ht: number;
  total_ht: number;
  tax_rate: number | null;
  retrocession_rate: number | null;
  retrocession_amount: number | null;
  retrocession_amount_ttc: number | null;
  product: {
    name: string;
    created_by_affiliate: string | null;
    affiliate_commission_rate: number | null;
  } | null;
}

interface CommissionDetailContentProps {
  commission: CommissionItem;
}

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
          product:products(name, created_by_affiliate, affiliate_commission_rate)
        `
        )
        .eq('sales_order_id', commission.orderId);

      if (error) {
        console.error(
          '[CommissionDetailContent] Error fetching items:',
          error.message
        );
        setItems([]);
      } else {
        setItems(
          (data ?? []).map(row => {
            const rawProduct = row.product as
              | OrderItem['product']
              | OrderItem['product'][];
            return {
              ...row,
              product: Array.isArray(rawProduct)
                ? (rawProduct[0] ?? null)
                : rawProduct,
            };
          }) as OrderItem[]
        );
      }
      setLoading(false);
    };

    void fetchItems().catch(err => {
      console.error('[CommissionDetailContent] fetchItems failed:', err);
    });
  }, [commission.orderId]);

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
  const catalogueTotalHT = catalogueItems.reduce(
    (sum, item) => sum + item.total_ht,
    0
  );
  const catalogueTotalTTC = catalogueItems.reduce(
    (sum, item) => sum + item.total_ht * (1 + (item.tax_rate ?? 0.2)),
    0
  );
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

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-4 text-gray-400">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-xs">Chargement du detail...</span>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex items-center gap-2 py-3 text-gray-400">
        <Package className="h-4 w-4" />
        <span className="text-xs">Aucune ligne produit trouvee</span>
      </div>
    );
  }

  return (
    <div className="py-2">
      {/* Resume */}
      <div className="mb-3 rounded-lg border border-gray-200 bg-gray-50/80 p-3">
        <p className="text-[11px] font-semibold text-gray-700 mb-2">
          Resume #{commission.orderNumber}
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10px]">
          {catalogueItems.length > 0 && (
            <div className="space-y-0.5">
              <p className="font-medium text-gray-500">
                Produits catalogue — {catalogueItems.length} ligne
                {catalogueItems.length > 1 ? 's' : ''}
              </p>
              <p className="text-gray-600">
                CA HT : {formatCurrency(catalogueTotalHT)} | CA TTC :{' '}
                {formatCurrency(catalogueTotalTTC)}
              </p>
              <p className="text-emerald-600 font-medium">
                Commission HT : {formatCurrency(catalogueCommissionHT)} | TTC :{' '}
                {formatCurrency(catalogueCommissionTTC)}
              </p>
            </div>
          )}
          {affiliateItems.length > 0 && (
            <div className="space-y-0.5">
              <p className="font-medium text-orange-500">
                Vos produits — {affiliateItems.length} ligne
                {affiliateItems.length > 1 ? 's' : ''}
              </p>
              <p className="text-gray-600">
                CA HT : {formatCurrency(affiliateTotalHT)} | CA TTC :{' '}
                {formatCurrency(affiliateTotalTTC)}
              </p>
              <p className="text-orange-500">
                Commission LinkMe HT :{' '}
                {formatCurrency(affiliateCommissionLinkMeHT)} | TTC :{' '}
                {formatCurrency(affiliateCommissionLinkMeTTC)}
              </p>
              <p className="text-emerald-600 font-medium">
                Versement HT : {formatCurrency(affiliateVersementHT)} | TTC :{' '}
                {formatCurrency(affiliateVersementTTC)}
              </p>
            </div>
          )}
        </div>
        <div className="mt-2 pt-2 border-t border-gray-300 flex items-center justify-between">
          <p className="text-[10px] font-semibold text-gray-700">
            Total a percevoir
          </p>
          <p className="text-[10px] text-emerald-600 font-semibold">
            HT : {formatCurrency(catalogueCommissionHT + affiliateVersementHT)}{' '}
            | TTC :{' '}
            {formatCurrency(catalogueCommissionTTC + affiliateVersementTTC)}
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
          <CatalogueTable
            items={catalogueItems}
            totalHT={catalogueTotalHT}
            totalTTC={catalogueTotalTTC}
            totalCommissionHT={catalogueCommissionHT}
            totalCommissionTTC={catalogueCommissionTTC}
          />
        </>
      )}

      {/* Section Vos Produits (affilie) */}
      {affiliateItems.length > 0 && (
        <>
          <p className="text-[10px] font-medium text-orange-500 mb-1.5 mt-3">
            Vos Produits — {affiliateItems.length} ligne
            {affiliateItems.length > 1 ? 's' : ''}
          </p>
          <AffiliateTable
            items={affiliateItems}
            totalHT={affiliateTotalHT}
            totalTTC={affiliateTotalTTC}
            totalCommissionLinkMeHT={affiliateCommissionLinkMeHT}
            totalCommissionLinkMeTTC={affiliateCommissionLinkMeTTC}
            totalVersementHT={affiliateVersementHT}
            totalVersementTTC={affiliateVersementTTC}
          />
        </>
      )}

      {/* Grand total — toujours visible */}
      <div className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50/50 p-2.5 flex items-center justify-between">
        <span className="text-[11px] font-semibold text-gray-700">
          Total a percevoir
        </span>
        <div className="flex gap-6 text-[11px]">
          <span className="text-gray-500">
            HT :{' '}
            <span className="font-semibold text-emerald-700">
              {formatCurrency(catalogueCommissionHT + affiliateVersementHT)}
            </span>
          </span>
          <span className="text-gray-500">
            TTC :{' '}
            <span className="font-semibold text-emerald-700">
              {formatCurrency(catalogueCommissionTTC + affiliateVersementTTC)}
            </span>
          </span>
        </div>
      </div>
    </div>
  );
}

// Table pour produits catalogue
function CatalogueTable({
  items,
  totalHT,
  totalTTC,
  totalCommissionHT,
  totalCommissionTTC,
}: {
  items: OrderItem[];
  totalHT: number;
  totalTTC: number;
  totalCommissionHT: number;
  totalCommissionTTC: number;
}) {
  return (
    <table className="w-full text-xs">
      <thead>
        <tr className="border-b border-gray-100">
          <th className="text-left py-1 text-[10px] font-medium text-gray-400">
            Produit
          </th>
          <th className="text-center py-1 text-[10px] font-medium text-gray-400">
            Qte
          </th>
          <th className="text-right py-1 text-[10px] font-medium text-gray-400">
            PU HT
          </th>
          <th className="text-right py-1 text-[10px] font-medium text-gray-400">
            Total HT
          </th>
          <th className="text-right py-1 text-[10px] font-medium text-gray-400">
            Total TTC
          </th>
          <th className="text-center py-1 text-[10px] font-medium text-gray-400">
            Taux
          </th>
          <th className="text-right py-1 text-[10px] font-medium text-gray-400">
            Commission HT
          </th>
          <th className="text-right py-1 text-[10px] font-medium text-gray-400">
            Commission TTC
          </th>
        </tr>
      </thead>
      <tbody>
        {items.map(item => {
          const taxRate = item.tax_rate ?? 0.2;
          const totalTTCLine = item.total_ht * (1 + taxRate);

          return (
            <tr key={item.id} className="border-b border-gray-50">
              <td className="py-1.5 text-gray-700 max-w-[180px] truncate">
                {item.product?.name ?? 'Produit inconnu'}
              </td>
              <td className="py-1.5 text-center text-gray-600">
                {item.quantity}
              </td>
              <td className="py-1.5 text-right text-gray-600">
                {formatCurrency(item.unit_price_ht)}
              </td>
              <td className="py-1.5 text-right text-gray-600">
                {formatCurrency(item.total_ht)}
              </td>
              <td className="py-1.5 text-right text-gray-600">
                {formatCurrency(totalTTCLine)}
              </td>
              <td className="py-1.5 text-center text-gray-600">
                {item.retrocession_rate != null
                  ? `${(item.retrocession_rate * 100).toFixed(2)}%`
                  : '-'}
              </td>
              <td className="py-1.5 text-right text-emerald-600">
                {formatCurrency(item.retrocession_amount ?? 0)}
              </td>
              <td className="py-1.5 text-right font-medium text-emerald-600">
                {formatCurrency(item.retrocession_amount_ttc ?? 0)}
              </td>
            </tr>
          );
        })}
        <tr className="bg-gray-50/50 font-medium">
          <td className="py-1.5 text-gray-700" colSpan={3}>
            Total catalogue
          </td>
          <td className="py-1.5 text-right text-gray-700">
            {formatCurrency(totalHT)}
          </td>
          <td className="py-1.5 text-right text-gray-700">
            {formatCurrency(totalTTC)}
          </td>
          <td />
          <td className="py-1.5 text-right text-emerald-600">
            {formatCurrency(totalCommissionHT)}
          </td>
          <td className="py-1.5 text-right text-emerald-600">
            {formatCurrency(totalCommissionTTC)}
          </td>
        </tr>
      </tbody>
    </table>
  );
}

// Table pour produits affilie ("Vos Produits")
function AffiliateTable({
  items,
  totalHT,
  totalTTC,
  totalCommissionLinkMeHT,
  totalCommissionLinkMeTTC,
  totalVersementHT,
  totalVersementTTC,
}: {
  items: OrderItem[];
  totalHT: number;
  totalTTC: number;
  totalCommissionLinkMeHT: number;
  totalCommissionLinkMeTTC: number;
  totalVersementHT: number;
  totalVersementTTC: number;
}) {
  return (
    <table className="w-full text-xs">
      <thead>
        <tr className="border-b border-orange-100">
          <th className="text-left py-1 text-[10px] font-medium text-gray-400">
            Produit
          </th>
          <th className="text-center py-1 text-[10px] font-medium text-gray-400">
            Qte
          </th>
          <th className="text-right py-1 text-[10px] font-medium text-gray-400">
            PU HT
          </th>
          <th className="text-right py-1 text-[10px] font-medium text-gray-400">
            Total HT
          </th>
          <th className="text-right py-1 text-[10px] font-medium text-gray-400">
            Total TTC
          </th>
          <th className="text-right py-1 text-[10px] font-medium text-orange-400">
            Comm. LinkMe HT
          </th>
          <th className="text-right py-1 text-[10px] font-medium text-orange-400">
            Comm. LinkMe TTC
          </th>
          <th className="text-right py-1 text-[10px] font-medium text-emerald-500">
            Versement HT
          </th>
          <th className="text-right py-1 text-[10px] font-medium text-emerald-500">
            Versement TTC
          </th>
        </tr>
      </thead>
      <tbody>
        {items.map(item => {
          const commissionRate =
            (item.product?.affiliate_commission_rate ?? 15) / 100;
          const taxRate = item.tax_rate ?? 0.2;
          const totalTTCLine = item.total_ht * (1 + taxRate);
          const commLinkMeHT = item.total_ht * commissionRate;
          const commLinkMeTTC = commLinkMeHT * (1 + taxRate);
          const versementHT = item.total_ht - commLinkMeHT;
          const versementTTC = totalTTCLine - commLinkMeTTC;

          return (
            <tr key={item.id} className="border-b border-gray-50">
              <td className="py-1.5 text-gray-700 max-w-[180px] truncate">
                {item.product?.name ?? 'Produit inconnu'}
              </td>
              <td className="py-1.5 text-center text-gray-600">
                {item.quantity}
              </td>
              <td className="py-1.5 text-right text-gray-600">
                {formatCurrency(item.unit_price_ht)}
              </td>
              <td className="py-1.5 text-right text-gray-600">
                {formatCurrency(item.total_ht)}
              </td>
              <td className="py-1.5 text-right text-gray-600">
                {formatCurrency(totalTTCLine)}
              </td>
              <td className="py-1.5 text-right text-orange-500">
                {formatCurrency(commLinkMeHT)}
              </td>
              <td className="py-1.5 text-right font-medium text-orange-500">
                {formatCurrency(commLinkMeTTC)}
              </td>
              <td className="py-1.5 text-right text-emerald-600">
                {formatCurrency(versementHT)}
              </td>
              <td className="py-1.5 text-right font-medium text-emerald-600">
                {formatCurrency(versementTTC)}
              </td>
            </tr>
          );
        })}
        <tr className="bg-orange-50/50 font-medium">
          <td className="py-1.5 text-gray-700" colSpan={3}>
            Total vos produits
          </td>
          <td className="py-1.5 text-right text-gray-700">
            {formatCurrency(totalHT)}
          </td>
          <td className="py-1.5 text-right text-gray-700">
            {formatCurrency(totalTTC)}
          </td>
          <td className="py-1.5 text-right text-orange-500">
            {formatCurrency(totalCommissionLinkMeHT)}
          </td>
          <td className="py-1.5 text-right text-orange-500">
            {formatCurrency(totalCommissionLinkMeTTC)}
          </td>
          <td className="py-1.5 text-right text-emerald-600">
            {formatCurrency(totalVersementHT)}
          </td>
          <td className="py-1.5 text-right text-emerald-600">
            {formatCurrency(totalVersementTTC)}
          </td>
        </tr>
      </tbody>
    </table>
  );
}

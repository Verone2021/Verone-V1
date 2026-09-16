'use client';

import { useMemo } from 'react';

import type { ConsultationItem } from '@verone/consultations';
import {
  computeItemsEconomics,
  type ConsultationEconomicsSettingsSource,
  type ConsultationSupplierCost,
} from '@verone/consultations';
import { Badge } from '@verone/ui';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@verone/ui';
import { ShoppingCart, Truck, AlertTriangle, Package } from 'lucide-react';

interface ConsultationOrderDialogProps {
  open: boolean;
  onClose: () => void;
  acceptedItems: ConsultationItem[];
  /** Consultation porteuse des réglages de calcul (marge par défaut). */
  consultation?: ConsultationEconomicsSettingsSource | null;
  /** Frais saisis par fournisseur — repris tels quels sur la commande. */
  supplierCosts?: ConsultationSupplierCost[];
  creatingPO?: boolean;
  onCreateSalesOrder: () => void;
  onCreatePurchaseOrder: (supplierGroups: SupplierGroup[]) => void;
  creatingSO: boolean;
}

export interface SupplierGroup {
  supplierId: string;
  supplierName: string;
  items: ConsultationItem[];
  totalHT: number;
  /** Lignes prêtes pour la commande fournisseur (prix d'achat, pas de vente). */
  purchaseLines: {
    product_id: string;
    quantity: number;
    unit_price_ht: number;
    eco_tax: number;
  }[];
  shippingCostHt: number;
  customsCostHt: number;
  otherCostHt: number;
}

export function ConsultationOrderDialog({
  open,
  onClose,
  acceptedItems,
  consultation,
  supplierCosts = [],
  onCreateSalesOrder,
  onCreatePurchaseOrder,
  creatingSO,
  creatingPO = false,
}: ConsultationOrderDialogProps) {
  // Grouper par fournisseur : UNE commande par fournisseur, pas une par produit
  const { supplierGroups, totalSellingPrice, totalCostPrice, alreadyOrdered } =
    useMemo(() => {
      const costInputs = supplierCosts.map(cost => ({
        supplierId: cost.supplier_id,
        shippingCostHt: cost.shipping_cost_ht,
        customsCostHt: cost.customs_cost_ht,
        otherCostHt: cost.other_cost_ht,
      }));
      const { totals, byItemId: econMap } = computeItemsEconomics(
        acceptedItems,
        consultation,
        costInputs
      );

      // Une ligne déjà commandée ne repart pas en commande fournisseur
      const toOrder = acceptedItems.filter(item => item.status !== 'ordered');
      const costBySupplier = new Map(
        supplierCosts.map(cost => [cost.supplier_id, cost])
      );

      const groups = new Map<string, SupplierGroup>();
      for (const item of toOrder) {
        const supplierId = item.product?.supplier_id;
        // Sans fournisseur, aucune commande fournisseur n'est possible
        if (!supplierId) continue;
        if (!groups.has(supplierId)) {
          const cost = costBySupplier.get(supplierId);
          groups.set(supplierId, {
            supplierId,
            supplierName: item.product?.supplier_name ?? 'Fournisseur',
            items: [],
            totalHT: 0,
            purchaseLines: [],
            shippingCostHt: cost?.shipping_cost_ht ?? 0,
            customsCostHt: cost?.customs_cost_ht ?? 0,
            otherCostHt: cost?.other_cost_ht ?? 0,
          });
        }
        const group = groups.get(supplierId);
        if (!group) continue;
        group.items.push(item);
        // unitCost issu de computeLineEconomics — source unique des formules B2
        const econ = econMap.get(item.id);
        group.totalHT += econ?.purchaseAmount ?? 0;
        group.purchaseLines.push({
          product_id: item.product_id,
          quantity: item.quantity,
          unit_price_ht: econ?.unitCost ?? 0,
          eco_tax: econ?.ecoTax ?? 0,
        });
      }

      return {
        supplierGroups: Array.from(groups.values()),
        totalSellingPrice: totals.revenue,
        totalCostPrice: totals.cost,
        alreadyOrdered: acceptedItems.filter(item => item.status === 'ordered')
          .length,
      };
    }, [acceptedItems, consultation, supplierCosts]);

  const groupsTotalHT = supplierGroups.reduce(
    (sum, group) =>
      sum +
      group.totalHT +
      group.shippingCostHt +
      group.customsCostHt +
      group.otherCostHt,
    0
  );

  // Calculer le stock disponible par produit
  const itemsWithStock = acceptedItems.map(item => {
    const stockReal = item.product?.stock_real ?? 0;
    const stockIn = item.product?.stock_forecasted_in ?? 0;
    const stockOut = item.product?.stock_forecasted_out ?? 0;
    const stockAvailable = stockReal + stockIn - stockOut;
    const hasEnoughStock = stockAvailable >= item.quantity;
    return { ...item, stockReal, stockAvailable, hasEnoughStock };
  });

  const insufficientStockItems = itemsWithStock.filter(i => !i.hasEnoughStock);
  const hasStockIssue = insufficientStockItems.length > 0;

  return (
    <Dialog
      open={open}
      onOpenChange={v => {
        if (!v) onClose();
      }}
    >
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Commander depuis la consultation
          </DialogTitle>
          <DialogDescription>
            {acceptedItems.length} produit{acceptedItems.length > 1 ? 's' : ''}{' '}
            accepté{acceptedItems.length > 1 ? 's' : ''}
          </DialogDescription>
        </DialogHeader>

        {/* Produits avec stock */}
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr className="text-left text-xs text-gray-500 uppercase tracking-wider">
                <th className="p-2.5 font-medium">Produit</th>
                <th className="p-2.5 font-medium text-center">Qté</th>
                <th className="p-2.5 font-medium text-center">Stock</th>
                <th className="p-2.5 font-medium text-right">Fournisseur</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {itemsWithStock.map(item => (
                <tr
                  key={item.id}
                  className={item.hasEnoughStock ? '' : 'bg-red-50/50'}
                >
                  <td className="p-2.5">
                    <span className="font-medium truncate block max-w-[180px]">
                      {item.product?.name}
                    </span>
                  </td>
                  <td className="p-2.5 text-center">
                    <Badge variant="secondary" className="text-xs">
                      ×{item.quantity}
                    </Badge>
                  </td>
                  <td className="p-2.5 text-center">
                    <span
                      className={`font-semibold ${item.hasEnoughStock ? 'text-green-700' : 'text-red-600'}`}
                    >
                      {item.stockAvailable}
                    </span>
                    <span className="text-gray-400 text-xs ml-0.5">
                      ({item.stockReal} réel)
                    </span>
                  </td>
                  <td className="p-2.5 text-right text-gray-500 text-xs">
                    {item.product?.supplier_name ?? '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* KPIs mini */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg border p-3">
            <p className="text-xs text-gray-500">Prix de vente total</p>
            <p className="text-lg font-bold">{totalSellingPrice.toFixed(2)}€</p>
          </div>
          <div className="rounded-lg border p-3">
            <p className="text-xs text-gray-500">Coût de revient total</p>
            <p className="text-lg font-bold">{totalCostPrice.toFixed(2)}€</p>
          </div>
        </div>

        {/* Alerte stock uniquement si insuffisant */}
        {hasStockIssue && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5 shrink-0" />
            <div className="text-sm">
              <p className="font-medium text-red-800">
                Stock insuffisant pour {insufficientStockItems.length} produit
                {insufficientStockItems.length > 1 ? 's' : ''}
              </p>
              <p className="text-red-600 text-xs mt-0.5">
                Créez une commande fournisseur pour réapprovisionner avant de
                commander pour le client.
              </p>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="space-y-2 pt-2">
          {/* Commande fournisseur (PO) — une par fournisseur */}
          <button
            onClick={() => onCreatePurchaseOrder(supplierGroups)}
            disabled={creatingPO || supplierGroups.length === 0}
            className="w-full flex items-center justify-between p-4 rounded-lg border-2 border-gray-200 hover:border-black hover:bg-gray-50 transition-colors text-left group disabled:opacity-50"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
                <Truck className="h-5 w-5 text-orange-700" />
              </div>
              <div>
                <p className="font-semibold text-sm">
                  {supplierGroups.length > 1
                    ? `Créer ${supplierGroups.length} commandes fournisseur`
                    : 'Créer la commande fournisseur'}
                </p>
                <p className="text-xs text-gray-500">
                  {supplierGroups.length === 0
                    ? alreadyOrdered > 0
                      ? 'Tout est déjà commandé'
                      : 'Aucun fournisseur sur ces lignes'
                    : `${supplierGroups
                        .map(
                          group =>
                            `${group.supplierName} (${group.items.length})`
                        )
                        .join(' · ')} • ${groupsTotalHT.toFixed(2)}€ HT`}
                </p>
              </div>
            </div>
            <span className="text-gray-400 group-hover:text-black transition-colors">
              →
            </span>
          </button>

          {alreadyOrdered > 0 && supplierGroups.length > 0 && (
            <p className="text-xs text-gray-500 px-1">
              {alreadyOrdered} ligne{alreadyOrdered > 1 ? 's' : ''} déjà
              commandée{alreadyOrdered > 1 ? 's' : ''} : elle
              {alreadyOrdered > 1 ? 's ne sont' : " n'est"} pas reprise
              {alreadyOrdered > 1 ? 's' : ''} ici.
            </p>
          )}

          {/* Commande client (SO) */}
          <button
            onClick={onCreateSalesOrder}
            disabled={creatingSO}
            className="w-full flex items-center justify-between p-4 rounded-lg border-2 border-gray-200 hover:border-black hover:bg-gray-50 transition-colors text-left group disabled:opacity-50"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <ShoppingCart className="h-5 w-5 text-blue-700" />
              </div>
              <div>
                <p className="font-semibold text-sm">Commande Client (SO)</p>
                <p className="text-xs text-gray-500">
                  {acceptedItems.length} produit
                  {acceptedItems.length > 1 ? 's' : ''} •{' '}
                  {totalSellingPrice.toFixed(2)}€ HT
                </p>
              </div>
            </div>
            <span className="text-gray-400 group-hover:text-black transition-colors">
              →
            </span>
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

'use client';

import { useState } from 'react';

import type { SelectedProduct } from '@verone/products/components/selectors/UniversalProductSelectorV2';
import { UniversalProductSelectorV2 } from '@verone/products/components/selectors/UniversalProductSelectorV2';
import { SourcingProductModal } from '@verone/products/components/sourcing/SourcingProductModal';
import { Alert, AlertDescription } from '@verone/ui';
import { Plus, Sparkles, ShoppingCart, Calculator } from 'lucide-react';

import {
  computeItemsEconomics,
  resolveConsultationTvaPercentage,
  type ConsultationEconomicsSettingsSource,
  type ConsultationTaxSource,
} from '../../lib/consultation-economics-input';

import type {
  ConsultationItem,
  CreateConsultationItemData,
  UpdateConsultationItemData,
} from '@verone/consultations/hooks';

import type {
  ConsultationNeed,
  CreateConsultationNeedData,
} from '../../hooks/use-consultation-needs';

import { ConsultationMarginKpis } from './ConsultationMarginKpis';
import { ConsultationNeedsCard } from './ConsultationNeedsCard';
import { ConsultationProductsTable } from './ConsultationProductsTable';
import type {
  ConsultationSupplierCost,
  UpsertSupplierCostData,
} from '../../hooks/use-consultation-supplier-costs';
import {
  isEligibleForSupplierCosts,
  type SupplierCostInput,
} from '../../lib/consultation-supplier-costs';

import {
  ConsultationSupplierCostsCard,
  type ConsultationSupplierRef,
} from './ConsultationSupplierCostsCard';

/** Montant saisi : vide ou illisible → null (valeur effacée), sinon le nombre. */
function toAmountOrNull(raw: string): number | null {
  if (raw === '') return null;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : null;
}

// Décision 1 BO-CONSULT-P2-001 : items + mutations via props (source unique dans page.tsx)
interface ConsultationOrderInterfaceProps {
  consultationId: string;
  /** Consultation porteuse des réglages (marge par défaut, TVA). */
  consultation?:
    | (ConsultationEconomicsSettingsSource & ConsultationTaxSource)
    | null;
  /** Frais saisis par fournisseur — chargés par la page (source unique). */
  supplierCosts?: ConsultationSupplierCost[];
  supplierCostInputs?: SupplierCostInput[];
  onSaveSupplierCost?: (data: UpsertSupplierCostData) => Promise<boolean>;
  /** Besoins du client — chargés par la page (source unique). */
  needs?: ConsultationNeed[];
  onAddNeed?: (data: CreateConsultationNeedData) => Promise<boolean>;
  onRemoveNeed?: (needId: string) => Promise<boolean>;
  consultationItems: ConsultationItem[];
  loading: boolean;
  error: string | null;
  addItem: (data: CreateConsultationItemData) => Promise<boolean>;
  updateItem: (
    itemId: string,
    updates: UpdateConsultationItemData
  ) => Promise<boolean>;
  removeItem: (itemId: string) => Promise<boolean>;
  fetchConsultationItems: (id: string) => Promise<void>;
  onItemsChanged?: () => void;
  onCreatePurchaseOrder?: (acceptedItems: ConsultationItem[]) => void;
}

export function ConsultationOrderInterface({
  consultationId,
  consultation,
  supplierCosts = [],
  supplierCostInputs = [],
  onSaveSupplierCost,
  needs = [],
  onAddNeed,
  onRemoveNeed,
  consultationItems,
  loading,
  error,
  addItem,
  updateItem,
  removeItem,
  fetchConsultationItems,
  onItemsChanged,
  onCreatePurchaseOrder,
}: ConsultationOrderInterfaceProps) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showSourcingModal, setShowSourcingModal] = useState(false);

  // Édition inline
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [editQuantity, setEditQuantity] = useState(1);
  const [editPrice, setEditPrice] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [editShippingCost, setEditShippingCost] = useState('');
  const [editSellingShippingCost, setEditSellingShippingCost] = useState('');
  const [editCostPriceOverride, setEditCostPriceOverride] = useState('');
  const [editIsSample, setEditIsSample] = useState(false);
  const [editMarginPercentage, setEditMarginPercentage] = useState('');
  const [editNeedId, setEditNeedId] = useState<string>('');

  // Décision 1 BO-CONSULT-P2-001 : plus d'effet de re-sync local
  // (les items arrivent du parent via props — la re-sync est dans le hook parent)
  const handleProductAdded = () => {
    void fetchConsultationItems(consultationId).then(() => {
      onItemsChanged?.();
    });
  };

  const startEditItem = (item: ConsultationItem) => {
    setEditingItem(item.id);
    setEditQuantity(item.quantity);
    setEditPrice(item.unit_price?.toString() ?? '');
    setEditNotes(item.notes ?? '');
    setEditShippingCost(item.shipping_cost?.toString() ?? '0');
    setEditSellingShippingCost(item.selling_shipping_cost?.toString() ?? '0');
    setEditCostPriceOverride(item.cost_price_override?.toString() ?? '');
    setEditIsSample(item.is_sample ?? false);
    setEditMarginPercentage(item.margin_percentage?.toString() ?? '');
    setEditNeedId(item.need_id ?? '');
  };

  const saveEditItem = (itemId: string): void => {
    const marginRaw = editMarginPercentage.trim();
    const marginParsed = marginRaw === '' ? null : Number(marginRaw);
    // Champ vidé = valeur effacée (et non « ne pas toucher ») : sans ça, un prix
    // saisi par erreur reste à vie. Vide côté vente → le prix repart de la marge,
    // vide côté achat → on reprend le prix d'achat du produit.
    const priceRaw = editPrice.trim();
    const costRaw = editCostPriceOverride.trim();
    void updateItem(itemId, {
      quantity: editQuantity,
      unit_price: toAmountOrNull(priceRaw),
      notes: editNotes || undefined,
      shipping_cost: editShippingCost ? parseFloat(editShippingCost) : 0,
      selling_shipping_cost: editSellingShippingCost
        ? parseFloat(editSellingShippingCost)
        : 0,
      cost_price_override: toAmountOrNull(costRaw),
      is_sample: editIsSample,
      // vide ou illisible → null : la ligne suit la marge par défaut
      margin_percentage:
        marginParsed !== null && Number.isFinite(marginParsed)
          ? marginParsed
          : null,
      need_id: editNeedId === '' ? null : editNeedId,
    })
      .then(success => {
        if (success) setEditingItem(null);
      })
      .catch(err => {
        console.error('[ConsultationOrderInterface] saveEditItem failed:', err);
      });
  };

  const cancelEditItem = () => setEditingItem(null);

  const handleRemoveItem = (itemId: string, productName: string): void => {
    if (
      window.confirm(
        `Êtes-vous sûr de vouloir retirer "${productName}" de la consultation ?`
      )
    ) {
      void removeItem(itemId).catch(err => {
        console.error('[ConsultationOrderInterface] removeItem failed:', err);
      });
    }
  };

  const changeLineStatus = (itemId: string, status: string): void => {
    void updateItem(itemId, { status }).catch(err => {
      console.error(
        '[ConsultationOrderInterface] changeLineStatus failed:',
        err
      );
    });
  };

  const changeQuantity = (itemId: string, delta: number): void => {
    const item = consultationItems.find(i => i.id === itemId);
    if (!item) return;
    void updateItem(itemId, {
      quantity: Math.max(1, item.quantity + delta),
    }).catch(err => {
      console.error('[ConsultationOrderInterface] changeQuantity failed:', err);
    });
  };

  const handleSampleChange = (itemId: string, priceStr: string): void => {
    // Input vide → ligne normale (pas echantillon)
    // Input '0' → echantillon gratuit (is_free=true, unit_price inchange : DB constraint > 0)
    // Input > 0 → echantillon a prix reduit
    const trimmed = priceStr.trim();
    let patch: Partial<{
      is_sample: boolean;
      is_free: boolean;
      unit_price: number;
    }> = {};
    if (trimmed === '') {
      patch = { is_sample: false, is_free: false };
    } else {
      const price = parseFloat(trimmed);
      if (Number.isNaN(price) || price < 0) return;
      patch =
        price === 0
          ? { is_sample: true, is_free: true }
          : { is_sample: true, is_free: false, unit_price: price };
    }
    void updateItem(itemId, patch).catch(err => {
      console.error(
        '[ConsultationOrderInterface] handleSampleChange failed:',
        err
      );
    });
  };

  // Décision 2 BO-CONSULT-P2-001 : lignes refusées exclues du compteur
  const totalItems = consultationItems
    .filter(i => i.status !== 'rejected')
    .reduce((sum, i) => sum + i.quantity, 0);
  // Décision D5 (BO-PRODUCTS-P8-001) : une ligne dont le produit est retiré
  // n'est pas commandable
  const acceptedItems = consultationItems.filter(
    i =>
      (i.status === 'approved' || i.status === 'ordered') &&
      !i.product?.archived_at
  );
  const hasAcceptedItems = acceptedItems.length > 0;

  // Calcul unique de la consultation — source des KPIs ET de chaque ligne
  // (adaptateur partagé, réglages de la consultation inclus : marge par défaut
  // et frais saisis par fournisseur, répartis au prorata de la valeur de ligne)
  const {
    totals: economics,
    byItemId: economicsByItemId,
    suppliers: supplierEconomics,
  } = computeItemsEconomics(
    consultationItems,
    consultation,
    supplierCostInputs
  );

  // La carte « besoins » ne s'affiche que si elle sert à quelque chose
  const hasNeedLines = consultationItems.some(item => item.need_id);

  // Fournisseurs présents dans la consultation, dans l'ordre des lignes
  const suppliers: ConsultationSupplierRef[] = [];
  for (const item of consultationItems) {
    const supplierId = item.product?.supplier_id;
    if (!supplierId) continue;
    const lineRef = {
      itemId: item.id,
      productName: item.product?.name ?? 'Produit',
      carriesFees: item.carries_supplier_fees ?? true,
      // Refusée, option candidate, gratuite ou échantillon : jamais concernée
      ineligible: !isEligibleForSupplierCosts({
        id: item.id,
        quantity: item.quantity,
        unitCost: null,
        status: item.status,
        isFree: item.is_free,
        isSample: item.is_sample,
        supplierId,
      }),
    };
    const lineShipping = item.shipping_cost ?? 0;
    const known = suppliers.find(s => s.supplierId === supplierId);
    if (known) {
      known.lineCount++;
      known.lines.push(lineRef);
      known.lineShippingTotal += lineShipping;
    } else {
      suppliers.push({
        supplierId,
        supplierName: item.product?.supplier_name ?? 'Fournisseur',
        lineCount: 1,
        lines: [lineRef],
        lineShippingTotal: lineShipping,
      });
    }
  }

  // Exclusivité transport d'achat : un fournisseur qui porte une livraison
  // globale verrouille le transport de ses lignes, et inversement (Roméo 17/09).
  const suppliersWithShipping = new Set(
    (supplierCostInputs ?? [])
      .filter(
        cost => cost.shippingCostHt + cost.customsCostHt + cost.otherCostHt > 0
      )
      .map(cost => cost.supplierId)
  );

  // Exclusivité livraison client : globale OU ligne par ligne
  const globalSellingShipping = Number(
    consultation?.selling_shipping_cost_ht ?? 0
  );
  const hasLineSellingShipping = consultationItems.some(
    item => (item.selling_shipping_cost ?? 0) > 0
  );

  // Coche/décoche : une ligne décochée sort de la répartition au prorata
  const toggleLineFees = (itemId: string, carriesFees: boolean): void => {
    void updateItem(itemId, { carries_supplier_fees: carriesFees }).catch(
      err => {
        console.error(
          '[ConsultationOrderInterface] toggleLineFees failed:',
          err
        );
      }
    );
  };

  // Lignes dont le produit n'a pas de fournisseur : aucun frais ne peut leur
  // être affecté, le bloc frais le dit au lieu de les passer sous silence.
  const productsWithoutSupplier = consultationItems
    .filter(item => !item.product?.supplier_id)
    .map(item => item.product?.name ?? 'Produit');

  const total = economics.revenue;
  const totalCost = economics.cost;
  const totalShipping = economics.fees;
  const totalMargin = economics.margin;
  const totalMarginPercent = economics.marginPercent ?? 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center p-6 bg-white rounded-xl border border-zinc-100">
        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-zinc-900 mr-3" />
        <span className="text-sm text-zinc-500">Chargement...</span>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-3">
      {/* KPIs sticky header */}
      {consultationItems.length > 0 && (
        <ConsultationMarginKpis
          total={total}
          totalCost={totalCost}
          totalShipping={totalShipping}
          totalMargin={totalMargin}
          totalMarginPercent={totalMarginPercent}
          globalSellingShipping={economics.globalSellingShipping}
        />
      )}

      {/* Besoins du client et options comparées */}
      {onAddNeed && onRemoveNeed && (needs.length > 0 || hasNeedLines) && (
        <ConsultationNeedsCard
          needs={needs}
          lines={consultationItems.map(item => ({
            id: item.id,
            need_id: item.need_id ?? null,
            status: item.status,
            productName: item.product?.name ?? item.product_id,
            quantity: item.quantity,
          }))}
          economicsByItemId={economicsByItemId}
          onAdd={onAddNeed}
          onRemove={onRemoveNeed}
        />
      )}

      {/* Frais par fournisseur */}
      {onSaveSupplierCost && (
        <ConsultationSupplierCostsCard
          suppliers={suppliers}
          productsWithoutSupplier={productsWithoutSupplier}
          onToggleLineFees={toggleLineFees}
          supplierCosts={supplierCosts}
          supplierEconomics={supplierEconomics}
          unallocatedSupplierFees={economics.unallocatedSupplierFees}
          onSave={onSaveSupplierCost}
        />
      )}

      {/* Tableau produits */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-zinc-100">
        {/* Header tableau */}
        <div className="px-4 py-2.5 flex justify-between items-center bg-zinc-50/50 border-b border-zinc-100">
          <div className="min-w-0">
            <h3 className="text-xs font-bold text-zinc-700">
              Articles ({totalItems} · {total.toFixed(2)}€ HT)
            </h3>
            {hasLineSellingShipping && globalSellingShipping === 0 && (
              <p className="text-[10px] text-zinc-400">
                Livraison client saisie ligne par ligne — remets ces lignes à 0
                pour facturer une seule livraison sur toute la consultation.
              </p>
            )}
            {globalSellingShipping > 0 && (
              <p className="text-[10px] text-blue-600">
                Livraison client de {globalSellingShipping.toFixed(2)}€ pour
                toute la consultation : le transport de vente des lignes est
                verrouillé.
              </p>
            )}
          </div>
          <div className="flex gap-1">
            <button
              type="button"
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-1 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-blue-600 hover:bg-blue-50 rounded h-7"
            >
              <Plus className="h-3.5 w-3.5" />
              Ajouter
            </button>
            <button
              type="button"
              onClick={() => setShowSourcingModal(true)}
              className="flex items-center gap-1 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-zinc-500 hover:bg-zinc-100 rounded h-7"
            >
              <Sparkles className="h-3.5 w-3.5" />
              Sourcer
            </button>
          </div>
        </div>

        {/* Table dense */}
        <ConsultationProductsTable
          items={consultationItems}
          suppliersWithShipping={suppliersWithShipping}
          globalSellingShippingEntered={globalSellingShipping > 0}
          editingItem={editingItem}
          editQuantity={editQuantity}
          editPrice={editPrice}
          editNotes={editNotes}
          editShippingCost={editShippingCost}
          editSellingShippingCost={editSellingShippingCost}
          editCostPriceOverride={editCostPriceOverride}
          editIsSample={editIsSample}
          editMarginPercentage={editMarginPercentage}
          editNeedId={editNeedId}
          needs={needs}
          economicsByItemId={economicsByItemId}
          defaultMarginPercentage={
            consultation?.default_margin_percentage ?? null
          }
          tvaPercentage={resolveConsultationTvaPercentage(consultation)}
          onSetEditQuantity={setEditQuantity}
          onSetEditPrice={setEditPrice}
          onSetEditNotes={setEditNotes}
          onSetEditShippingCost={setEditShippingCost}
          onSetEditSellingShippingCost={setEditSellingShippingCost}
          onSetEditCostPriceOverride={setEditCostPriceOverride}
          onSetEditMarginPercentage={setEditMarginPercentage}
          onSetEditNeedId={setEditNeedId}
          onStartEdit={startEditItem}
          onSaveEdit={saveEditItem}
          onCancelEdit={cancelEditItem}
          onChangeQuantity={changeQuantity}
          onChangeStatus={changeLineStatus}
          onSampleChange={handleSampleChange}
          onRemove={handleRemoveItem}
        />

        {/* Footer stats + CTA Commander */}
        {consultationItems.length > 0 && (
          <div className="px-4 py-2.5 flex justify-between items-center border-t border-zinc-100 bg-zinc-50/30">
            <div className="flex items-center gap-3 text-[11px] font-medium text-zinc-500">
              <Calculator className="h-3.5 w-3.5" />
              <span>
                {totalItems} article{totalItems > 1 ? 's' : ''}
              </span>
              <span className="text-emerald-600">
                {acceptedItems.length} accepté
                {acceptedItems.length > 1 ? 's' : ''}
              </span>
              <span className="text-red-500">
                {consultationItems.filter(i => i.status === 'rejected').length}{' '}
                refusé
                {consultationItems.filter(i => i.status === 'rejected').length >
                1
                  ? 's'
                  : ''}
              </span>
              <span className="text-amber-500">
                {consultationItems.filter(i => i.status === 'pending').length}{' '}
                en attente
              </span>
            </div>
            {hasAcceptedItems && onCreatePurchaseOrder && (
              <button
                type="button"
                onClick={() => onCreatePurchaseOrder(acceptedItems)}
                className="px-3 py-1.5 bg-zinc-900 text-white text-[12px] font-bold rounded-lg flex items-center gap-1.5 hover:bg-zinc-700 active:scale-95 transition-all h-8"
              >
                <ShoppingCart className="h-3.5 w-3.5" />
                Commander ({acceptedItems.length})
              </button>
            )}
          </div>
        )}
      </div>

      {/* Modals */}
      <UniversalProductSelectorV2
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSelect={async (products: SelectedProduct[]) => {
          for (const product of products) {
            await addItem({
              consultation_id: consultationId,
              product_id: product.id,
              quantity: product.quantity ?? 1,
              unit_price: product.unit_price ?? undefined,
              is_free: false,
            });
          }
          setShowAddModal(false);
        }}
        mode="multi"
        context="consultations"
        selectedProducts={[]}
        showQuantity
        showImages
        // Raccourci : le produit n'existe pas encore → on le crée en sourcing
        // depuis le sélecteur, et il rejoint la consultation tout seul.
        onCreateSourcingProduct={() => {
          setShowAddModal(false);
          setShowSourcingModal(true);
        }}
      />

      <SourcingProductModal
        open={showSourcingModal}
        onClose={() => setShowSourcingModal(false)}
        consultationId={consultationId}
        onProductCreatedAndAdded={handleProductAdded}
      />
    </div>
  );
}

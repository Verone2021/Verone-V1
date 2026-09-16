'use client';

import { useState } from 'react';

import type {
  SourcingCandidateSupplier,
  SourcingOfferInput,
  SourcingPriceEntry,
} from '../../../hooks/sourcing/use-sourcing-notebook';
import {
  compareOffers,
  type OfferStatus,
} from '../../../utils/sourcing-offer-cost';
import { SourcingPriceHistory } from '../notebook/SourcingPriceHistory';
import { SourcingOfferForm } from './SourcingOfferForm';
import { SourcingOffersComparison } from './SourcingOffersComparison';
import { SourcingTargetPriceField } from './SourcingTargetPriceField';

export interface SourcingOffersSectionProps {
  /** Produit : repères du comparatif. */
  product: {
    supplier_id: string | null;
    cost_price: number | null;
    target_price: number | null;
    eco_tax_default: number | null;
  };
  offers: SourcingCandidateSupplier[];
  priceHistory: SourcingPriceEntry[];
  busy?: boolean;

  onAddOffer: (
    data: SourcingOfferInput & { supplier_id: string }
  ) => Promise<void>;
  onUpdateOffer: (offerId: string, data: SourcingOfferInput) => Promise<void>;
  onUpdateStatus: (offerId: string, status: OfferStatus) => void;
  onUpdateStatuses: (offerIds: string[], status: OfferStatus) => void;
  onAdoptOffer: (offerId: string) => void;
  adoptingOfferId?: string | null;

  onAddPrice: (data: {
    price: number;
    currency?: string;
    quantity?: number;
    proposed_by?: 'supplier' | 'verone';
    notes?: string;
    supplier_id?: string;
  }) => Promise<void>;
  onSaveTargetPrice: (targetPrice: number | null) => Promise<boolean>;
  savingTargetPrice?: boolean;
  onAdoptPrice: (entry: SourcingPriceEntry) => void;
  adoptingPriceId?: string | null;
}

/**
 * Étapes Évaluation et Négociation — [BO-SOURCING-OFFRES-004]
 *
 * Trois blocs qui se répondent : le prix visé, le comparatif des offres au coût
 * rendu, et l'historique de la négociation d'où l'on peut reprendre un prix.
 */
export function SourcingOffersSection({
  product,
  offers,
  priceHistory,
  busy = false,
  onAddOffer,
  onUpdateOffer,
  onUpdateStatus,
  onUpdateStatuses,
  onAdoptOffer,
  adoptingOfferId = null,
  onAddPrice,
  onSaveTargetPrice,
  savingTargetPrice = false,
  onAdoptPrice,
  adoptingPriceId = null,
}: SourcingOffersSectionProps) {
  const [formOpen, setFormOpen] = useState(false);
  const [editedOffer, setEditedOffer] =
    useState<SourcingCandidateSupplier | null>(null);
  // Compteur d'ouvertures : remonte le formulaire à neuf à chaque fois, sans
  // effet ni dépendance instable.
  const [formKey, setFormKey] = useState(0);

  const openForm = (offer: SourcingCandidateSupplier | null) => {
    setEditedOffer(offer);
    setFormKey(previous => previous + 1);
    setFormOpen(true);
  };

  const comparison = compareOffers(
    offers.map(offer => ({
      ...offer,
      quotedPrice: offer.quoted_price,
      quotedMoq: offer.quoted_moq,
      quotedShippingHt: offer.quoted_shipping_ht,
      quotedCustomsHt: offer.quoted_customs_ht,
      shippingScope: offer.shipping_scope,
      ecoTax: product.eco_tax_default,
    })),
    product.target_price
  );
  const bestLandedCost =
    comparison.find(item => item.isBest)?.cost.landedUnitCost ?? null;

  const supplierNames: Record<string, string> = {};
  for (const offer of offers) {
    supplierNames[offer.supplier_id] =
      offer.supplier?.trade_name ?? offer.supplier?.legal_name ?? 'Fournisseur';
  }

  return (
    <section aria-label="Offres et négociation" className="space-y-4">
      <SourcingTargetPriceField
        targetPrice={product.target_price}
        bestLandedCost={bestLandedCost}
        saving={savingTargetPrice}
        onSave={onSaveTargetPrice}
      />

      <SourcingOffersComparison
        comparison={comparison}
        targetPrice={product.target_price}
        currentSupplierId={product.supplier_id}
        busy={busy}
        adoptingId={adoptingOfferId}
        onAdd={() => openForm(null)}
        onEdit={offer => openForm(offer)}
        onUpdateStatus={onUpdateStatus}
        onUpdateStatuses={onUpdateStatuses}
        onAdopt={onAdoptOffer}
      />

      <SourcingPriceHistory
        priceHistory={priceHistory}
        onAdd={onAddPrice}
        currentCostPrice={product.cost_price}
        targetPrice={product.target_price}
        defaultSupplierId={product.supplier_id}
        supplierNames={supplierNames}
        onAdoptPrice={onAdoptPrice}
        adoptingPriceId={adoptingPriceId}
        busy={busy}
      />

      <SourcingOfferForm
        key={formKey}
        open={formOpen}
        onOpenChange={setFormOpen}
        offer={editedOffer}
        ecoTax={product.eco_tax_default}
        saving={busy}
        onSubmit={async data => {
          if (editedOffer !== null) {
            const { supplier_id: _ignored, ...changes } = data;
            await onUpdateOffer(editedOffer.id, changes);
            return;
          }
          await onAddOffer(data);
        }}
      />
    </section>
  );
}

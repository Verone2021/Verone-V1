'use client';

import { useState } from 'react';

import { ButtonV2 } from '@verone/ui/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@verone/ui/components/ui/dialog';
import { Input } from '@verone/ui/components/ui/input';
import { Label } from '@verone/ui/components/ui/label';

import type {
  SourcingCandidateSupplier,
  SourcingOfferInput,
} from '../../../hooks/sourcing/use-sourcing-notebook';
import { offerLandedUnitCost } from '../../../utils/sourcing-offer-cost';
import { SupplierSelector } from '../supplier-selector';

export interface SourcingOfferFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Offre à modifier ; absente = création. */
  offer?: SourcingCandidateSupplier | null;
  /** Éco-participation du produit, pour l'aperçu du coût rendu. */
  ecoTax: number | null;
  saving?: boolean;
  onSubmit: (
    data: SourcingOfferInput & { supplier_id: string }
  ) => Promise<void>;
}

interface FormState {
  supplier_id: string | null;
  quoted_price: string;
  quoted_moq: string;
  quoted_lead_days: string;
  quoted_shipping_ht: string;
  quoted_customs_ht: string;
  shipping_scope: 'per_order' | 'per_unit';
  notes: string;
}

function emptyForm(offer?: SourcingCandidateSupplier | null): FormState {
  return {
    supplier_id: offer?.supplier_id ?? null,
    quoted_price: offer?.quoted_price != null ? String(offer.quoted_price) : '',
    quoted_moq: offer?.quoted_moq != null ? String(offer.quoted_moq) : '',
    quoted_lead_days:
      offer?.quoted_lead_days != null ? String(offer.quoted_lead_days) : '',
    quoted_shipping_ht:
      offer?.quoted_shipping_ht != null ? String(offer.quoted_shipping_ht) : '',
    quoted_customs_ht:
      offer?.quoted_customs_ht != null ? String(offer.quoted_customs_ht) : '',
    shipping_scope: offer?.shipping_scope ?? 'per_order',
    notes: offer?.notes ?? '',
  };
}

function toNumber(value: string): number | null {
  const parsed = Number.parseFloat(value.replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : null;
}

function toInteger(value: string): number | null {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : null;
}

/**
 * Saisie d'une offre fournisseur — [BO-SOURCING-OFFRES-004]
 *
 * Le prix seul ne permet pas de choisir : le formulaire demande aussi le
 * transport et la douane annoncés, et montre en direct le coût rendu qui en
 * découle. Tout est facultatif sauf le fournisseur — on note ce qu'on sait,
 * quand on le sait.
 */
export function SourcingOfferForm({
  open,
  onOpenChange,
  offer = null,
  ecoTax,
  saving = false,
  onSubmit,
}: SourcingOfferFormProps) {
  const [form, setForm] = useState<FormState>(() => emptyForm(offer));
  // `key` sur le composant appelant garantit un état neuf à chaque ouverture :
  // pas d'effet, donc pas de dépendance instable.

  const patch = (changes: Partial<FormState>) =>
    setForm(previous => ({ ...previous, ...changes }));

  const apercu = offerLandedUnitCost({
    quotedPrice: toNumber(form.quoted_price),
    quotedMoq: toInteger(form.quoted_moq),
    quotedShippingHt: toNumber(form.quoted_shipping_ht),
    quotedCustomsHt: toNumber(form.quoted_customs_ht),
    shippingScope: form.shipping_scope,
    ecoTax,
  });

  const handleSubmit = () => {
    if (form.supplier_id === null) return;
    void onSubmit({
      supplier_id: form.supplier_id,
      quoted_price: toNumber(form.quoted_price),
      quoted_moq: toInteger(form.quoted_moq),
      quoted_lead_days: toInteger(form.quoted_lead_days),
      quoted_shipping_ht: toNumber(form.quoted_shipping_ht),
      quoted_customs_ht: toNumber(form.quoted_customs_ht),
      shipping_scope: form.shipping_scope,
      notes: form.notes.trim() === '' ? null : form.notes.trim(),
    })
      .then(() => onOpenChange(false))
      .catch((error: unknown) => {
        console.error('[SourcingOfferForm] enregistrement échoué:', error);
      });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="h-screen md:h-auto md:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {offer ? 'Modifier l’offre' : 'Ajouter une offre fournisseur'}
          </DialogTitle>
          <DialogDescription>
            Tout est facultatif sauf le fournisseur. Le transport et la douane
            annoncés servent à comparer les offres au coût rendu, pas au prix
            départ usine.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 space-y-4 overflow-y-auto md:max-h-[60vh]">
          <SupplierSelector
            selectedSupplierId={form.supplier_id}
            onSupplierChange={supplierId => patch({ supplier_id: supplierId })}
            disabled={saving || offer !== null}
            required
          />

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <Label htmlFor="offer_price" className="text-xs text-gray-600">
                Prix unitaire HT (€)
              </Label>
              <Input
                id="offer_price"
                type="number"
                step="0.01"
                min="0"
                className="mt-1 w-full"
                value={form.quoted_price}
                onChange={e => patch({ quoted_price: e.target.value })}
                placeholder="12.50"
              />
            </div>
            <div>
              <Label htmlFor="offer_moq" className="text-xs text-gray-600">
                Quantité minimale
              </Label>
              <Input
                id="offer_moq"
                type="number"
                min="1"
                className="mt-1 w-full"
                value={form.quoted_moq}
                onChange={e => patch({ quoted_moq: e.target.value })}
                placeholder="100"
              />
            </div>
            <div>
              <Label htmlFor="offer_lead" className="text-xs text-gray-600">
                Délai (jours)
              </Label>
              <Input
                id="offer_lead"
                type="number"
                min="0"
                className="mt-1 w-full"
                value={form.quoted_lead_days}
                onChange={e => patch({ quoted_lead_days: e.target.value })}
                placeholder="30"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <Label htmlFor="offer_shipping" className="text-xs text-gray-600">
                Transport annoncé HT (€)
              </Label>
              <Input
                id="offer_shipping"
                type="number"
                step="0.01"
                min="0"
                className="mt-1 w-full"
                value={form.quoted_shipping_ht}
                onChange={e => patch({ quoted_shipping_ht: e.target.value })}
                placeholder="250.00"
              />
            </div>
            <div>
              <Label htmlFor="offer_customs" className="text-xs text-gray-600">
                Douane annoncée HT (€)
              </Label>
              <Input
                id="offer_customs"
                type="number"
                step="0.01"
                min="0"
                className="mt-1 w-full"
                value={form.quoted_customs_ht}
                onChange={e => patch({ quoted_customs_ht: e.target.value })}
                placeholder="50.00"
              />
            </div>
            <div>
              <Label htmlFor="offer_scope" className="text-xs text-gray-600">
                Ces frais valent
              </Label>
              <select
                id="offer_scope"
                className="mt-1 h-10 w-full rounded-md border border-gray-300 bg-white px-3 text-sm"
                value={form.shipping_scope}
                onChange={e =>
                  patch({
                    shipping_scope:
                      e.target.value === 'per_unit' ? 'per_unit' : 'per_order',
                  })
                }
              >
                <option value="per_order">
                  pour toute la commande minimale
                </option>
                <option value="per_unit">par unité</option>
              </select>
            </div>
          </div>

          <div>
            <Label htmlFor="offer_notes" className="text-xs text-gray-600">
              Notes
            </Label>
            <Input
              id="offer_notes"
              className="mt-1 w-full"
              value={form.notes}
              onChange={e => patch({ notes: e.target.value })}
              placeholder="Conditions, incoterm, remarques…"
            />
          </div>

          {apercu.landedUnitCost !== null && (
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm">
              <p className="font-medium text-black">
                Coût rendu :{' '}
                {apercu.landedUnitCost.toLocaleString('fr-FR', {
                  style: 'currency',
                  currency: 'EUR',
                })}{' '}
                / unité
              </p>
              <p className="mt-1 text-xs text-gray-600">
                {form.quoted_price || '0'} € de prix
                {ecoTax != null && ecoTax > 0
                  ? ` + ${ecoTax} € d’éco-part`
                  : ''}
                {apercu.hasFees
                  ? ` + ${apercu.feesPerUnit.toLocaleString('fr-FR', {
                      minimumFractionDigits: 2,
                    })} € de frais${
                      form.shipping_scope === 'per_order'
                        ? ` (répartis sur ${apercu.quantity} unité${apercu.quantity > 1 ? 's' : ''})`
                        : ''
                    }`
                  : ''}
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="flex-col gap-2 md:flex-row">
          <ButtonV2
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={saving}
            className="w-full md:w-auto"
          >
            Annuler
          </ButtonV2>
          <ButtonV2
            variant="primary"
            onClick={handleSubmit}
            disabled={saving || form.supplier_id === null}
            className="w-full md:w-auto"
          >
            {offer ? 'Enregistrer' : 'Ajouter'}
          </ButtonV2>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

'use client';

import type { Organisation } from '@verone/organisations/hooks';
import { EcoTaxVatInput } from '@verone/ui';
import { Card, CardContent, CardHeader, CardTitle } from '@verone/ui';
import { Input } from '@verone/ui';
import { Label } from '@verone/ui';
import { Textarea } from '@verone/ui';

import { paymentTermsOptions } from '../constants';
import { CreateOrganisationModal } from '../../create-organisation-modal';
import { SupplierSelector } from '../../supplier-selector';

interface GeneralInfoCardProps {
  isEditMode: boolean;
  isBlocked: boolean;
  loading: boolean;
  selectedSupplierId: string;
  selectedSupplier: Organisation | null;
  expectedDeliveryDate: string;
  deliveryAddress: string;
  notes: string;
  ecoTaxVatRate: number | null;
  paymentTerms: string;
  onSupplierChange: (id: string | null) => void;
  onSupplierCreated: (supplierId: string, supplierName: string) => void;
  onExpectedDeliveryDateChange: (value: string) => void;
  onDeliveryAddressChange: (value: string) => void;
  onNotesChange: (value: string) => void;
  onEcoTaxVatRateChange: (value: number | null) => void;
}

export function GeneralInfoCard({
  isEditMode,
  isBlocked,
  loading,
  selectedSupplierId,
  selectedSupplier,
  expectedDeliveryDate,
  deliveryAddress,
  notes,
  ecoTaxVatRate,
  paymentTerms,
  onSupplierChange,
  onSupplierCreated,
  onExpectedDeliveryDateChange,
  onDeliveryAddressChange,
  onNotesChange,
  onEcoTaxVatRateChange,
}: GeneralInfoCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Informations générales</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <div className="flex gap-2">
            <div className="flex-1">
              <SupplierSelector
                selectedSupplierId={selectedSupplierId || null}
                onSupplierChange={onSupplierChange}
                disabled={loading || isBlocked}
                required
                label="Fournisseur"
                placeholder="Sélectionner un fournisseur..."
              />
            </div>
            {!isEditMode && (
              <CreateOrganisationModal
                onOrganisationCreated={(...args) => {
                  void onSupplierCreated(...args);
                }}
                defaultType="supplier"
              />
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="deliveryDate">Date de livraison prévue</Label>
          <Input
            id="deliveryDate"
            type="date"
            value={expectedDeliveryDate}
            onChange={e => onExpectedDeliveryDateChange(e.target.value)}
            disabled={isBlocked}
          />
        </div>

        <div className="space-y-2 col-span-2">
          <Label htmlFor="deliveryAddress">
            Adresse de livraison (Entrepôt)
          </Label>
          <Textarea
            id="deliveryAddress"
            value={deliveryAddress}
            onChange={e => onDeliveryAddressChange(e.target.value)}
            className="min-h-[100px] resize-none"
            disabled={isBlocked}
          />
        </div>

        <div className="col-span-2">
          <EcoTaxVatInput
            value={ecoTaxVatRate}
            onChange={onEcoTaxVatRateChange}
            defaultTaxRate={20}
            disabled={isBlocked}
          />
        </div>

        {/* Conditions de paiement READ-ONLY (héritées de l'organisation) */}
        <div className="space-y-2 col-span-2">
          <Label>Conditions de paiement</Label>
          {paymentTerms ? (
            <div className="bg-green-50 p-3 rounded-lg border border-green-200">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs text-green-600 font-medium mb-1">
                    CONDITIONS NEGOCIEES
                  </div>
                  <div className="text-sm font-semibold text-green-800">
                    {paymentTermsOptions.find(opt => opt.value === paymentTerms)
                      ?.label ?? paymentTerms}
                  </div>
                </div>
              </div>
              <p className="text-xs text-green-600 mt-2">
                Héritées de la fiche fournisseur (non modifiables)
              </p>
            </div>
          ) : (
            <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 text-center">
              <p className="text-sm text-gray-500">
                {selectedSupplier
                  ? 'Aucune condition définie pour ce fournisseur'
                  : 'Sélectionnez un fournisseur pour afficher les conditions'}
              </p>
            </div>
          )}
        </div>

        <div className="space-y-2 col-span-2">
          <Label htmlFor="notes">Notes</Label>
          <Textarea
            id="notes"
            placeholder="Notes additionnelles..."
            value={notes}
            onChange={e => onNotesChange(e.target.value)}
            className="min-h-[80px]"
            disabled={isBlocked}
          />
        </div>
      </CardContent>
    </Card>
  );
}

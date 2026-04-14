'use client';

/**
 * ValidationStep - Étape 7 du formulaire de commande
 *
 * Récapitulatif en sections accordéon :
 * Restaurant, Sélection, Produits, Contacts, Livraison, Totaux
 *
 * @module ValidationStep
 * @since 2026-01-20
 * @updated 2026-04-14 - Refactoring: extraction sous-composants
 */

import { useState } from 'react';

import Image from 'next/image';

import { Card, Checkbox, Label } from '@verone/ui';
import {
  Store,
  ListChecks,
  Package,
  Truck,
  CheckCircle,
  MapPin,
  Calendar,
  Loader2 as _Loader2,
} from 'lucide-react';

import type {
  OrderFormData,
  DeliveryStepData,
} from '../schemas/order-form.schema';
import { ValidationSectionWrapper } from './validation/ValidationSectionWrapper';
import { ValidationContactsSection } from './validation/ValidationContactsSection';
import { ValidationTotalsSection } from './validation/ValidationTotalsSection';

// ============================================================================
// TYPES
// ============================================================================

interface ValidationStepProps {
  formData: OrderFormData;
  errors: string[];
  cartTotals: {
    totalHT: number;
    totalTVA: number;
    totalTTC: number;
    totalCommission: number;
    itemsCount: number;
    effectiveTaxRate: number;
  };
  onSubmit: () => Promise<void>;
  onUpdateDelivery: (data: Partial<DeliveryStepData>) => void;
  isSubmitting: boolean;
}

// ============================================================================
// HELPERS
// ============================================================================

function formatCurrency(value: number): string {
  return value.toLocaleString('fr-FR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function getOwnershipLabel(type: string | null): string {
  switch (type) {
    case 'succursale':
      return 'Restaurant propre';
    case 'franchise':
      return 'Franchise';
    default:
      return 'Non défini';
  }
}

// ============================================================================
// COMPONENT
// ============================================================================

export function ValidationStep({
  formData,
  errors: _errors,
  cartTotals,
  onSubmit: _onSubmit,
  onUpdateDelivery,
  isSubmitting: _isSubmitting,
}: ValidationStepProps) {
  const [openSections, setOpenSections] = useState<string[]>([
    'restaurant',
    'products',
    'totals',
  ]);

  const toggleSection = (section: string) => {
    setOpenSections(prev =>
      prev.includes(section)
        ? prev.filter(s => s !== section)
        : [...prev, section]
    );
  };

  const restaurantName =
    formData.restaurant.mode === 'existing'
      ? formData.restaurant.existingName
      : formData.restaurant.newRestaurant?.tradeName;

  const restaurantCity =
    formData.restaurant.mode === 'existing'
      ? formData.restaurant.existingCity
      : formData.restaurant.newRestaurant?.city;

  const restaurantType =
    formData.restaurant.mode === 'existing'
      ? formData.restaurant.existingOwnershipType
      : formData.restaurant.newRestaurant?.ownershipType;

  return (
    <div className="space-y-4">
      {/* Message de confirmation */}
      <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
        <div className="flex items-start gap-3">
          <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-green-800">
              Récapitulatif de votre commande
            </h3>
            <p className="text-sm text-green-700 mt-1">
              Vérifiez les informations ci-dessous avant de confirmer.
            </p>
          </div>
        </div>
      </div>

      {/* Section 1: Restaurant */}
      <ValidationSectionWrapper
        sectionKey="restaurant"
        title="Restaurant"
        subtitle={restaurantName ?? undefined}
        icon={Store}
        iconBgClass="bg-blue-100"
        iconColorClass="text-blue-600"
        isOpen={openSections.includes('restaurant')}
        onToggle={() => toggleSection('restaurant')}
      >
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <Store className="h-4 w-4 text-gray-400" />
            <span className="text-gray-600">Nom :</span>
            <span className="font-medium">{restaurantName}</span>
            <span
              className={
                restaurantType === 'succursale'
                  ? 'ml-2 px-2 py-0.5 text-xs font-medium rounded bg-blue-100 text-blue-700'
                  : 'ml-2 px-2 py-0.5 text-xs font-medium rounded bg-amber-100 text-amber-700'
              }
            >
              {getOwnershipLabel(restaurantType ?? null)}
            </span>
          </div>
          {restaurantCity && (
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="h-4 w-4 text-gray-400" />
              <span className="text-gray-600">Ville :</span>
              <span className="font-medium">{restaurantCity}</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-sm">
            <span className="text-gray-500 text-xs">
              {formData.restaurant.mode === 'new'
                ? '(Nouveau restaurant à créer)'
                : '(Restaurant existant)'}
            </span>
          </div>
        </div>
      </ValidationSectionWrapper>

      {/* Section 2: Sélection */}
      <ValidationSectionWrapper
        sectionKey="selection"
        title="Sélection"
        subtitle={formData.selection.selectionName}
        icon={ListChecks}
        iconBgClass="bg-purple-100"
        iconColorClass="text-purple-600"
        isOpen={openSections.includes('selection')}
        onToggle={() => toggleSection('selection')}
      >
        <div className="flex items-center gap-2 text-sm">
          <Package className="h-4 w-4 text-gray-400" />
          <span className="text-gray-600">
            {formData.selection.productsCount} produits disponibles
          </span>
        </div>
      </ValidationSectionWrapper>

      {/* Section 3: Produits */}
      <ValidationSectionWrapper
        sectionKey="products"
        title="Produits"
        subtitle={`${cartTotals.itemsCount} article${cartTotals.itemsCount > 1 ? 's' : ''} • ${formatCurrency(cartTotals.totalHT)} € HT`}
        icon={Package}
        iconBgClass="bg-linkme-turquoise/10"
        iconColorClass="text-linkme-turquoise"
        isOpen={openSections.includes('products')}
        onToggle={() => toggleSection('products')}
      >
        <div className="space-y-3">
          {formData.cart.items.map(item => (
            <div
              key={item.selectionItemId}
              className="flex items-center gap-3 py-2 border-b last:border-b-0"
            >
              <div className="w-12 h-12 bg-gray-100 rounded overflow-hidden flex-shrink-0 relative">
                {item.productImage ? (
                  <Image
                    src={item.productImage}
                    alt={item.productName}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Package className="h-6 w-6 text-gray-300" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 text-sm truncate">
                  {item.productName}
                </p>
                <p className="text-xs text-gray-500">
                  {item.quantity} × {formatCurrency(item.unitPriceHt)} € HT
                </p>
              </div>
              <div className="text-right">
                <p className="font-medium text-gray-900 text-sm">
                  {formatCurrency(item.unitPriceHt * item.quantity)} €
                </p>
              </div>
            </div>
          ))}
        </div>
      </ValidationSectionWrapper>

      {/* Section 4: Contacts */}
      <ValidationContactsSection
        formData={formData}
        isOpen={openSections.includes('contacts')}
        onToggle={() => toggleSection('contacts')}
      />

      {/* Section 5: Livraison */}
      <ValidationSectionWrapper
        sectionKey="delivery"
        title="Livraison"
        subtitle={formData.delivery.city || 'Non renseigné'}
        icon={Truck}
        iconBgClass="bg-green-100"
        iconColorClass="text-green-600"
        isOpen={openSections.includes('delivery')}
        onToggle={() => toggleSection('delivery')}
      >
        <div className="space-y-2">
          {formData.delivery.address ? (
            <div className="flex items-start gap-2 text-sm">
              <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
              <div>
                <p className="text-gray-900">{formData.delivery.address}</p>
                <p className="text-gray-600">
                  {formData.delivery.postalCode} {formData.delivery.city}
                </p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-400 italic">
              Adresse non renseignée — à compléter ultérieurement
            </p>
          )}
          {formData.delivery.desiredDate && (
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-gray-400" />
              <span className="text-gray-600">Date souhaitée :</span>
              <span className="font-medium">
                {new Date(formData.delivery.desiredDate).toLocaleDateString(
                  'fr-FR',
                  { day: 'numeric', month: 'long', year: 'numeric' }
                )}
              </span>
            </div>
          )}
          {formData.delivery.isMallDelivery && (
            <div className="text-sm text-amber-600 mt-2">
              Livraison en centre commercial
            </div>
          )}
        </div>
      </ValidationSectionWrapper>

      {/* Section 6: Totaux */}
      <ValidationTotalsSection
        cartTotals={cartTotals}
        isOpen={openSections.includes('totals')}
        onToggle={() => toggleSection('totals')}
        formatCurrency={formatCurrency}
      />

      {/* Conditions de livraison */}
      <Card className="p-5">
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <Checkbox
              id="deliveryTermsAccepted"
              checked={formData.delivery.deliveryTermsAccepted}
              onCheckedChange={(checked: boolean) =>
                onUpdateDelivery({ deliveryTermsAccepted: checked })
              }
            />
            <div>
              <Label
                htmlFor="deliveryTermsAccepted"
                className="text-sm font-medium cursor-pointer"
              >
                J&apos;accepte les conditions generales de livraison{' '}
                <span className="text-red-500">*</span>
              </Label>
              <p className="text-xs text-gray-500 mt-1">
                En cochant cette case, vous confirmez avoir pris connaissance
                des conditions de livraison et les accepter.
              </p>
            </div>
          </div>
          {!formData.delivery.deliveryTermsAccepted && (
            <p className="text-xs text-amber-600 ml-7">
              Vous devez accepter les conditions de livraison pour valider la
              commande.
            </p>
          )}
        </div>
      </Card>

      {/* Info transport */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-start gap-3">
          <Truck className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-medium">Frais de transport</p>
            <p className="mt-1">
              Le montant affich&#233; correspond uniquement aux produits. Les
              frais de transport seront calcul&#233;s ult&#233;rieurement.
            </p>
          </div>
        </div>
      </div>

      {/* Note importante */}
      <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
        <div className="flex items-start gap-3">
          <CheckCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-amber-800">
            <p className="font-medium">Prochaine &#233;tape</p>
            <p className="mt-1">
              Apr&#232;s validation, votre commande sera soumise &#224; notre
              &#233;quipe pour approbation.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ValidationStep;

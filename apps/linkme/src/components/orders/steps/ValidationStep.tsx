'use client';

/**
 * ValidationStep - Étape 7 du formulaire de commande
 *
 * Récapitulatif complet en sections accordéon :
 * 1. Restaurant
 * 2. Sélection utilisée
 * 3. Produits (liste résumée)
 * 4. Contacts
 * 5. Livraison
 * 6. Facturation (totaux)
 *
 * @module ValidationStep
 * @since 2026-01-20
 */

import { useState } from 'react';

import Image from 'next/image';

import {
  Card,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  cn,
} from '@verone/ui';
import {
  Store,
  ListChecks,
  Package,
  Users,
  Truck,
  Calculator,
  ChevronDown,
  CheckCircle,
  MapPin,
  User,
  FileText,
  Calendar,
  Coins,
  Loader2,
} from 'lucide-react';

import type { OrderFormData } from '../schemas/order-form.schema';

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
  errors,
  cartTotals,
  onSubmit,
  isSubmitting,
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

  // Données du restaurant
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
              Vérifiez les informations ci-dessous avant de confirmer. Vous
              pouvez revenir aux étapes précédentes pour modifier si nécessaire.
            </p>
          </div>
        </div>
      </div>

      {/* Section 1: Restaurant */}
      <Collapsible
        open={openSections.includes('restaurant')}
        onOpenChange={() => toggleSection('restaurant')}
      >
        <Card className="overflow-hidden">
          <CollapsibleTrigger asChild>
            <button
              type="button"
              className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <Store className="h-5 w-5 text-blue-600" />
                </div>
                <div className="text-left">
                  <h3 className="font-semibold text-gray-900">Restaurant</h3>
                  <p className="text-sm text-gray-500">{restaurantName}</p>
                </div>
              </div>
              <ChevronDown
                className={cn(
                  'h-5 w-5 text-gray-400 transition-transform',
                  openSections.includes('restaurant') && 'rotate-180'
                )}
              />
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="p-4 pt-0 border-t space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Store className="h-4 w-4 text-gray-400" />
                <span className="text-gray-600">Nom :</span>
                <span className="font-medium">{restaurantName}</span>
                <span
                  className={cn(
                    'ml-2 px-2 py-0.5 text-xs font-medium rounded',
                    restaurantType === 'succursale'
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-amber-100 text-amber-700'
                  )}
                >
                  {getOwnershipLabel(restaurantType || null)}
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
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Section 2: Sélection */}
      <Collapsible
        open={openSections.includes('selection')}
        onOpenChange={() => toggleSection('selection')}
      >
        <Card className="overflow-hidden">
          <CollapsibleTrigger asChild>
            <button
              type="button"
              className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                  <ListChecks className="h-5 w-5 text-purple-600" />
                </div>
                <div className="text-left">
                  <h3 className="font-semibold text-gray-900">Sélection</h3>
                  <p className="text-sm text-gray-500">
                    {formData.selection.selectionName}
                  </p>
                </div>
              </div>
              <ChevronDown
                className={cn(
                  'h-5 w-5 text-gray-400 transition-transform',
                  openSections.includes('selection') && 'rotate-180'
                )}
              />
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="p-4 pt-0 border-t">
              <div className="flex items-center gap-2 text-sm">
                <Package className="h-4 w-4 text-gray-400" />
                <span className="text-gray-600">
                  {formData.selection.productsCount} produits disponibles
                </span>
              </div>
            </div>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Section 3: Produits */}
      <Collapsible
        open={openSections.includes('products')}
        onOpenChange={() => toggleSection('products')}
      >
        <Card className="overflow-hidden">
          <CollapsibleTrigger asChild>
            <button
              type="button"
              className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-linkme-turquoise/10 flex items-center justify-center">
                  <Package className="h-5 w-5 text-linkme-turquoise" />
                </div>
                <div className="text-left">
                  <h3 className="font-semibold text-gray-900">Produits</h3>
                  <p className="text-sm text-gray-500">
                    {cartTotals.itemsCount} article
                    {cartTotals.itemsCount > 1 ? 's' : ''} •{' '}
                    {formatCurrency(cartTotals.totalHT)} € HT
                  </p>
                </div>
              </div>
              <ChevronDown
                className={cn(
                  'h-5 w-5 text-gray-400 transition-transform',
                  openSections.includes('products') && 'rotate-180'
                )}
              />
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="p-4 pt-0 border-t">
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
                        {item.quantity} × {formatCurrency(item.unitPriceHt)} €
                        HT
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
            </div>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Section 4: Contacts */}
      <Collapsible
        open={openSections.includes('contacts')}
        onOpenChange={() => toggleSection('contacts')}
      >
        <Card className="overflow-hidden">
          <CollapsibleTrigger asChild>
            <button
              type="button"
              className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                  <Users className="h-5 w-5 text-amber-600" />
                </div>
                <div className="text-left">
                  <h3 className="font-semibold text-gray-900">Contacts</h3>
                  <p className="text-sm text-gray-500">
                    {formData.contacts.responsable.firstName}{' '}
                    {formData.contacts.responsable.lastName}
                  </p>
                </div>
              </div>
              <ChevronDown
                className={cn(
                  'h-5 w-5 text-gray-400 transition-transform',
                  openSections.includes('contacts') && 'rotate-180'
                )}
              />
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="p-4 pt-0 border-t space-y-4">
              {/* Responsable */}
              <div>
                <div className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                  <User className="h-4 w-4" />
                  Responsable
                </div>
                <p className="text-sm text-gray-600 ml-6">
                  {formData.contacts.responsable.firstName}{' '}
                  {formData.contacts.responsable.lastName}
                  <br />
                  {formData.contacts.responsable.email}
                </p>
              </div>

              {/* Facturation */}
              <div>
                <div className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                  <FileText className="h-4 w-4" />
                  Facturation
                </div>
                <p className="text-sm text-gray-600 ml-6">
                  {formData.contacts.billing.sameAsResponsable
                    ? 'Même contact que responsable'
                    : formData.contacts.billing.useParentOrg
                      ? 'Organisation mère'
                      : `${formData.contacts.billing.contact?.firstName} ${formData.contacts.billing.contact?.lastName}`}
                </p>
              </div>

              {/* Livraison */}
              <div>
                <div className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                  <Truck className="h-4 w-4" />
                  Livraison
                </div>
                <p className="text-sm text-gray-600 ml-6">
                  {formData.contacts.delivery.sameAsResponsable
                    ? 'Même contact que responsable'
                    : `${formData.contacts.delivery.contact?.firstName} ${formData.contacts.delivery.contact?.lastName}`}
                </p>
              </div>
            </div>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Section 5: Livraison */}
      <Collapsible
        open={openSections.includes('delivery')}
        onOpenChange={() => toggleSection('delivery')}
      >
        <Card className="overflow-hidden">
          <CollapsibleTrigger asChild>
            <button
              type="button"
              className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                  <Truck className="h-5 w-5 text-green-600" />
                </div>
                <div className="text-left">
                  <h3 className="font-semibold text-gray-900">Livraison</h3>
                  <p className="text-sm text-gray-500">
                    {formData.delivery.city}
                  </p>
                </div>
              </div>
              <ChevronDown
                className={cn(
                  'h-5 w-5 text-gray-400 transition-transform',
                  openSections.includes('delivery') && 'rotate-180'
                )}
              />
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="p-4 pt-0 border-t space-y-2">
              <div className="flex items-start gap-2 text-sm">
                <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-gray-900">{formData.delivery.address}</p>
                  <p className="text-gray-600">
                    {formData.delivery.postalCode} {formData.delivery.city}
                  </p>
                </div>
              </div>
              {formData.delivery.desiredDate && (
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-600">Date souhaitée :</span>
                  <span className="font-medium">
                    {new Date(formData.delivery.desiredDate).toLocaleDateString(
                      'fr-FR',
                      {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      }
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
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Section 6: Totaux */}
      <Collapsible
        open={openSections.includes('totals')}
        onOpenChange={() => toggleSection('totals')}
      >
        <Card className="overflow-hidden border-2 border-linkme-turquoise/30">
          <CollapsibleTrigger asChild>
            <button
              type="button"
              className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-linkme-turquoise/10 flex items-center justify-center">
                  <Calculator className="h-5 w-5 text-linkme-turquoise" />
                </div>
                <div className="text-left">
                  <h3 className="font-semibold text-gray-900">Total</h3>
                  <p className="text-lg font-bold text-linkme-turquoise">
                    {formatCurrency(cartTotals.totalTTC)} € TTC
                  </p>
                </div>
              </div>
              <ChevronDown
                className={cn(
                  'h-5 w-5 text-gray-400 transition-transform',
                  openSections.includes('totals') && 'rotate-180'
                )}
              />
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="p-4 pt-0 border-t space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Total HT</span>
                <span className="font-medium">
                  {formatCurrency(cartTotals.totalHT)} €
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">
                  {cartTotals.effectiveTaxRate === 0
                    ? 'TVA (0%) - Export'
                    : `TVA (${Math.round(cartTotals.effectiveTaxRate * 100)}%)`}
                </span>
                <span className="font-medium">
                  {formatCurrency(cartTotals.totalTVA)} €
                </span>
              </div>
              <div className="flex justify-between pt-2 border-t">
                <span className="font-semibold">Total TTC</span>
                <span className="text-xl font-bold">
                  {formatCurrency(cartTotals.totalTTC)} €
                </span>
              </div>

              {/* Commission */}
              <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Coins className="h-5 w-5 text-green-600" />
                    <span className="font-medium text-green-800">
                      Votre commission
                    </span>
                  </div>
                  <span className="text-lg font-bold text-green-700">
                    +{formatCurrency(cartTotals.totalCommission)} € HT
                  </span>
                </div>
              </div>
            </div>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Note importante */}
      <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
        <div className="flex items-start gap-3">
          <CheckCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-amber-800">
            <p className="font-medium">Prochaine étape</p>
            <p className="mt-1">
              Après validation, votre commande sera soumise à notre équipe pour
              approbation. Vous recevrez une confirmation par email.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ValidationStep;

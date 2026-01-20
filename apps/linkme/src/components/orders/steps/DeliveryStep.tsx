'use client';

/**
 * DeliveryStep - Étape 6 du formulaire de commande
 *
 * Contient :
 * - Adresse de livraison
 * - Date souhaitée
 * - Options (centre commercial, semi-remorque, formulaire d'accès)
 * - Notes
 *
 * @module DeliveryStep
 * @since 2026-01-20
 */

import { useEffect } from 'react';

import { Card, Input, Label, Textarea, Switch, cn } from '@verone/ui';
import {
  Truck,
  MapPin,
  Calendar,
  Building2,
  FileUp,
  MessageSquare,
  AlertCircle,
} from 'lucide-react';

import type { OrderFormData, DeliveryStepData } from '../schemas/order-form.schema';

// ============================================================================
// TYPES
// ============================================================================

interface DeliveryStepProps {
  formData: OrderFormData;
  errors: string[];
  onUpdate: (data: Partial<DeliveryStepData>) => void;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function DeliveryStep({ formData, errors, onUpdate }: DeliveryStepProps) {
  const delivery = formData.delivery;

  // Auto-remplir depuis le restaurant si adresse disponible
  useEffect(() => {
    // Si nouveau restaurant et adresse renseignée, auto-fill
    if (
      formData.restaurant.mode === 'new' &&
      formData.restaurant.newRestaurant &&
      !delivery.address &&
      !delivery.city
    ) {
      const newResto = formData.restaurant.newRestaurant;
      if (newResto.city) {
        onUpdate({
          address: newResto.address || '',
          postalCode: newResto.postalCode || '',
          city: newResto.city,
        });
      }
    }
  }, [formData.restaurant, delivery.address, delivery.city, onUpdate]);

  // Handlers
  const handleChange = (field: keyof DeliveryStepData, value: any) => {
    onUpdate({ [field]: value });
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    onUpdate({
      desiredDate: value ? new Date(value) : null,
    });
  };

  // Format date pour l'input
  const formatDateForInput = (date: Date | null | undefined): string => {
    if (!date) return '';
    const d = new Date(date);
    return d.toISOString().split('T')[0];
  };

  return (
    <div className="space-y-6">
      {/* Adresse de livraison */}
      <Card className="p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
            <MapPin className="h-5 w-5 text-purple-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Adresse de livraison</h3>
            <p className="text-sm text-gray-500">
              Où souhaitez-vous être livré ?
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="address">
              Adresse <span className="text-red-500">*</span>
            </Label>
            <Input
              id="address"
              type="text"
              value={delivery.address}
              onChange={(e) => handleChange('address', e.target.value)}
              placeholder="123 rue de la Paix"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="postalCode">
                Code postal <span className="text-red-500">*</span>
              </Label>
              <Input
                id="postalCode"
                type="text"
                value={delivery.postalCode}
                onChange={(e) => handleChange('postalCode', e.target.value)}
                placeholder="75001"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="city">
                Ville <span className="text-red-500">*</span>
              </Label>
              <Input
                id="city"
                type="text"
                value={delivery.city}
                onChange={(e) => handleChange('city', e.target.value)}
                placeholder="Paris"
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Date souhaitée */}
      <Card className="p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
            <Calendar className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Date de livraison souhaitée</h3>
            <p className="text-sm text-gray-500">Optionnel - Sous réserve de disponibilité</p>
          </div>
        </div>

        <div className="space-y-2">
          <Input
            id="desiredDate"
            type="date"
            value={formatDateForInput(delivery.desiredDate)}
            onChange={handleDateChange}
            min={new Date().toISOString().split('T')[0]}
          />
          <p className="text-xs text-gray-500">
            La date finale sera confirmée par notre équipe après validation de la commande.
          </p>
        </div>
      </Card>

      {/* Options de livraison */}
      <Card className="p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
            <Truck className="h-5 w-5 text-amber-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Options de livraison</h3>
            <p className="text-sm text-gray-500">
              Informations complémentaires pour faciliter la livraison
            </p>
          </div>
        </div>

        <div className="space-y-6">
          {/* Centre commercial */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Building2 className="h-5 w-5 text-gray-400" />
                <div>
                  <Label htmlFor="isMallDelivery" className="cursor-pointer">
                    Livraison en centre commercial
                  </Label>
                  <p className="text-xs text-gray-500">
                    Nécessite une coordination avec le centre
                  </p>
                </div>
              </div>
              <Switch
                id="isMallDelivery"
                checked={delivery.isMallDelivery}
                onCheckedChange={(checked) => handleChange('isMallDelivery', checked)}
              />
            </div>

            {delivery.isMallDelivery && (
              <div className="ml-8 p-4 bg-amber-50 border border-amber-200 rounded-lg space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="mallEmail">
                    Email du centre commercial <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="mallEmail"
                    type="email"
                    value={delivery.mallEmail || ''}
                    onChange={(e) => handleChange('mallEmail', e.target.value)}
                    placeholder="livraison@centre-commercial.fr"
                  />
                  <p className="text-xs text-amber-700">
                    Nous contacterons le centre pour organiser la livraison.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Semi-remorque */}
          <div className="flex items-center justify-between pt-4 border-t">
            <div className="flex items-center gap-3">
              <Truck className="h-5 w-5 text-gray-400" />
              <div>
                <Label htmlFor="semiTrailerAccessible" className="cursor-pointer">
                  Accès semi-remorque possible
                </Label>
                <p className="text-xs text-gray-500">
                  Le site permet l&apos;accès aux grands véhicules
                </p>
              </div>
            </div>
            <Switch
              id="semiTrailerAccessible"
              checked={delivery.semiTrailerAccessible}
              onCheckedChange={(checked) => handleChange('semiTrailerAccessible', checked)}
            />
          </div>

          {/* Formulaire d'accès */}
          <div className="pt-4 border-t">
            <div className="flex items-center gap-3 mb-3">
              <FileUp className="h-5 w-5 text-gray-400" />
              <div>
                <Label>Formulaire d&apos;accès</Label>
                <p className="text-xs text-gray-500">
                  Téléchargez un document si nécessaire (PDF, max 5Mo)
                </p>
              </div>
            </div>
            <input
              type="file"
              accept=".pdf"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  if (file.size > 5 * 1024 * 1024) {
                    alert('Le fichier est trop volumineux (max 5Mo)');
                    return;
                  }
                  handleChange('accessFormFile', file);
                }
              }}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-linkme-turquoise/10 file:text-linkme-turquoise hover:file:bg-linkme-turquoise/20 cursor-pointer"
            />
            {delivery.accessFormFile && (
              <p className="mt-2 text-sm text-green-600">
                Fichier sélectionné : {(delivery.accessFormFile as File).name}
              </p>
            )}
          </div>
        </div>
      </Card>

      {/* Notes */}
      <Card className="p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
            <MessageSquare className="h-5 w-5 text-gray-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Notes complémentaires</h3>
            <p className="text-sm text-gray-500">
              Instructions particulières pour la livraison
            </p>
          </div>
        </div>

        <Textarea
          id="notes"
          value={delivery.notes || ''}
          onChange={(e) => handleChange('notes', e.target.value)}
          placeholder="Ex: Livraison par l'entrée de service, interphone code 1234..."
          rows={4}
        />
      </Card>

      {/* Info */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-700">
            <p className="font-medium">Bon à savoir</p>
            <p className="mt-1">
              Notre équipe vous contactera pour confirmer les détails de livraison
              une fois la commande validée. Les délais standards sont de 2 à 4
              semaines selon les produits.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DeliveryStep;

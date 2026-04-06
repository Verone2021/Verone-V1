'use client';

import {
  Card,
  Input,
  Label,
  RadioGroup,
  RadioGroupItem,
  AddressAutocomplete,
  type AddressResult,
} from '@verone/ui';
import { MapPin, FileText, Upload, User } from 'lucide-react';

import type {
  OrderFormData,
  RestaurantStepData,
} from '../../../schemas/order-form.schema';

interface DetectedCountry {
  code: string;
  name: string;
}

interface NewRestaurantFormProps {
  formData: OrderFormData;
  detectedCountry: DetectedCountry | null;
  onFieldChange: (field: string, value: string) => void;
  onAddressSelect: (address: AddressResult) => void;
  onUpdate: (data: Partial<RestaurantStepData>) => void;
}

export function NewRestaurantForm({
  formData,
  detectedCountry,
  onFieldChange,
  onAddressSelect,
  onUpdate,
}: NewRestaurantFormProps) {
  const newRestaurant = formData.restaurant.newRestaurant;

  return (
    <Card className="p-6">
      <div className="space-y-6">
        {/* Type de propriété */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">
            Type de restaurant <span className="text-red-500">*</span>
          </Label>
          <RadioGroup
            value={newRestaurant?.ownershipType ?? ''}
            onValueChange={value => onFieldChange('ownershipType', value)}
            className="flex gap-4"
          >
            <div className="flex items-center gap-2">
              <RadioGroupItem value="succursale" id="type-succursale" />
              <Label
                htmlFor="type-succursale"
                className="flex items-center gap-2 cursor-pointer"
              >
                <div className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded">
                  Propre
                </div>
                <span className="text-sm text-gray-600">
                  Restaurant en propre
                </span>
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <RadioGroupItem value="franchise" id="type-franchise" />
              <Label
                htmlFor="type-franchise"
                className="flex items-center gap-2 cursor-pointer"
              >
                <div className="px-2 py-1 bg-amber-100 text-amber-700 text-xs font-medium rounded">
                  Franchise
                </div>
                <span className="text-sm text-gray-600">
                  Restaurant franchisé
                </span>
              </Label>
            </div>
          </RadioGroup>
        </div>

        {/* Nom commercial */}
        <div className="space-y-2">
          <Label htmlFor="tradeName">
            Nom commercial <span className="text-red-500">*</span>
          </Label>
          <Input
            id="tradeName"
            type="text"
            placeholder="Ex: Restaurant La Belle Vue"
            value={newRestaurant?.tradeName ?? ''}
            onChange={e => onFieldChange('tradeName', e.target.value)}
          />
        </div>

        {/* Adresse avec autocomplétion */}
        <AddressAutocomplete
          label="Adresse du restaurant"
          placeholder="Rechercher une adresse..."
          onSelect={onAddressSelect}
          value={newRestaurant?.address ?? ''}
          onChange={value => onFieldChange('address', value)}
        />

        {/* Pays détecté avec badge TVA */}
        {detectedCountry && (
          <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="h-4 w-4 text-gray-500" />
              <span className="text-gray-600">Pays détecté :</span>
              <span className="font-medium">{detectedCountry.name}</span>
              {detectedCountry.code !== 'FR' ? (
                <span className="ml-2 px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-medium rounded">
                  TVA 0%
                </span>
              ) : (
                <span className="ml-2 px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded">
                  TVA 20%
                </span>
              )}
            </div>
            {newRestaurant?.city && (
              <p className="text-xs text-gray-500 mt-1 ml-6">
                {newRestaurant.postalCode} {newRestaurant.city}
              </p>
            )}
          </div>
        )}

        {/* Code postal + Ville */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="postalCode">
              Code postal <span className="text-red-500">*</span>
            </Label>
            <Input
              id="postalCode"
              type="text"
              placeholder="75001"
              value={newRestaurant?.postalCode ?? ''}
              onChange={e => onFieldChange('postalCode', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="city">
              Ville <span className="text-red-500">*</span>
            </Label>
            <Input
              id="city"
              type="text"
              placeholder="Paris"
              value={newRestaurant?.city ?? ''}
              onChange={e => onFieldChange('city', e.target.value)}
            />
          </div>
        </div>
        <p className="text-xs text-gray-500 -mt-4">
          Remplis automatiquement par l&apos;adresse ou saisissez manuellement
        </p>

        {/* Informations légales */}
        {newRestaurant?.ownershipType && (
          <div className="pt-4 border-t space-y-4">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-gray-500" />
              <h4 className="font-medium text-gray-700">
                Informations légales (facultatif)
              </h4>
            </div>

            <div className="space-y-2">
              <Label htmlFor="legalName">Raison sociale</Label>
              <Input
                id="legalName"
                type="text"
                placeholder="SARL Restaurant Dupont"
                value={newRestaurant?.legalName ?? ''}
                onChange={e => onFieldChange('legalName', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="siret">SIRET</Label>
              <Input
                id="siret"
                type="text"
                placeholder="123 456 789 00012"
                value={newRestaurant?.siret ?? ''}
                onChange={e => onFieldChange('siret', e.target.value)}
                maxLength={17}
              />
              <p className="text-xs text-gray-500">14 chiffres</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="kbisFile">Extrait K-BIS (optionnel)</Label>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 cursor-pointer transition-colors">
                  <Upload className="h-4 w-4" />
                  Choisir un fichier
                  <input
                    id="kbisFile"
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    className="hidden"
                    onChange={e => {
                      const file = e.target.files?.[0] ?? null;
                      onUpdate({
                        newRestaurant: {
                          ...(newRestaurant ?? {
                            tradeName: '',
                            city: '',
                            ownershipType: 'succursale' as const,
                            country: 'FR',
                          }),
                          kbisFile: file,
                        },
                      });
                    }}
                  />
                </label>
                {(() => {
                  const kbis = newRestaurant?.kbisFile as File | null;
                  return kbis ? (
                    <span className="text-sm text-green-600">{kbis.name}</span>
                  ) : null;
                })()}
              </div>
              <p className="text-xs text-gray-500">
                PDF, JPG ou PNG — Max 10 MB
              </p>
            </div>
          </div>
        )}

        {/* Contact du restaurant */}
        {newRestaurant?.ownershipType && (
          <div className="pt-4 border-t space-y-4">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-gray-500" />
              <h4 className="font-medium text-gray-700">
                Contact du restaurant (facultatif)
              </h4>
            </div>

            <div className="space-y-2">
              <Label htmlFor="contactName">Nom du contact</Label>
              <Input
                id="contactName"
                type="text"
                placeholder="Jean Dupont"
                value={newRestaurant?.contactName ?? ''}
                onChange={e => onFieldChange('contactName', e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="contactEmail">Email</Label>
                <Input
                  id="contactEmail"
                  type="email"
                  placeholder="contact@restaurant.fr"
                  value={newRestaurant?.contactEmail ?? ''}
                  onChange={e => onFieldChange('contactEmail', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contactPhone">Telephone</Label>
                <Input
                  id="contactPhone"
                  type="tel"
                  placeholder="06 12 34 56 78"
                  value={newRestaurant?.contactPhone ?? ''}
                  onChange={e => onFieldChange('contactPhone', e.target.value)}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}

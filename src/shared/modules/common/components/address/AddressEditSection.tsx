'use client';

import { useState } from 'react';

import { MapPin, Save, X, Edit, Home, Building, Copy } from 'lucide-react';

import { ButtonV2 } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@verone/utils';
import {
  useInlineEdit,
  type EditableSection,
} from '@/shared/modules/common/hooks';

interface Organisation {
  id: string;
  address_line1?: string | null;
  address_line2?: string | null;
  postal_code?: string | null;
  city?: string | null;
  region?: string | null;
  country?: string | null;

  // Adresse de facturation
  billing_address_line1?: string | null;
  billing_address_line2?: string | null;
  billing_postal_code?: string | null;
  billing_city?: string | null;
  billing_region?: string | null;
  billing_country?: string | null;

  // Adresse de livraison
  shipping_address_line1?: string | null;
  shipping_address_line2?: string | null;
  shipping_postal_code?: string | null;
  shipping_city?: string | null;
  shipping_region?: string | null;
  shipping_country?: string | null;

  // Indicateur adresses différentes
  has_different_shipping_address?: boolean | null;
}

interface AddressEditSectionProps {
  organisation: Organisation;
  onUpdate: (updatedOrganisation: Partial<Organisation>) => void;
  className?: string;
}

export function AddressEditSection({
  organisation,
  onUpdate,
  className,
}: AddressEditSectionProps) {
  const {
    isEditing,
    isSaving,
    getError,
    getEditedData,
    startEdit,
    cancelEdit,
    updateEditedData,
    saveChanges,
    hasChanges,
  } = useInlineEdit({
    organisationId: organisation.id,
    onUpdate: updatedData => {
      onUpdate(updatedData);
    },
    onError: error => {
      console.error('❌ Erreur mise à jour adresse:', error);
    },
  });

  const section: EditableSection = 'address';
  const editData = getEditedData(section);
  const error = getError(section);

  const handleStartEdit = () => {
    // Utiliser les données legacy comme fallback si les nouveaux champs sont vides
    const billingData = {
      billing_address_line1:
        organisation.billing_address_line1 || organisation.address_line1 || '',
      billing_address_line2:
        organisation.billing_address_line2 || organisation.address_line2 || '',
      billing_postal_code:
        organisation.billing_postal_code || organisation.postal_code || '',
      billing_city: organisation.billing_city || organisation.city || '',
      billing_region: organisation.billing_region || organisation.region || '',
      billing_country:
        organisation.billing_country || organisation.country || 'FR',
    };

    startEdit(section, {
      // Garder les champs legacy pour compatibilité
      address_line1: organisation.address_line1 || '',
      address_line2: organisation.address_line2 || '',
      postal_code: organisation.postal_code || '',
      city: organisation.city || '',
      region: organisation.region || '',
      country: organisation.country || 'FR',

      // Adresses billing avec fallback
      ...billingData,

      // Adresses shipping
      shipping_address_line1: organisation.shipping_address_line1 || '',
      shipping_address_line2: organisation.shipping_address_line2 || '',
      shipping_postal_code: organisation.shipping_postal_code || '',
      shipping_city: organisation.shipping_city || '',
      shipping_region: organisation.shipping_region || '',
      shipping_country: organisation.shipping_country || 'FR',

      has_different_shipping_address:
        organisation.has_different_shipping_address || false,
    });
  };

  const handleSave = async () => {
    // Nettoyer les données avant sauvegarde (trim des espaces)
    const cleanedData = Object.fromEntries(
      Object.entries(editData || {}).map(([key, val]) => {
        if (typeof val === 'string') {
          const trimmed = val.trim();
          // Convertir les chaînes vides en null pour les champs optionnels
          return [key, trimmed === '' ? null : trimmed];
        }
        return [key, val];
      })
    );

    // Mettre à jour avec les données nettoyées
    // Note: Le filtrage des legacy fields est fait dans use-inline-edit.ts
    updateEditedData(section, cleanedData);

    // Attendre un tick pour que l'état soit mis à jour
    await new Promise(resolve => setTimeout(resolve, 0));

    const success = await saveChanges(section);
    if (success) {
      console.log('✅ Adresse mise à jour avec succès');
    }
  };

  const handleCancel = () => {
    cancelEdit(section);
  };

  const copyAddressToClipboard = async (addressData: any, title: string) => {
    const lines = [
      addressData.line1,
      addressData.line2,
      addressData.postal_code && addressData.city
        ? `${addressData.postal_code} ${addressData.city}`
        : addressData.city || addressData.postal_code,
      addressData.region,
      addressData.country && addressData.country !== 'FR'
        ? countries.find(c => c.code === addressData.country)?.name
        : null,
    ].filter(Boolean);

    const text = lines.join('\n');

    try {
      await navigator.clipboard.writeText(text);
      console.log(`✅ ${title} copiée dans le presse-papiers`);
      // TODO: Ajouter un toast si disponible
    } catch (err) {
      console.error('❌ Erreur lors de la copie:', err);
    }
  };

  const handleFieldChange = (field: string, value: string) => {
    let processedValue = value; // Pas de trim ici, seulement à la sauvegarde

    // Formatage automatique du code postal français
    if (
      (field.includes('postal_code') || field === 'postal_code') &&
      processedValue.length <= 5
    ) {
      processedValue = processedValue.replace(/\D/g, ''); // Garder seulement les chiffres
    }

    // Mise en forme automatique des villes (première lettre en majuscule)
    if (
      field.includes('city') ||
      field.includes('region') ||
      field === 'city' ||
      field === 'region'
    ) {
      processedValue = processedValue
        .toLowerCase()
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    }

    updateEditedData(section, { [field]: processedValue || null });
  };

  // Options de pays
  const countries = [
    { code: 'FR', name: 'France' },
    { code: 'BE', name: 'Belgique' },
    { code: 'DE', name: 'Allemagne' },
    { code: 'IT', name: 'Italie' },
    { code: 'ES', name: 'Espagne' },
    { code: 'CH', name: 'Suisse' },
    { code: 'UK', name: 'Royaume-Uni' },
    { code: 'NL', name: 'Pays-Bas' },
    { code: 'LU', name: 'Luxembourg' },
    { code: 'OTHER', name: 'Autre' },
  ];

  if (isEditing(section)) {
    return (
      <div className={cn('card-verone p-4', className)}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-base font-medium text-black flex items-center">
            <MapPin className="h-4 w-4 mr-2" />
            Adresse
          </h3>
          <div className="flex space-x-2">
            <ButtonV2
              variant="outline"
              size="sm"
              onClick={handleCancel}
              disabled={isSaving(section)}
            >
              <X className="h-3 w-3 mr-1" />
              Annuler
            </ButtonV2>
            <ButtonV2
              variant="secondary"
              size="sm"
              onClick={handleSave}
              disabled={!hasChanges(section) || isSaving(section)}
            >
              <Save className="h-3 w-3 mr-1" />
              {isSaving(section) ? 'Sauvegarde...' : 'Sauvegarder'}
            </ButtonV2>
          </div>
        </div>

        <div className="space-y-6">
          {/* Adresse de facturation */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-md font-semibold text-black flex items-center gap-2">
                <Building className="h-4 w-4" />
                Adresse de facturation
              </h4>
              <ButtonV2
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  // Copier l'adresse de livraison vers facturation
                  updateEditedData(section, {
                    billing_address_line1:
                      editData?.shipping_address_line1 || '',
                    billing_address_line2:
                      editData?.shipping_address_line2 || '',
                    billing_postal_code: editData?.shipping_postal_code || '',
                    billing_city: editData?.shipping_city || '',
                    billing_region: editData?.shipping_region || '',
                    billing_country: editData?.shipping_country || 'FR',
                  });
                }}
                className="flex items-center gap-2"
                disabled={!editData?.has_different_shipping_address}
              >
                <Copy className="h-3 w-3" />
                Copier vers facturation
              </ButtonV2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-black mb-1">
                  Adresse ligne 1
                </label>
                <input
                  type="text"
                  value={editData?.billing_address_line1 || ''}
                  onChange={e =>
                    handleFieldChange('billing_address_line1', e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
                  placeholder="Numéro et nom de rue"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-black mb-1">
                  Adresse ligne 2
                </label>
                <input
                  type="text"
                  value={editData?.billing_address_line2 || ''}
                  onChange={e =>
                    handleFieldChange('billing_address_line2', e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
                  placeholder="Complément d'adresse (optionnel)"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-1">
                  Code postal
                </label>
                <input
                  type="text"
                  value={editData?.billing_postal_code || ''}
                  onChange={e =>
                    handleFieldChange('billing_postal_code', e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
                  placeholder="75001"
                  maxLength={5}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-1">
                  Ville
                </label>
                <input
                  type="text"
                  value={editData?.billing_city || ''}
                  onChange={e =>
                    handleFieldChange('billing_city', e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
                  placeholder="Paris"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-1">
                  Région / Département
                </label>
                <input
                  type="text"
                  value={editData?.billing_region || ''}
                  onChange={e =>
                    handleFieldChange('billing_region', e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
                  placeholder="Île-de-France"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-1">
                  Pays
                </label>
                <select
                  value={editData?.billing_country || 'FR'}
                  onChange={e =>
                    updateEditedData(section, {
                      billing_country: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
                >
                  {countries.map(country => (
                    <option key={country.code} value={country.code}>
                      {country.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Toggle adresse de livraison différente */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="different_shipping"
              checked={editData?.has_different_shipping_address || false}
              onCheckedChange={checked => {
                updateEditedData(section, {
                  has_different_shipping_address: checked,
                });
                if (!checked) {
                  // Vider les champs shipping si on désactive
                  updateEditedData(section, {
                    shipping_address_line1: '',
                    shipping_address_line2: '',
                    shipping_postal_code: '',
                    shipping_city: '',
                    shipping_region: '',
                    shipping_country: 'FR',
                  });
                }
              }}
            />
            <label
              htmlFor="different_shipping"
              className="text-sm font-medium text-black"
            >
              L'adresse de livraison est différente de l'adresse de facturation
            </label>
          </div>

          {/* Adresse de livraison (conditionnelle) */}
          {editData?.has_different_shipping_address && (
            <div className="space-y-4 border-t pt-4">
              <h4 className="text-md font-semibold text-black flex items-center gap-2">
                <Home className="h-4 w-4" />
                Adresse de livraison
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-black mb-1">
                    Adresse ligne 1
                  </label>
                  <input
                    type="text"
                    value={editData?.shipping_address_line1 || ''}
                    onChange={e =>
                      handleFieldChange(
                        'shipping_address_line1',
                        e.target.value
                      )
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
                    placeholder="Numéro et nom de rue"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-black mb-1">
                    Adresse ligne 2
                  </label>
                  <input
                    type="text"
                    value={editData?.shipping_address_line2 || ''}
                    onChange={e =>
                      handleFieldChange(
                        'shipping_address_line2',
                        e.target.value
                      )
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
                    placeholder="Complément d'adresse (optionnel)"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-black mb-1">
                    Code postal
                  </label>
                  <input
                    type="text"
                    value={editData?.shipping_postal_code || ''}
                    onChange={e =>
                      handleFieldChange('shipping_postal_code', e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
                    placeholder="75001"
                    maxLength={5}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-black mb-1">
                    Ville
                  </label>
                  <input
                    type="text"
                    value={editData?.shipping_city || ''}
                    onChange={e =>
                      handleFieldChange('shipping_city', e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
                    placeholder="Paris"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-black mb-1">
                    Région / Département
                  </label>
                  <input
                    type="text"
                    value={editData?.shipping_region || ''}
                    onChange={e =>
                      handleFieldChange('shipping_region', e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
                    placeholder="Île-de-France"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-black mb-1">
                    Pays
                  </label>
                  <select
                    value={editData?.shipping_country || 'FR'}
                    onChange={e =>
                      updateEditedData(section, {
                        shipping_country: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
                  >
                    {countries.map(country => (
                      <option key={country.code} value={country.code}>
                        {country.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Message d'erreur */}
        {error && (
          <div className="mt-3 text-sm text-red-600 bg-red-50 p-2 rounded">
            ❌ {error}
          </div>
        )}
      </div>
    );
  }

  // Mode affichage - avec fallback vers legacy comme dans l'édition
  const billingData = {
    line1: organisation.billing_address_line1 || organisation.address_line1,
    line2: organisation.billing_address_line2 || organisation.address_line2,
    postal_code: organisation.billing_postal_code || organisation.postal_code,
    city: organisation.billing_city || organisation.city,
    region: organisation.billing_region || organisation.region,
    country: organisation.billing_country || organisation.country,
  };

  const shippingData = {
    line1: organisation.shipping_address_line1,
    line2: organisation.shipping_address_line2,
    postal_code: organisation.shipping_postal_code,
    city: organisation.shipping_city,
    region: organisation.shipping_region,
    country: organisation.shipping_country,
  };

  const hasBillingAddress =
    billingData.line1 || billingData.city || billingData.country;
  const hasShippingAddress =
    shippingData.line1 || shippingData.city || shippingData.country;
  const hasLegacyAddress =
    organisation.address_line1 || organisation.city || organisation.country;

  const renderAddress = (
    prefix: string,
    addressData: any,
    icon: React.ReactNode,
    title: string
  ) => {
    if (!addressData.line1 && !addressData.city && !addressData.country)
      return null;

    return (
      <div className="bg-gray-50 p-3 rounded-lg">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            {icon}
            <div className="text-xs font-medium text-gray-600 uppercase">
              {title}
            </div>
          </div>
          <ButtonV2
            variant="outline"
            size="md"
            onClick={() => copyAddressToClipboard(addressData, title)}
            title={`Copier ${title}`}
          >
            <Copy className="h-4 w-4" />
          </ButtonV2>
        </div>
        <div className="flex-1 pl-6">
          {addressData.line1 && (
            <div className="text-sm text-black">{addressData.line1}</div>
          )}
          {addressData.line2 && (
            <div className="text-sm text-black opacity-80">
              {addressData.line2}
            </div>
          )}
          {(addressData.postal_code || addressData.city) && (
            <div className="text-sm text-black mt-1">
              {addressData.postal_code && `${addressData.postal_code} `}
              {addressData.city}
            </div>
          )}
          {addressData.region && (
            <div className="text-sm text-black opacity-80">
              {addressData.region}
            </div>
          )}
          {addressData.country && addressData.country !== 'FR' && (
            <div className="text-sm text-black font-medium mt-1">
              {countries.find(c => c.code === addressData.country)?.name ||
                addressData.country}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className={cn('card-verone p-4', className)}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-medium text-black flex items-center">
          <MapPin className="h-5 w-5 mr-2" />
          Adresses
        </h3>
        <ButtonV2 variant="outline" size="sm" onClick={handleStartEdit}>
          <Edit className="h-3 w-3 mr-1" />
          Modifier
        </ButtonV2>
      </div>

      <div className="space-y-3">
        {/* Adresse de facturation - TOUJOURS affichée si on a des données */}
        {hasBillingAddress &&
          renderAddress(
            'billing',
            billingData,
            <Building className="h-4 w-4 mt-1 text-gray-600" />,
            'Adresse de facturation'
          )}

        {/* Adresse de livraison - Affichée si différente ET qu'on a des données shipping */}
        {hasShippingAddress &&
          organisation.has_different_shipping_address &&
          renderAddress(
            'shipping',
            shippingData,
            <Home className="h-4 w-4 mt-1 text-gray-600" />,
            'Adresse de livraison'
          )}

        {/* Message si adresses identiques */}
        {hasBillingAddress && !organisation.has_different_shipping_address && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
            <div className="text-sm text-blue-700">
              📦 Adresse de livraison identique à l'adresse de facturation
            </div>
          </div>
        )}

        {/* Aucune adresse */}
        {!hasBillingAddress && !hasShippingAddress && !hasLegacyAddress && (
          <div className="text-center text-gray-400 text-xs italic py-4">
            <Building className="h-8 w-8 mx-auto mb-2 opacity-30" />
            Aucune adresse renseignée
          </div>
        )}
      </div>
    </div>
  );
}

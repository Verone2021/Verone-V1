'use client';

import {
  Badge,
  Input,
  Label,
  RadioGroup,
  RadioGroupItem,
  TabsContent,
  AddressAutocomplete,
  type AddressResult,
} from '@verone/ui';
import {
  Building2,
  CreditCard,
  FileText,
  Globe,
  Mail,
  MapPin,
  Phone,
} from 'lucide-react';

import { EditableSection } from './SharedComponents';
import type { useOrganisationDetail } from '../../../lib/hooks/use-organisation-detail';

// ============================================================================
// TYPES
// ============================================================================

type OrganisationDetailData = NonNullable<
  ReturnType<typeof useOrganisationDetail>['data']
>;

interface InfosTabProps {
  data: OrganisationDetailData;
  mode: 'view' | 'edit';
  editingSection: string | null;
  setEditingSection: (section: string | null) => void;
  isPending: boolean;

  // Ownership type
  ownershipTypeForm: 'succursale' | 'franchise' | null;
  setOwnershipTypeForm: (value: 'succursale' | 'franchise' | null) => void;
  onSaveOwnershipType: () => void;

  // Shipping
  shippingForm: {
    shipping_address_line1: string;
    shipping_address_line2: string;
    shipping_city: string;
    shipping_postal_code: string;
    shipping_country: string;
    latitude: number | null;
    longitude: number | null;
  };
  setShippingForm: React.Dispatch<
    React.SetStateAction<{
      shipping_address_line1: string;
      shipping_address_line2: string;
      shipping_city: string;
      shipping_postal_code: string;
      shipping_country: string;
      latitude: number | null;
      longitude: number | null;
    }>
  >;
  onShippingAddressSelect: (address: AddressResult) => void;
  onSaveShipping: () => void;
  shippingAddress: string | null;

  // Billing
  billingForm: {
    billing_address_line1: string;
    billing_address_line2: string;
    billing_city: string;
    billing_postal_code: string;
    billing_country: string;
  };
  setBillingForm: React.Dispatch<
    React.SetStateAction<{
      billing_address_line1: string;
      billing_address_line2: string;
      billing_city: string;
      billing_postal_code: string;
      billing_country: string;
    }>
  >;
  onBillingAddressSelect: (address: AddressResult) => void;
  onSaveBilling: () => void;
  billingAddress: string | null;

  // Contacts (coordonnées)
  contactsForm: { phone: string; email: string; website: string };
  setContactsForm: React.Dispatch<
    React.SetStateAction<{ phone: string; email: string; website: string }>
  >;
  onSaveContacts: () => void;

  // Legal
  legalForm: { siren: string; siret: string; vat_number: string };
  setLegalForm: React.Dispatch<
    React.SetStateAction<{ siren: string; siret: string; vat_number: string }>
  >;
  onSaveLegal: () => void;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function InfosTab({
  data,
  mode,
  editingSection,
  setEditingSection,
  isPending,
  ownershipTypeForm,
  setOwnershipTypeForm,
  onSaveOwnershipType,
  shippingForm,
  setShippingForm,
  onShippingAddressSelect,
  onSaveShipping,
  shippingAddress,
  billingForm,
  setBillingForm,
  onBillingAddressSelect,
  onSaveBilling,
  billingAddress,
  contactsForm,
  setContactsForm,
  onSaveContacts,
  legalForm,
  setLegalForm,
  onSaveLegal,
}: InfosTabProps) {
  const ownershipType = data.organisation.ownership_type;
  const isPropre = ownershipType === 'succursale';

  return (
    <TabsContent value="infos" className="mt-4 space-y-3">
      {/* Section Type de propriété */}
      <EditableSection
        title="Type de propriété"
        icon={Building2}
        isIncomplete={!data.organisation.ownership_type}
        isEditing={editingSection === 'ownership_type'}
        onEdit={() => setEditingSection('ownership_type')}
        onSave={onSaveOwnershipType}
        onCancel={() => {
          const mappedOwnershipType =
            data.organisation.ownership_type === 'propre'
              ? 'succursale'
              : data.organisation.ownership_type;
          setOwnershipTypeForm(mappedOwnershipType);
          setEditingSection(null);
        }}
        isSaving={isPending}
        mode={mode}
        editContent={
          <RadioGroup
            value={ownershipTypeForm ?? ''}
            onValueChange={value =>
              setOwnershipTypeForm(value as 'succursale' | 'franchise')
            }
            className="space-y-2"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="succursale" id="succursale" />
              <Label
                htmlFor="succursale"
                className="font-normal cursor-pointer"
              >
                Succursale (Restaurant propre)
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="franchise" id="franchise" />
              <Label htmlFor="franchise" className="font-normal cursor-pointer">
                Franchise
              </Label>
            </div>
          </RadioGroup>
        }
      >
        {ownershipType ? (
          <Badge
            variant={isPropre ? 'default' : 'secondary'}
            className={isPropre ? 'bg-blue-500' : 'bg-orange-500'}
          >
            {isPropre ? 'Succursale (Restaurant propre)' : 'Franchise'}
          </Badge>
        ) : (
          <p className="text-sm text-gray-500">Non défini</p>
        )}
      </EditableSection>

      {/* Section Adresse de livraison */}
      <EditableSection
        title="Adresse de livraison"
        icon={MapPin}
        isIncomplete={!data.organisation.shipping_address_line1}
        isEditing={editingSection === 'shipping'}
        onEdit={() => setEditingSection('shipping')}
        onSave={onSaveShipping}
        onCancel={() => {
          setShippingForm({
            shipping_address_line1:
              data.organisation.shipping_address_line1 ?? '',
            shipping_address_line2:
              data.organisation.shipping_address_line2 ?? '',
            shipping_city: data.organisation.shipping_city ?? '',
            shipping_postal_code: data.organisation.shipping_postal_code ?? '',
            shipping_country: data.organisation.shipping_country ?? 'France',
            latitude: data.organisation.latitude,
            longitude: data.organisation.longitude,
          });
          setEditingSection(null);
        }}
        isSaving={isPending}
        mode={mode}
        editContent={
          <div className="space-y-3">
            <div>
              <Label className="text-sm">Adresse *</Label>
              <AddressAutocomplete
                value={shippingForm.shipping_address_line1}
                onChange={value =>
                  setShippingForm(prev => ({
                    ...prev,
                    shipping_address_line1: value,
                  }))
                }
                onSelect={onShippingAddressSelect}
                defaultCountry="FR"
                placeholder="Rechercher une adresse..."
              />
            </div>
            <div>
              <Label className="text-sm">Complément</Label>
              <Input
                value={shippingForm.shipping_address_line2}
                onChange={e =>
                  setShippingForm(prev => ({
                    ...prev,
                    shipping_address_line2: e.target.value,
                  }))
                }
                placeholder="Bâtiment, étage..."
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-sm">Ville *</Label>
                <Input
                  value={shippingForm.shipping_city}
                  onChange={e =>
                    setShippingForm(prev => ({
                      ...prev,
                      shipping_city: e.target.value,
                    }))
                  }
                />
              </div>
              <div>
                <Label className="text-sm">Code postal *</Label>
                <Input
                  value={shippingForm.shipping_postal_code}
                  onChange={e =>
                    setShippingForm(prev => ({
                      ...prev,
                      shipping_postal_code: e.target.value,
                    }))
                  }
                />
              </div>
            </div>
          </div>
        }
      >
        {shippingAddress ? (
          <p className="text-sm text-gray-900 whitespace-pre-line">
            {shippingAddress}
          </p>
        ) : (
          <p className="text-sm text-gray-500">Non renseignée</p>
        )}
      </EditableSection>

      {/* Section Adresse de facturation */}
      <EditableSection
        title="Adresse de facturation"
        icon={CreditCard}
        isIncomplete={!data.organisation.billing_address_line1}
        isEditing={editingSection === 'billing'}
        onEdit={() => setEditingSection('billing')}
        onSave={onSaveBilling}
        onCancel={() => {
          setBillingForm({
            billing_address_line1:
              data.organisation.billing_address_line1 ?? '',
            billing_address_line2:
              data.organisation.billing_address_line2 ?? '',
            billing_city: data.organisation.billing_city ?? '',
            billing_postal_code: data.organisation.billing_postal_code ?? '',
            billing_country: data.organisation.billing_country ?? 'France',
          });
          setEditingSection(null);
        }}
        isSaving={isPending}
        mode={mode}
        editContent={
          <div className="space-y-3">
            <div>
              <Label className="text-sm">Adresse *</Label>
              <AddressAutocomplete
                value={billingForm.billing_address_line1}
                onChange={value =>
                  setBillingForm(prev => ({
                    ...prev,
                    billing_address_line1: value,
                  }))
                }
                onSelect={onBillingAddressSelect}
                defaultCountry="FR"
                placeholder="Rechercher une adresse..."
              />
            </div>
            <div>
              <Label className="text-sm">Complément</Label>
              <Input
                value={billingForm.billing_address_line2}
                onChange={e =>
                  setBillingForm(prev => ({
                    ...prev,
                    billing_address_line2: e.target.value,
                  }))
                }
                placeholder="Bâtiment, étage..."
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-sm">Ville *</Label>
                <Input
                  value={billingForm.billing_city}
                  onChange={e =>
                    setBillingForm(prev => ({
                      ...prev,
                      billing_city: e.target.value,
                    }))
                  }
                />
              </div>
              <div>
                <Label className="text-sm">Code postal *</Label>
                <Input
                  value={billingForm.billing_postal_code}
                  onChange={e =>
                    setBillingForm(prev => ({
                      ...prev,
                      billing_postal_code: e.target.value,
                    }))
                  }
                />
              </div>
            </div>
          </div>
        }
      >
        {billingAddress ? (
          <p className="text-sm text-gray-900 whitespace-pre-line">
            {billingAddress}
          </p>
        ) : (
          <p className="text-sm text-gray-500">Non renseignée</p>
        )}
      </EditableSection>

      {/* Section Coordonnées */}
      <EditableSection
        title="Coordonnées"
        icon={Phone}
        isIncomplete={!data.organisation.phone && !data.organisation.email}
        isEditing={editingSection === 'contacts'}
        onEdit={() => setEditingSection('contacts')}
        onSave={onSaveContacts}
        onCancel={() => {
          setContactsForm({
            phone: data.organisation.phone ?? '',
            email: data.organisation.email ?? '',
            website: data.organisation.website ?? '',
          });
          setEditingSection(null);
        }}
        isSaving={isPending}
        mode={mode}
        editContent={
          <div className="space-y-3">
            <div>
              <Label className="text-sm">Téléphone</Label>
              <Input
                type="tel"
                value={contactsForm.phone}
                onChange={e =>
                  setContactsForm(prev => ({
                    ...prev,
                    phone: e.target.value,
                  }))
                }
                placeholder="01 23 45 67 89"
              />
            </div>
            <div>
              <Label className="text-sm">Email</Label>
              <Input
                type="email"
                value={contactsForm.email}
                onChange={e =>
                  setContactsForm(prev => ({
                    ...prev,
                    email: e.target.value,
                  }))
                }
                placeholder="contact@restaurant.fr"
              />
            </div>
            <div>
              <Label className="text-sm">Site web</Label>
              <Input
                type="url"
                value={contactsForm.website}
                onChange={e =>
                  setContactsForm(prev => ({
                    ...prev,
                    website: e.target.value,
                  }))
                }
                placeholder="https://www.restaurant.fr"
              />
            </div>
          </div>
        }
      >
        <div className="space-y-2">
          {data.organisation.phone && (
            <div className="flex items-center gap-2 text-sm">
              <Phone className="h-4 w-4 text-gray-400" />
              <span className="text-gray-900">{data.organisation.phone}</span>
            </div>
          )}
          {data.organisation.email && (
            <div className="flex items-center gap-2 text-sm">
              <Mail className="h-4 w-4 text-gray-400" />
              <span className="text-gray-900">{data.organisation.email}</span>
            </div>
          )}
          {data.organisation.website && (
            <div className="flex items-center gap-2 text-sm">
              <Globe className="h-4 w-4 text-gray-400" />
              <a
                href={data.organisation.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-linkme-turquoise hover:underline"
              >
                {data.organisation.website}
              </a>
            </div>
          )}
          {!data.organisation.phone &&
            !data.organisation.email &&
            !data.organisation.website && (
              <p className="text-sm text-gray-500">Non renseignées</p>
            )}
        </div>
      </EditableSection>

      {/* Section Informations légales */}
      <EditableSection
        title="Informations légales"
        icon={FileText}
        isIncomplete={!data.organisation.siret}
        isEditing={editingSection === 'legal'}
        onEdit={() => setEditingSection('legal')}
        onSave={onSaveLegal}
        onCancel={() => {
          setLegalForm({
            siren: data.organisation.siren ?? '',
            siret: data.organisation.siret ?? '',
            vat_number: data.organisation.vat_number ?? '',
          });
          setEditingSection(null);
        }}
        isSaving={isPending}
        mode={mode}
        editContent={
          <div className="space-y-3">
            <div>
              <Label className="text-sm">SIREN (9 chiffres)</Label>
              <Input
                value={legalForm.siren}
                onChange={e =>
                  setLegalForm(prev => ({
                    ...prev,
                    siren: e.target.value,
                  }))
                }
                placeholder="123456789"
                maxLength={9}
              />
            </div>
            <div>
              <Label className="text-sm">SIRET (14 chiffres)</Label>
              <Input
                value={legalForm.siret}
                onChange={e =>
                  setLegalForm(prev => ({
                    ...prev,
                    siret: e.target.value,
                  }))
                }
                placeholder="12345678901234"
                maxLength={14}
              />
            </div>
            <div>
              <Label className="text-sm">Numéro de TVA</Label>
              <Input
                value={legalForm.vat_number}
                onChange={e =>
                  setLegalForm(prev => ({
                    ...prev,
                    vat_number: e.target.value,
                  }))
                }
                placeholder="FR12345678901"
              />
            </div>
          </div>
        }
      >
        <div className="space-y-2 text-sm">
          {data.organisation.siren && (
            <div className="flex justify-between">
              <span className="text-gray-500">SIREN :</span>
              <span className="text-gray-900 font-medium">
                {data.organisation.siren}
              </span>
            </div>
          )}
          {data.organisation.siret && (
            <div className="flex justify-between">
              <span className="text-gray-500">SIRET :</span>
              <span className="text-gray-900 font-medium">
                {data.organisation.siret}
              </span>
            </div>
          )}
          {data.organisation.vat_number && (
            <div className="flex justify-between">
              <span className="text-gray-500">TVA :</span>
              <span className="text-gray-900 font-medium">
                {data.organisation.vat_number}
              </span>
            </div>
          )}
          {!data.organisation.siren &&
            !data.organisation.siret &&
            !data.organisation.vat_number && (
              <p className="text-gray-500">Non renseignées</p>
            )}
        </div>
      </EditableSection>
    </TabsContent>
  );
}

'use client';

import { useState, useEffect } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { AddressAutocomplete, type AddressResult } from '@verone/ui';
import { ButtonV2 } from '@verone/ui';
import { Checkbox } from '@verone/ui';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@verone/ui';
import { Input } from '@verone/ui';
import { Label } from '@verone/ui';
import { RadioGroup, RadioGroupItem } from '@verone/ui';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@verone/ui';
import { Textarea } from '@verone/ui';
import { spacing, colors, componentShadows } from '@verone/ui';
import {
  Building2,
  MapPin,
  FileText,
  CreditCard,
  Users,
  Store,
  Info,
  Navigation,
} from 'lucide-react';
import { useForm, type SubmitHandler, type Resolver } from 'react-hook-form';
import * as z from 'zod';

import type { Organisation } from '@verone/organisations/hooks';

import { useActiveEnseignes } from '../../hooks/use-enseignes';
import { OrganisationContactsManager } from './organisation-contacts-manager';
import { LogoUploadButton } from '../buttons/LogoUploadButton';

// ========================
// TYPES & SCHEMAS
// ========================

export type OrganisationType =
  | 'supplier'
  | 'customer'
  | 'partner'
  | 'internal'
  | 'generic';

// Organisation type is now imported from hooks (complete type with all properties)

const baseOrganisationSchema = z.object({
  name: z.string().min(1, 'Le nom est obligatoire'),
  country: z.string().default('FR'),
  is_active: z.boolean().default(true),
  notes: z.string().optional().or(z.literal('')),

  // Propriétés de contact (ajoutées)
  legal_name: z.string().optional().or(z.literal('')),
  email: z.string().email().optional().or(z.literal('')),
  secondary_email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional().or(z.literal('')),
  website: z.string().url().optional().or(z.literal('')),

  // Adresse principale (DEPRECATED mais encore utilisée)
  address_line1: z.string().optional().or(z.literal('')),
  address_line2: z.string().optional().or(z.literal('')),
  postal_code: z.string().optional().or(z.literal('')),
  city: z.string().optional().or(z.literal('')),
  region: z.string().optional().or(z.literal('')),

  // Adresse de facturation
  billing_address_line1: z.string().optional().or(z.literal('')),
  billing_address_line2: z.string().optional().or(z.literal('')),
  billing_postal_code: z.string().optional().or(z.literal('')),
  billing_city: z.string().optional().or(z.literal('')),
  billing_region: z.string().optional().or(z.literal('')),
  billing_country: z.string().default('FR'),

  // Adresse de livraison
  shipping_address_line1: z.string().optional().or(z.literal('')),
  shipping_address_line2: z.string().optional().or(z.literal('')),
  shipping_postal_code: z.string().optional().or(z.literal('')),
  shipping_city: z.string().optional().or(z.literal('')),
  shipping_region: z.string().optional().or(z.literal('')),
  shipping_country: z.string().default('FR'),
  has_different_shipping_address: z.boolean().default(false),

  // Coordonnées GPS (remplies automatiquement par AddressAutocomplete)
  latitude: z.number().nullable().optional(),
  longitude: z.number().nullable().optional(),

  // Identité commerciale
  has_different_trade_name: z.boolean().default(false),
  trade_name: z.string().optional().or(z.literal('')),

  // Légal
  siren: z.string().optional().or(z.literal('')),
  legal_form: z.string().optional().or(z.literal('')),
  siret: z.string().optional().or(z.literal('')),
  vat_number: z.string().optional().or(z.literal('')),
  industry_sector: z.string().optional().or(z.literal('')),

  // Rattachement enseigne (clients B2B uniquement)
  enseigne_id: z.string().nullable().optional(),
  ownership_type: z
    .enum(['succursale', 'franchise', 'propre'])
    .nullable()
    .optional(),

  // Commercial
  currency: z.string().default('EUR'),
  payment_terms: z.string().optional().or(z.literal('')),

  // Supplier specific
  supplier_segment: z.string().optional().or(z.literal('')),
});

// z.output gives the type AFTER defaults are applied (all required fields have values)
export type OrganisationFormData = z.output<typeof baseOrganisationSchema>;

// ========================
// CONSTANTS
// ========================

const _COUNTRIES = [
  { value: 'FR', label: 'France' },
  { value: 'BE', label: 'Belgique' },
  { value: 'CH', label: 'Suisse' },
  { value: 'IT', label: 'Italie' },
  { value: 'ES', label: 'Espagne' },
  { value: 'DE', label: 'Allemagne' },
  { value: 'NL', label: 'Pays-Bas' },
  { value: 'PT', label: 'Portugal' },
  { value: 'UK', label: 'Royaume-Uni' },
  { value: 'US', label: 'États-Unis' },
  { value: 'CN', label: 'Chine' },
  { value: 'OTHER', label: 'Autre' },
];

const CURRENCIES = [
  { value: 'EUR', label: 'Euro (€)' },
  { value: 'USD', label: 'Dollar US ($)' },
  { value: 'GBP', label: 'Livre Sterling (£)' },
  { value: 'CHF', label: 'Franc Suisse (CHF)' },
];

const LEGAL_FORMS = [
  { value: 'SARL', label: 'SARL' },
  { value: 'SAS', label: 'SAS' },
  { value: 'SA', label: 'SA' },
  { value: 'EURL', label: 'EURL' },
  { value: 'SCI', label: 'SCI' },
  { value: 'EI', label: 'Entreprise Individuelle' },
  { value: 'AUTRE', label: 'Autre' },
];

const PAYMENT_TERMS_OPTIONS = [
  { value: 'NET_30', label: 'Net 30 jours' },
  { value: 'NET_45', label: 'Net 45 jours' },
  { value: 'NET_60', label: 'Net 60 jours' },
  { value: 'IMMEDIATE', label: 'Paiement immédiat' },
  { value: 'CUSTOM', label: 'Personnalisé' },
];

const _SUPPLIER_SEGMENTS = [
  { value: 'STRATEGIC', label: 'Stratégique' },
  { value: 'TACTICAL', label: 'Tactique' },
  { value: 'OPERATIONAL', label: 'Opérationnel' },
  { value: 'COMMODITY', label: 'Commodité' },
];

// ========================
// HELPERS
// ========================

const getDefaultValues = (
  organisation?: Organisation | null
): OrganisationFormData => {
  if (!organisation) {
    return {
      name: '',
      country: 'FR',
      is_active: true,
      notes: '',
      // Adresse de facturation
      billing_address_line1: '',
      billing_address_line2: '',
      billing_postal_code: '',
      billing_city: '',
      billing_region: '',
      billing_country: 'FR',
      // Adresse de livraison
      shipping_address_line1: '',
      shipping_address_line2: '',
      shipping_postal_code: '',
      shipping_city: '',
      shipping_region: '',
      shipping_country: 'FR',
      has_different_shipping_address: false,
      has_different_trade_name: false,
      trade_name: '',
      siren: '',
      legal_form: '',
      siret: '',
      vat_number: '',
      industry_sector: '',
      currency: 'EUR',
      payment_terms: '',
      supplier_segment: '',
      enseigne_id: null,
      ownership_type: null,
    };
  }

  return {
    name: organisation.name,
    country: organisation.country ?? 'FR',
    is_active: organisation.is_active ?? true,
    notes: organisation.notes ?? '',
    // Adresse de facturation
    billing_address_line1: organisation.billing_address_line1 ?? '',
    billing_address_line2: organisation.billing_address_line2 ?? '',
    billing_postal_code: organisation.billing_postal_code ?? '',
    billing_city: organisation.billing_city ?? '',
    billing_region: organisation.billing_region ?? '',
    billing_country: organisation.billing_country ?? 'FR',
    // Adresse de livraison
    shipping_address_line1: organisation.shipping_address_line1 ?? '',
    shipping_address_line2: organisation.shipping_address_line2 ?? '',
    shipping_postal_code: organisation.shipping_postal_code ?? '',
    shipping_city: organisation.shipping_city ?? '',
    shipping_region: organisation.shipping_region ?? '',
    shipping_country: organisation.shipping_country ?? 'FR',
    has_different_shipping_address:
      organisation.has_different_shipping_address ?? false,
    has_different_trade_name: organisation.has_different_trade_name ?? false,
    trade_name: organisation.trade_name ?? '',
    siren: organisation.siren ?? '',
    legal_form: organisation.legal_form ?? '',
    siret: organisation.siret ?? '',
    vat_number: organisation.vat_number ?? '',
    industry_sector: organisation.industry_sector ?? '',
    currency: organisation.currency ?? 'EUR',
    payment_terms: organisation.payment_terms ?? '',
    supplier_segment: organisation.supplier_segment ?? '',
    enseigne_id: organisation.enseigne_id ?? null,
    ownership_type: organisation.ownership_type ?? null,
    latitude: organisation.latitude ?? null,
    longitude: organisation.longitude ?? null,
  };
};

const getOrganisationTypeLabel = (type: OrganisationType): string => {
  const labels: Record<OrganisationType, string> = {
    supplier: 'Fournisseur',
    customer: 'Client professionnel',
    partner: 'Prestataire',
    internal: 'Interne',
    generic: 'Organisation',
  };
  return labels[type];
};

// ========================
// COMPONENT
// ========================

interface UnifiedOrganisationFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (
    data: OrganisationFormData,
    organisationId?: string
  ) => Promise<void>;
  onSuccess?: (organisation: Organisation) => void;
  organisationType: OrganisationType;
  organisation?: Organisation | null;
  mode?: 'create' | 'edit';
  title?: string;
  onLogoUploadSuccess?: () => void;
  customSections?: React.ReactNode;
}

export function UnifiedOrganisationForm({
  isOpen,
  onClose,
  onSubmit,
  onSuccess: _onSuccess,
  organisationType,
  organisation = null,
  mode = 'create',
  title,
  onLogoUploadSuccess,
  customSections,
}: UnifiedOrganisationFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isCustomer = organisationType === 'customer';
  const { enseignes, loading: enseignesLoading } = useActiveEnseignes();

  const form = useForm<OrganisationFormData>({
    // Cast via unknown to resolve zodResolver/react-hook-form type mismatch with .default() fields
    resolver: zodResolver(
      baseOrganisationSchema
    ) as unknown as Resolver<OrganisationFormData>,
    defaultValues: getDefaultValues(organisation),
  });

  useEffect(() => {
    if (isOpen) {
      form.reset(getDefaultValues(organisation));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- form.reset is stable, adding form causes infinite loop
  }, [isOpen, organisation]);

  // Handlers pour AddressAutocomplete
  const handleBillingAddressSelect = (address: AddressResult) => {
    form.setValue('billing_address_line1', address.streetAddress);
    form.setValue('billing_city', address.city);
    form.setValue('billing_postal_code', address.postalCode);
    form.setValue('billing_region', address.region ?? '');
    form.setValue('billing_country', address.countryCode ?? 'FR');
    if (!form.getValues('has_different_shipping_address')) {
      form.setValue('latitude', address.latitude ?? null);
      form.setValue('longitude', address.longitude ?? null);
    }
  };

  const handleShippingAddressSelect = (address: AddressResult) => {
    form.setValue('shipping_address_line1', address.streetAddress);
    form.setValue('shipping_city', address.city);
    form.setValue('shipping_postal_code', address.postalCode);
    form.setValue('shipping_region', address.region ?? '');
    form.setValue('shipping_country', address.countryCode ?? 'FR');
    form.setValue('latitude', address.latitude ?? null);
    form.setValue('longitude', address.longitude ?? null);
  };

  const handleSubmit: SubmitHandler<OrganisationFormData> = async data => {
    setIsSubmitting(true);
    try {
      // Auto-fill country from billing_country (évite champ redondant)
      const enrichedData = {
        ...data,
        country: data.billing_country ?? data.country ?? 'FR',
      };
      await onSubmit(enrichedData, organisation?.id);
    } catch (error) {
      console.error('Erreur lors de la soumission:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      form.reset();
      onClose();
    }
  };

  const displayTitle =
    title ??
    `${mode === 'edit' ? 'Modifier' : 'Créer'} ${getOrganisationTypeLabel(organisationType)}`;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent
        className="max-w-5xl max-h-[90vh] overflow-y-auto"
        style={{
          backgroundColor: colors.background.DEFAULT,
          borderColor: colors.border.DEFAULT,
          borderRadius: '10px',
          boxShadow: componentShadows.modal,
          transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        {/* Header */}
        <DialogHeader style={{ marginBottom: spacing[6] }}>
          <DialogTitle
            className="text-2xl font-semibold"
            style={{ color: colors.text.DEFAULT }}
          >
            {displayTitle}
          </DialogTitle>
        </DialogHeader>

        <form
          onSubmit={e => {
            void form.handleSubmit(handleSubmit)(e);
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: spacing[8],
            }}
          >
            {/* Logo Upload Section */}
            {organisation && (
              <div
                style={{
                  padding: spacing[6],
                  backgroundColor: colors.background.subtle,
                  borderRadius: '10px',
                  borderWidth: '1px',
                  borderStyle: 'solid',
                  borderColor: colors.border.DEFAULT,
                  boxShadow: componentShadows.card,
                  transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
                }}
              >
                <Label
                  className="text-sm font-medium flex items-center gap-2"
                  style={{
                    color: colors.text.DEFAULT,
                    marginBottom: spacing[4],
                  }}
                >
                  <Building2 className="h-4 w-4" />
                  Logo de l'organisation
                </Label>
                <LogoUploadButton
                  organisationId={organisation.id}
                  organisationName={organisation.name}
                  currentLogoUrl={organisation.logo_url}
                  onUploadSuccess={onLogoUploadSuccess}
                  size="xl"
                />
              </div>
            )}

            {/* Section 1: Informations générales */}
            <div>
              <h3
                className="text-lg font-semibold flex items-center gap-2"
                style={{
                  color: colors.text.DEFAULT,
                  marginBottom: spacing[4],
                }}
              >
                <Building2 className="h-5 w-5" />
                Informations générales
              </h3>

              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: spacing[4],
                }}
              >
                {/* Dénomination sociale (legal_name) */}
                <div>
                  <Label
                    htmlFor="name"
                    className="text-sm font-medium"
                    style={{
                      color: colors.text.DEFAULT,
                      display: 'block',
                      marginBottom: spacing[2],
                    }}
                  >
                    Dénomination sociale *
                  </Label>
                  <Input
                    id="name"
                    {...form.register('name')}
                    placeholder="Ex: SAS Mobilier Design"
                    disabled={isSubmitting}
                    className="transition-all duration-200"
                    style={{
                      borderColor: form.formState.errors.name
                        ? colors.danger[500]
                        : colors.border.DEFAULT,
                      color: colors.text.DEFAULT,
                      borderRadius: '8px',
                    }}
                  />
                  {form.formState.errors.name && (
                    <p
                      style={{
                        color: colors.danger[500],
                        fontSize: '0.875rem',
                        marginTop: spacing[1],
                      }}
                    >
                      {form.formState.errors.name.message}
                    </p>
                  )}
                </div>

                {/* Nom commercial différent */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: spacing[2],
                  }}
                >
                  <Checkbox
                    id="has_different_trade_name"
                    checked={form.watch('has_different_trade_name')}
                    onCheckedChange={checked => {
                      form.setValue(
                        'has_different_trade_name',
                        checked as boolean
                      );
                      if (!checked) {
                        form.setValue('trade_name', '');
                      }
                    }}
                    disabled={isSubmitting}
                  />
                  <Label
                    htmlFor="has_different_trade_name"
                    className="text-sm font-medium cursor-pointer"
                    style={{ color: colors.text.DEFAULT }}
                  >
                    Nom commercial différent
                  </Label>
                </div>

                {/* Trade Name (conditionnel) */}
                {form.watch('has_different_trade_name') && (
                  <div>
                    <Label
                      htmlFor="trade_name"
                      className="text-sm font-medium"
                      style={{
                        color: colors.text.DEFAULT,
                        display: 'block',
                        marginBottom: spacing[2],
                      }}
                    >
                      Nom commercial
                    </Label>
                    <Input
                      id="trade_name"
                      {...form.register('trade_name')}
                      placeholder="Ex: Marque XYZ"
                      disabled={isSubmitting}
                      className="transition-all duration-200"
                      style={{
                        borderColor: colors.border.DEFAULT,
                        color: colors.text.DEFAULT,
                        borderRadius: '8px',
                      }}
                    />
                  </div>
                )}

                {/* Active Status */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: spacing[2],
                  }}
                >
                  <Checkbox
                    id="is_active"
                    checked={form.watch('is_active')}
                    onCheckedChange={checked =>
                      form.setValue('is_active', checked as boolean)
                    }
                    disabled={isSubmitting}
                  />
                  <Label
                    htmlFor="is_active"
                    className="text-sm font-medium cursor-pointer"
                    style={{ color: colors.text.DEFAULT }}
                  >
                    Organisation active
                  </Label>
                </div>
              </div>
            </div>

            {/* Section 2: Adresse(s) — AddressAutocomplete unifié pour tous les types */}
            <div>
              <h3
                className="text-lg font-semibold flex items-center gap-2"
                style={{
                  color: colors.text.DEFAULT,
                  marginBottom: spacing[4],
                }}
              >
                <MapPin className="h-5 w-5" />
                Adresse de facturation
              </h3>

              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: spacing[3],
                }}
              >
                <AddressAutocomplete
                  value={form.watch('billing_address_line1') ?? ''}
                  onChange={value =>
                    form.setValue('billing_address_line1', value)
                  }
                  onSelect={handleBillingAddressSelect}
                  placeholder="Rechercher une adresse..."
                  id="org-billing-address"
                  disabled={isSubmitting}
                />
                <Input
                  id="billing_address_line2"
                  {...form.register('billing_address_line2')}
                  placeholder="Complément d'adresse (bâtiment, étage...)"
                  disabled={isSubmitting}
                  style={{
                    borderColor: colors.border.DEFAULT,
                    color: colors.text.DEFAULT,
                    borderRadius: '8px',
                  }}
                />
              </div>

              {/* Toggle adresse de livraison différente (clients uniquement) */}
              {isCustomer && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: spacing[2],
                    marginTop: spacing[4],
                  }}
                >
                  <Checkbox
                    id="has_different_shipping_org"
                    checked={form.watch('has_different_shipping_address')}
                    onCheckedChange={(checked: boolean) => {
                      form.setValue('has_different_shipping_address', checked);
                      if (!checked) {
                        form.setValue('shipping_address_line1', '');
                        form.setValue('shipping_address_line2', '');
                        form.setValue('shipping_postal_code', '');
                        form.setValue('shipping_city', '');
                        form.setValue('shipping_region', '');
                        form.setValue('shipping_country', 'FR');
                      }
                    }}
                  />
                  <Label
                    htmlFor="has_different_shipping_org"
                    className="text-sm font-medium cursor-pointer"
                    style={{ color: colors.text.DEFAULT }}
                  >
                    Adresse de livraison différente
                  </Label>
                </div>
              )}

              {/* Adresse de livraison (conditionnelle, clients uniquement) */}
              {isCustomer && form.watch('has_different_shipping_address') && (
                <div
                  style={{
                    marginTop: spacing[4],
                    paddingTop: spacing[4],
                    borderTop: `1px solid ${colors.border.DEFAULT}`,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: spacing[3],
                  }}
                >
                  <h3
                    className="text-lg font-semibold flex items-center gap-2"
                    style={{ color: colors.text.DEFAULT }}
                  >
                    <MapPin className="h-5 w-5" />
                    Adresse de livraison
                  </h3>
                  <AddressAutocomplete
                    value={form.watch('shipping_address_line1') ?? ''}
                    onChange={value =>
                      form.setValue('shipping_address_line1', value)
                    }
                    onSelect={handleShippingAddressSelect}
                    placeholder="Rechercher une adresse de livraison..."
                    id="org-shipping-address"
                    disabled={isSubmitting}
                  />
                  <Input
                    id="shipping_address_line2"
                    {...form.register('shipping_address_line2')}
                    placeholder="Complément d'adresse (bâtiment, étage...)"
                    disabled={isSubmitting}
                    style={{
                      borderColor: colors.border.DEFAULT,
                      color: colors.text.DEFAULT,
                      borderRadius: '8px',
                    }}
                  />
                </div>
              )}

              {/* Coordonnées GPS (lecture seule) */}
              {(form.watch('latitude') ?? form.watch('longitude')) && (
                <div
                  style={{
                    marginTop: spacing[3],
                    backgroundColor: '#f0fdf4',
                    border: '1px solid #bbf7d0',
                    borderRadius: '8px',
                    padding: spacing[3],
                  }}
                >
                  <div className="flex items-center gap-2 text-green-700">
                    <Navigation className="h-4 w-4" />
                    <span className="text-sm font-medium">Coordonnées GPS</span>
                    <span className="text-xs text-green-600 ml-auto">
                      (mises à jour automatiquement)
                    </span>
                  </div>
                  <div className="mt-1 pl-6 text-sm text-green-800 font-mono">
                    {form.watch('latitude')?.toFixed(6)},{' '}
                    {form.watch('longitude')?.toFixed(6)}
                  </div>
                </div>
              )}
            </div>

            {/* Section 3bis: Rattachement Enseigne (clients B2B uniquement) */}
            {isCustomer && (
              <div>
                <h3
                  className="text-lg font-semibold flex items-center gap-2"
                  style={{
                    color: colors.text.DEFAULT,
                    marginBottom: spacing[4],
                  }}
                >
                  <Store className="h-5 w-5" />
                  Rattachement enseigne
                </h3>

                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: spacing[4],
                  }}
                >
                  {/* Enseigne Select */}
                  <div>
                    <Label
                      htmlFor="enseigne_id"
                      className="text-sm font-medium"
                      style={{
                        color: colors.text.DEFAULT,
                        display: 'block',
                        marginBottom: spacing[2],
                      }}
                    >
                      Rattacher à une enseigne (facultatif)
                    </Label>
                    <Select
                      value={form.watch('enseigne_id') ?? '__none__'}
                      onValueChange={value => {
                        if (value === '__none__') {
                          form.setValue('enseigne_id', null);
                          form.setValue('ownership_type', null);
                        } else {
                          form.setValue('enseigne_id', value);
                        }
                      }}
                      disabled={isSubmitting ?? enseignesLoading}
                    >
                      <SelectTrigger
                        style={{
                          borderColor: colors.border.DEFAULT,
                          color: colors.text.DEFAULT,
                          borderRadius: '8px',
                        }}
                      >
                        <SelectValue placeholder="Aucune enseigne" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">Aucune</SelectItem>
                        {enseignes.map(enseigne => (
                          <SelectItem key={enseigne.id} value={enseigne.id}>
                            {enseigne.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Ownership Type (conditionnel: visible si enseigne sélectionnée) */}
                  {form.watch('enseigne_id') && (
                    <div>
                      <Label
                        className="text-sm font-medium"
                        style={{
                          color: colors.text.DEFAULT,
                          display: 'block',
                          marginBottom: spacing[2],
                        }}
                      >
                        Type de rattachement (facultatif)
                      </Label>
                      <RadioGroup
                        value={form.watch('ownership_type') ?? ''}
                        onValueChange={value => {
                          form.setValue(
                            'ownership_type',
                            value as 'succursale' | 'franchise' | 'propre'
                          );
                        }}
                        orientation="vertical"
                        spacing="sm"
                      >
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: spacing[2],
                          }}
                        >
                          <RadioGroupItem
                            value="succursale"
                            id="ownership_succursale"
                          />
                          <Label
                            htmlFor="ownership_succursale"
                            className="text-sm cursor-pointer"
                            style={{ color: colors.text.DEFAULT }}
                          >
                            Propre (succursale)
                          </Label>
                        </div>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: spacing[2],
                          }}
                        >
                          <RadioGroupItem
                            value="franchise"
                            id="ownership_franchise"
                          />
                          <Label
                            htmlFor="ownership_franchise"
                            className="text-sm cursor-pointer"
                            style={{ color: colors.text.DEFAULT }}
                          >
                            Franchise
                          </Label>
                        </div>
                      </RadioGroup>
                      <p
                        className="flex items-center gap-1"
                        style={{
                          color: colors.text.muted,
                          fontSize: '0.75rem',
                          marginTop: spacing[2],
                        }}
                      >
                        <Info className="h-3 w-3" />
                        Si &quot;Propre&quot;, les conditions commerciales
                        seront héritées de l&apos;enseigne
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Section 4: Informations légales */}
            <div>
              <h3
                className="text-lg font-semibold flex items-center gap-2"
                style={{
                  color: colors.text.DEFAULT,
                  marginBottom: spacing[4],
                }}
              >
                <FileText className="h-5 w-5" />
                Informations légales
              </h3>

              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: spacing[4],
                }}
              >
                {/* Row 1: Forme juridique + SIREN + SIRET */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: spacing[4],
                  }}
                >
                  {/* Legal Form */}
                  <div>
                    <Label
                      htmlFor="legal_form"
                      className="text-sm font-medium"
                      style={{
                        color: colors.text.DEFAULT,
                        display: 'block',
                        marginBottom: spacing[2],
                      }}
                    >
                      Forme juridique
                    </Label>
                    <Select
                      value={form.watch('legal_form')}
                      onValueChange={value =>
                        form.setValue('legal_form', value)
                      }
                      disabled={isSubmitting}
                    >
                      <SelectTrigger
                        style={{
                          borderColor: colors.border.DEFAULT,
                          color: colors.text.DEFAULT,
                        }}
                      >
                        <SelectValue placeholder="Sélectionner..." />
                      </SelectTrigger>
                      <SelectContent>
                        {LEGAL_FORMS.map(legalForm => (
                          <SelectItem
                            key={legalForm.value}
                            value={legalForm.value}
                          >
                            {legalForm.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* SIREN */}
                  <div>
                    <Label
                      htmlFor="siren"
                      className="text-sm font-medium"
                      style={{
                        color: colors.text.DEFAULT,
                        display: 'block',
                        marginBottom: spacing[2],
                      }}
                    >
                      SIREN
                    </Label>
                    <Input
                      id="siren"
                      {...form.register('siren')}
                      placeholder="123 456 789"
                      disabled={isSubmitting}
                      style={{
                        borderColor: colors.border.DEFAULT,
                        color: colors.text.DEFAULT,
                        borderRadius: '8px',
                      }}
                    />
                  </div>

                  {/* SIRET */}
                  <div>
                    <Label
                      htmlFor="siret"
                      className="text-sm font-medium"
                      style={{
                        color: colors.text.DEFAULT,
                        display: 'block',
                        marginBottom: spacing[2],
                      }}
                    >
                      SIRET
                    </Label>
                    <Input
                      id="siret"
                      {...form.register('siret')}
                      placeholder="123 456 789 00012"
                      disabled={isSubmitting}
                      style={{
                        borderColor: colors.border.DEFAULT,
                        color: colors.text.DEFAULT,
                        borderRadius: '8px',
                      }}
                    />
                  </div>
                </div>

                {/* Row 2: TVA + Secteur d'activité */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, 1fr)',
                    gap: spacing[4],
                  }}
                >
                  {/* VAT Number */}
                  <div>
                    <Label
                      htmlFor="vat_number"
                      className="text-sm font-medium"
                      style={{
                        color: colors.text.DEFAULT,
                        display: 'block',
                        marginBottom: spacing[2],
                      }}
                    >
                      N° TVA intracommunautaire
                    </Label>
                    <Input
                      id="vat_number"
                      {...form.register('vat_number')}
                      placeholder="FR12345678901"
                      disabled={isSubmitting}
                      style={{
                        borderColor: colors.border.DEFAULT,
                        color: colors.text.DEFAULT,
                        borderRadius: '8px',
                      }}
                    />
                  </div>

                  {/* Industry Sector */}
                  <div>
                    <Label
                      htmlFor="industry_sector"
                      className="text-sm font-medium"
                      style={{
                        color: colors.text.DEFAULT,
                        display: 'block',
                        marginBottom: spacing[2],
                      }}
                    >
                      Secteur d'activité
                    </Label>
                    <Input
                      id="industry_sector"
                      {...form.register('industry_sector')}
                      placeholder="Ex: Mobilier, Décoration, Textile"
                      disabled={isSubmitting}
                      style={{
                        borderColor: colors.border.DEFAULT,
                        color: colors.text.DEFAULT,
                        borderRadius: '8px',
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Section 5: Informations commerciales */}
            <div>
              <h3
                className="text-lg font-semibold flex items-center gap-2"
                style={{
                  color: colors.text.DEFAULT,
                  marginBottom: spacing[4],
                }}
              >
                <CreditCard className="h-5 w-5" />
                Informations commerciales
              </h3>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: spacing[4],
                }}
              >
                {/* Currency */}
                <div>
                  <Label
                    htmlFor="currency"
                    className="text-sm font-medium"
                    style={{
                      color: colors.text.DEFAULT,
                      display: 'block',
                      marginBottom: spacing[2],
                    }}
                  >
                    Devise
                  </Label>
                  <Select
                    value={form.watch('currency')}
                    onValueChange={value => form.setValue('currency', value)}
                    disabled={isSubmitting}
                  >
                    <SelectTrigger
                      style={{
                        borderColor: colors.border.DEFAULT,
                        color: colors.text.DEFAULT,
                        borderRadius: '8px',
                      }}
                    >
                      <SelectValue placeholder="Sélectionner une devise" />
                    </SelectTrigger>
                    <SelectContent>
                      {CURRENCIES.map(currency => (
                        <SelectItem key={currency.value} value={currency.value}>
                          {currency.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Payment Terms */}
                <div>
                  <Label
                    htmlFor="payment_terms"
                    className="text-sm font-medium"
                    style={{
                      color: colors.text.DEFAULT,
                      display: 'block',
                      marginBottom: spacing[2],
                    }}
                  >
                    Conditions de paiement
                  </Label>
                  <Select
                    value={form.watch('payment_terms')}
                    onValueChange={value =>
                      form.setValue('payment_terms', value)
                    }
                    disabled={isSubmitting}
                  >
                    <SelectTrigger
                      style={{
                        borderColor: colors.border.DEFAULT,
                        color: colors.text.DEFAULT,
                        borderRadius: '8px',
                      }}
                    >
                      <SelectValue placeholder="Sélectionner des conditions" />
                    </SelectTrigger>
                    <SelectContent>
                      {PAYMENT_TERMS_OPTIONS.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Section 6: Notes */}
            <div>
              <h3
                className="text-lg font-semibold flex items-center gap-2"
                style={{
                  color: colors.text.DEFAULT,
                  marginBottom: spacing[4],
                }}
              >
                <FileText className="h-5 w-5" />
                Notes
              </h3>

              <Textarea
                {...form.register('notes')}
                placeholder="Notes ou informations complémentaires..."
                rows={4}
                disabled={isSubmitting}
                className="transition-all duration-200"
                style={{
                  borderColor: colors.border.DEFAULT,
                  color: colors.text.DEFAULT,
                  backgroundColor: colors.background.DEFAULT,
                  borderRadius: '8px',
                }}
              />
            </div>

            {/* Section 7: Contacts */}
            <div>
              <h3
                className="text-lg font-semibold flex items-center gap-2"
                style={{
                  color: colors.text.DEFAULT,
                  marginBottom: spacing[4],
                }}
              >
                <Users className="h-5 w-5" />
                Contacts
              </h3>

              <OrganisationContactsManager
                organisationId={organisation?.id}
                mode={mode}
              />
            </div>

            {/* Custom Sections */}
            {customSections}

            {/* Footer Actions */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: spacing[3],
                paddingTop: spacing[6],
                borderTopWidth: '1px',
                borderTopStyle: 'solid',
                borderTopColor: colors.border.DEFAULT,
              }}
            >
              <ButtonV2
                type="button"
                variant="secondary"
                onClick={handleClose}
                disabled={isSubmitting}
              >
                Annuler
              </ButtonV2>
              <ButtonV2 type="submit" variant="primary" disabled={isSubmitting}>
                {isSubmitting
                  ? 'Enregistrement...'
                  : mode === 'edit'
                    ? 'Mettre à jour'
                    : 'Créer'}
              </ButtonV2>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

'use client';

import { useState, useEffect } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { Building2, MapPin, FileText, CreditCard, Users } from 'lucide-react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';

import { ButtonV2 } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { spacing, colors, componentShadows } from '@verone/ui/design-system';
import { AddressSelector } from '@/shared/modules/common/components/address/AddressSelector';
import type { Organisation } from '@/shared/modules/organisations/hooks';

import { LogoUploadButton } from './logo-upload-button';
import { OrganisationContactsManager } from './organisation-contacts-manager';

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
  country: z.string().min(1, 'Le pays est obligatoire'),
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

  // Légal
  legal_form: z.string().optional().or(z.literal('')),
  siret: z.string().optional().or(z.literal('')),
  vat_number: z.string().optional().or(z.literal('')),
  industry_sector: z.string().optional().or(z.literal('')),

  // Commercial
  currency: z.string().default('EUR'),
  payment_terms: z.string().optional().or(z.literal('')),

  // Supplier specific
  supplier_segment: z.string().optional().or(z.literal('')),
});

export type OrganisationFormData = z.infer<typeof baseOrganisationSchema>;

// ========================
// CONSTANTS
// ========================

const COUNTRIES = [
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

const SUPPLIER_SEGMENTS = [
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
      legal_form: '',
      siret: '',
      vat_number: '',
      industry_sector: '',
      currency: 'EUR',
      payment_terms: '',
      supplier_segment: '',
    };
  }

  return {
    name: organisation.name,
    country: organisation.country || 'FR',
    is_active: organisation.is_active,
    notes: organisation.notes || '',
    // Adresse de facturation
    billing_address_line1: organisation.billing_address_line1 || '',
    billing_address_line2: organisation.billing_address_line2 || '',
    billing_postal_code: organisation.billing_postal_code || '',
    billing_city: organisation.billing_city || '',
    billing_region: organisation.billing_region || '',
    billing_country: organisation.billing_country || 'FR',
    // Adresse de livraison
    shipping_address_line1: organisation.shipping_address_line1 || '',
    shipping_address_line2: organisation.shipping_address_line2 || '',
    shipping_postal_code: organisation.shipping_postal_code || '',
    shipping_city: organisation.shipping_city || '',
    shipping_region: organisation.shipping_region || '',
    shipping_country: organisation.shipping_country || 'FR',
    has_different_shipping_address:
      organisation.has_different_shipping_address || false,
    legal_form: organisation.legal_form || '',
    siret: organisation.siret || '',
    vat_number: organisation.vat_number || '',
    industry_sector: organisation.industry_sector || '',
    currency: organisation.currency || 'EUR',
    payment_terms: organisation.payment_terms || '',
    supplier_segment: organisation.supplier_segment || '',
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
  onSuccess,
  organisationType,
  organisation = null,
  mode = 'create',
  title,
  onLogoUploadSuccess,
  customSections,
}: UnifiedOrganisationFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isCustomer = organisationType === 'customer';

  const form = useForm<OrganisationFormData>({
    resolver: zodResolver(baseOrganisationSchema) as any,
    defaultValues: getDefaultValues(organisation),
  });

  useEffect(() => {
    if (isOpen) {
      form.reset(getDefaultValues(organisation));
    }
  }, [isOpen, organisation]);

  const handleSubmit = async (data: OrganisationFormData) => {
    setIsSubmitting(true);
    try {
      await onSubmit(data, organisation?.id);
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
    title ||
    `${mode === 'edit' ? 'Modifier' : 'Créer'} ${getOrganisationTypeLabel(organisationType)}`;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent
        className="max-w-4xl max-h-[90vh] overflow-y-auto"
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

        <form onSubmit={form.handleSubmit(handleSubmit as any)}>
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
                {/* Name */}
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
                    Nom de l'organisation *
                  </Label>
                  <Input
                    id="name"
                    {...form.register('name')}
                    placeholder="Ex: Entreprise ABC"
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

                {/* Country */}
                <div>
                  <Label
                    htmlFor="country"
                    className="text-sm font-medium"
                    style={{
                      color: colors.text.DEFAULT,
                      display: 'block',
                      marginBottom: spacing[2],
                    }}
                  >
                    Pays *
                  </Label>
                  <Select
                    value={form.watch('country')}
                    onValueChange={value => form.setValue('country', value)}
                    disabled={isSubmitting}
                  >
                    <SelectTrigger
                      className="transition-all duration-200"
                      style={{
                        borderColor: form.formState.errors.country
                          ? colors.danger[500]
                          : colors.border.DEFAULT,
                        color: colors.text.DEFAULT,
                        borderRadius: '8px',
                      }}
                    >
                      <SelectValue placeholder="Sélectionner un pays" />
                    </SelectTrigger>
                    <SelectContent>
                      {COUNTRIES.map(country => (
                        <SelectItem key={country.value} value={country.value}>
                          {country.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {form.formState.errors.country && (
                    <p
                      style={{
                        color: colors.danger[500],
                        fontSize: '0.875rem',
                        marginTop: spacing[1],
                      }}
                    >
                      {form.formState.errors.country.message}
                    </p>
                  )}
                </div>

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

            {/* Section 2: Adresse(s) - Conditionnelle selon type d'organisation */}
            {isCustomer ? (
              // CLIENTS B2B: Adresses facturation + livraison (avec AddressSelector)
              <AddressSelector form={form} />
            ) : (
              // FOURNISSEURS/PRESTATAIRES: Adresse de facturation uniquement
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
                    gap: spacing[4],
                  }}
                >
                  {/* Billing Address Line 1 */}
                  <div>
                    <Label
                      htmlFor="billing_address_line1"
                      className="text-sm font-medium"
                      style={{
                        color: colors.text.DEFAULT,
                        display: 'block',
                        marginBottom: spacing[2],
                      }}
                    >
                      Adresse ligne 1
                    </Label>
                    <Input
                      id="billing_address_line1"
                      {...form.register('billing_address_line1')}
                      placeholder="123 Rue de la Paix"
                      disabled={isSubmitting}
                      style={{
                        borderColor: colors.border.DEFAULT,
                        color: colors.text.DEFAULT,
                        borderRadius: '8px',
                      }}
                    />
                  </div>

                  {/* Billing Address Line 2 */}
                  <div>
                    <Label
                      htmlFor="billing_address_line2"
                      className="text-sm font-medium"
                      style={{
                        color: colors.text.DEFAULT,
                        display: 'block',
                        marginBottom: spacing[2],
                      }}
                    >
                      Adresse ligne 2
                    </Label>
                    <Input
                      id="billing_address_line2"
                      {...form.register('billing_address_line2')}
                      placeholder="Bâtiment A, 2ème étage"
                      disabled={isSubmitting}
                      style={{
                        borderColor: colors.border.DEFAULT,
                        color: colors.text.DEFAULT,
                        borderRadius: '8px',
                      }}
                    />
                  </div>

                  {/* Billing Postal Code + City */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 2fr',
                      gap: spacing[3],
                    }}
                  >
                    <div>
                      <Label
                        htmlFor="billing_postal_code"
                        className="text-sm font-medium"
                        style={{
                          color: colors.text.DEFAULT,
                          display: 'block',
                          marginBottom: spacing[2],
                        }}
                      >
                        Code postal
                      </Label>
                      <Input
                        id="billing_postal_code"
                        {...form.register('billing_postal_code')}
                        placeholder="75001"
                        disabled={isSubmitting}
                        style={{
                          borderColor: colors.border.DEFAULT,
                          color: colors.text.DEFAULT,
                          borderRadius: '8px',
                        }}
                      />
                    </div>

                    <div>
                      <Label
                        htmlFor="billing_city"
                        className="text-sm font-medium"
                        style={{
                          color: colors.text.DEFAULT,
                          display: 'block',
                          marginBottom: spacing[2],
                        }}
                      >
                        Ville
                      </Label>
                      <Input
                        id="billing_city"
                        {...form.register('billing_city')}
                        placeholder="Paris"
                        disabled={isSubmitting}
                        style={{
                          borderColor: colors.border.DEFAULT,
                          color: colors.text.DEFAULT,
                          borderRadius: '8px',
                        }}
                      />
                    </div>
                  </div>

                  {/* Billing Region */}
                  <div>
                    <Label
                      htmlFor="billing_region"
                      className="text-sm font-medium"
                      style={{
                        color: colors.text.DEFAULT,
                        display: 'block',
                        marginBottom: spacing[2],
                      }}
                    >
                      Région / État
                    </Label>
                    <Input
                      id="billing_region"
                      {...form.register('billing_region')}
                      placeholder="Île-de-France"
                      disabled={isSubmitting}
                      style={{
                        borderColor: colors.border.DEFAULT,
                        color: colors.text.DEFAULT,
                        borderRadius: '8px',
                      }}
                    />
                  </div>

                  {/* Billing Country */}
                  <div>
                    <Label
                      htmlFor="billing_country"
                      className="text-sm font-medium"
                      style={{
                        color: colors.text.DEFAULT,
                        display: 'block',
                        marginBottom: spacing[2],
                      }}
                    >
                      Pays
                    </Label>
                    <Select
                      value={form.watch('billing_country')}
                      onValueChange={value =>
                        form.setValue('billing_country', value)
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
                        <SelectValue placeholder="Sélectionner un pays" />
                      </SelectTrigger>
                      <SelectContent>
                        {COUNTRIES.map(country => (
                          <SelectItem key={country.value} value={country.value}>
                            {country.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
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
                    onValueChange={value => form.setValue('legal_form', value)}
                    disabled={isSubmitting}
                  >
                    <SelectTrigger
                      style={{
                        borderColor: colors.border.DEFAULT,
                        color: colors.text.DEFAULT,
                      }}
                    >
                      <SelectValue placeholder="Sélectionner une forme juridique" />
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
                    }}
                  />
                </div>

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
                    Numéro TVA
                  </Label>
                  <Input
                    id="vat_number"
                    {...form.register('vat_number')}
                    placeholder="FR12345678901"
                    disabled={isSubmitting}
                    style={{
                      borderColor: colors.border.DEFAULT,
                      color: colors.text.DEFAULT,
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
                    }}
                  />
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
                  display: 'flex',
                  flexDirection: 'column',
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

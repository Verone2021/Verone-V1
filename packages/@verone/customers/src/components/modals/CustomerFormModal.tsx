'use client';

import { useState, useEffect } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import {
  useOrganisations,
  useActiveEnseignes,
  type Organisation,
} from '@verone/organisations/hooks';
import { AddressAutocomplete, type AddressResult } from '@verone/ui';
import { Button } from '@verone/ui';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@verone/ui';
import { Input } from '@verone/ui';
import { Label } from '@verone/ui';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@verone/ui';
import { Checkbox } from '@verone/ui';
import { Switch } from '@verone/ui';
import { Separator } from '@verone/ui';
import { Textarea } from '@verone/ui';
import {
  Loader2,
  Building2,
  MapPin,
  Navigation,
  Store,
  Mail,
  FileText,
  CreditCard,
  StickyNote,
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

// Schema de validation pour client professionnel
const customerSchema = z.object({
  name: z
    .string()
    .min(2, 'Le nom doit contenir au moins 2 caractères')
    .max(100, 'Le nom ne peut pas dépasser 100 caractères'),
  email: z.string().email('Email invalide').optional().or(z.literal('')),
  country: z
    .string()
    .min(2, 'Le pays doit contenir au moins 2 caractères')
    .default('FR'),
  description: z.string().optional(),
  phone: z.string().optional(),
  website: z.string().url('URL invalide').optional().or(z.literal('')),
  is_active: z.boolean().default(true),
  // Champs spécifiques clients professionnels
  customer_type: z.literal('professional'),
  legal_form: z.string().optional(),
  // NOUVEAU : Nom commercial (optionnel, différent de legal_name)
  business_name: z.string().max(100).optional().nullable(),
  // NOUVEAU : SIREN (9 chiffres, optionnel)
  siren: z
    .string()
    .regex(/^\d{9}$/, 'Le SIREN doit contenir exactement 9 chiffres')
    .optional()
    .or(z.literal('')),
  siret: z
    .string()
    .regex(/^\d{14}$/, 'Le SIRET doit contenir exactement 14 chiffres')
    .optional()
    .or(z.literal('')),
  vat_number: z.string().optional(),
  payment_terms: z.enum(['0', '30', '60', '90']).optional(),
  prepayment_required: z.boolean().default(false),
  currency: z.string().default('EUR'),

  // Enseigne (franchise/groupe)
  enseigne_id: z.string().optional().nullable(),
  is_enseigne_parent: z.boolean().default(false),
  ownership_type: z.enum(['succursale', 'franchise']).optional().nullable(),

  // Adresse de facturation
  billing_address_line1: z.string().optional(),
  billing_address_line2: z.string().optional(),
  billing_postal_code: z.string().optional(),
  billing_city: z.string().optional(),
  billing_region: z.string().optional(),
  billing_country: z.string().default('FR'),

  // Adresse de livraison
  shipping_address_line1: z.string().optional(),
  shipping_address_line2: z.string().optional(),
  shipping_postal_code: z.string().optional(),
  shipping_city: z.string().optional(),
  shipping_region: z.string().optional(),
  shipping_country: z.string().default('FR'),

  // Indicateur adresses différentes
  has_different_shipping_address: z.boolean().default(false),

  // Coordonnées GPS (remplies automatiquement par AddressAutocomplete)
  latitude: z.number().nullable().optional(),
  longitude: z.number().nullable().optional(),
});

type CustomerFormData = z.infer<typeof customerSchema>;

interface CustomerFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCustomerCreated?: (customer: Organisation) => void;
  onCustomerUpdated?: (customer: Organisation) => void;
  customer?: Organisation; // Pour l'édition
  mode?: 'create' | 'edit';
}

export function CustomerFormModal({
  isOpen,
  onClose,
  onCustomerCreated,
  onCustomerUpdated,
  customer,
  mode = 'create',
}: CustomerFormModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { createOrganisation, updateOrganisation } = useOrganisations();
  const { enseignes } = useActiveEnseignes();

  const form = useForm<CustomerFormData>({
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any -- Type mismatch react-hook-form optionals vs Zod schema
    resolver: zodResolver(customerSchema) as any,
    defaultValues: {
      name: '',
      email: '',
      country: 'FR',
      description: '',
      phone: '',
      website: '',
      is_active: true,
      customer_type: 'professional',
      legal_form: '',
      business_name: '',
      siren: '',
      siret: '',
      vat_number: '',
      payment_terms: '30',
      prepayment_required: false,
      currency: 'EUR',
      enseigne_id: null,
      is_enseigne_parent: false,
      ownership_type: null,
    },
  });

  // Pré-remplir le formulaire en mode édition
  useEffect(() => {
    if (mode === 'edit' && customer) {
      form.reset({
        name: customer.name ?? '',
        email: customer.email ?? '',
        country: customer.country ?? 'FR',
        description: customer.notes ?? '',
        phone: customer.phone ?? '',
        website: customer.website ?? '',
        is_active: customer.is_active ?? true,
        customer_type: 'professional',
        legal_form: customer.legal_form ?? '',
        business_name: customer.trade_name ?? '', // Mapper trade_name (DB) → business_name (UI)
        siren: customer.siren ?? '',
        siret: customer.siret ?? '',
        vat_number: customer.vat_number ?? '',
        payment_terms:
          (customer.payment_terms as '0' | '30' | '60' | '90') ?? '30',
        prepayment_required: customer.prepayment_required ?? false,
        currency: customer.currency ?? 'EUR',
        enseigne_id: customer.enseigne_id ?? null,
        is_enseigne_parent: customer.is_enseigne_parent ?? false,
        ownership_type: customer.ownership_type ?? null,
      });
    }
  }, [mode, customer, form]);

  const handleSubmit = async (data: CustomerFormData) => {
    setIsSubmitting(true);

    try {
      const customerData = {
        legal_name: data.name, // Nom légal requis en DB
        trade_name: data.business_name ?? undefined, // Nom commercial (alias UI: business_name)
        type: 'customer' as const,
        email: data.email ?? undefined,
        country: data.billing_country || data.country || 'FR',
        phone: data.phone ?? undefined,
        website: data.website ?? undefined,
        is_active: data.is_active,
        customer_type: data.customer_type,
        legal_form: data.legal_form ?? undefined,
        siren: data.siren ?? undefined,
        siret: data.siret ?? undefined,
        vat_number: data.vat_number ?? undefined,
        payment_terms: data.payment_terms ?? undefined,
        prepayment_required: data.prepayment_required,
        currency: data.currency,
        notes: data.description ?? undefined,
        enseigne_id: data.enseigne_id ?? undefined,
        is_enseigne_parent: data.is_enseigne_parent,
        ownership_type: data.ownership_type ?? undefined,
        // Adresses
        billing_address_line1: data.billing_address_line1 ?? undefined,
        billing_address_line2: data.billing_address_line2 ?? undefined,
        billing_postal_code: data.billing_postal_code ?? undefined,
        billing_city: data.billing_city ?? undefined,
        billing_region: data.billing_region ?? undefined,
        billing_country: data.billing_country || 'FR',
        shipping_address_line1: data.shipping_address_line1 ?? undefined,
        shipping_address_line2: data.shipping_address_line2 ?? undefined,
        shipping_postal_code: data.shipping_postal_code ?? undefined,
        shipping_city: data.shipping_city ?? undefined,
        shipping_region: data.shipping_region ?? undefined,
        shipping_country: data.shipping_country || 'FR',
        has_different_shipping_address: data.has_different_shipping_address,
        // Coordonnées GPS
        latitude: data.latitude ?? undefined,
        longitude: data.longitude ?? undefined,
      };

      if (mode === 'edit' && customer) {
        const updated = await updateOrganisation({
          id: customer.id,
          ...customerData,
        });
        if (updated && onCustomerUpdated) {
          onCustomerUpdated(updated);
        }
      } else {
        const created = await createOrganisation(customerData);
        if (created && onCustomerCreated) {
          onCustomerCreated(created);
        }
      }

      form.reset();
      onClose();
    } catch (error) {
      console.error("❌ Erreur lors de l'opération sur le client:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    form.reset();
    onClose();
  };

  // Handlers pour AddressAutocomplete
  const handleBillingAddressSelect = (address: AddressResult) => {
    form.setValue('billing_address_line1', address.streetAddress);
    form.setValue('billing_city', address.city);
    form.setValue('billing_postal_code', address.postalCode);
    form.setValue('billing_region', address.region || '');
    form.setValue('billing_country', address.countryCode || 'FR');
    // GPS si pas d'adresse livraison différente
    if (!form.getValues('has_different_shipping_address')) {
      form.setValue('latitude', address.latitude || null);
      form.setValue('longitude', address.longitude || null);
    }
  };

  const handleShippingAddressSelect = (address: AddressResult) => {
    form.setValue('shipping_address_line1', address.streetAddress);
    form.setValue('shipping_city', address.city);
    form.setValue('shipping_postal_code', address.postalCode);
    form.setValue('shipping_region', address.region || '');
    form.setValue('shipping_country', address.countryCode || 'FR');
    // GPS = adresse de livraison si différente
    form.setValue('latitude', address.latitude || null);
    form.setValue('longitude', address.longitude || null);
  };

  // Options de pays fréquents
  const countries = [
    { code: 'FR', name: 'France' },
    { code: 'BE', name: 'Belgique' },
    { code: 'CH', name: 'Suisse' },
    { code: 'LU', name: 'Luxembourg' },
    { code: 'DE', name: 'Allemagne' },
    { code: 'IT', name: 'Italie' },
    { code: 'ES', name: 'Espagne' },
    { code: 'UK', name: 'Royaume-Uni' },
  ];

  // Options de formes juridiques
  const legalForms = [
    'SARL',
    'SAS',
    'SA',
    'SNC',
    'EURL',
    'Micro-entreprise',
    'Auto-entrepreneur',
    'Association',
    'Autre',
  ];

  // Options de conditions de paiement
  const paymentTermsOptions = [
    { value: '0', label: 'Paiement immédiat (0 jours)' },
    { value: '30', label: '30 jours net' },
    { value: '60', label: '60 jours net' },
    { value: '90', label: '90 jours net' },
  ];

  // Options de devises
  const currencies = [
    { code: 'EUR', name: 'Euro (€)' },
    { code: 'USD', name: 'Dollar US ($)' },
    { code: 'GBP', name: 'Livre Sterling (£)' },
    { code: 'CHF', name: 'Franc Suisse (CHF)' },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Building2 className="h-5 w-5" />
            {mode === 'edit'
              ? 'Modifier le client professionnel'
              : 'Nouveau client professionnel'}
          </DialogTitle>
        </DialogHeader>

        <form
          onSubmit={e => {
            void form
              .handleSubmit(handleSubmit)(e)
              .catch((error: unknown) => {
                console.error('[CustomerFormModal] Submit failed:', error);
              });
          }}
          className="space-y-6"
        >
          {/* 1. Enseigne */}
          {enseignes.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Store className="h-4 w-4 text-muted-foreground" />
                <h3 className="text-sm font-medium text-muted-foreground">
                  Enseigne
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="enseigne_id">Enseigne</Label>
                  <Select
                    value={form.watch('enseigne_id') ?? '__none__'}
                    onValueChange={value =>
                      form.setValue(
                        'enseigne_id',
                        value === '__none__' ? null : value
                      )
                    }
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Aucune enseigne" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">Aucune enseigne</SelectItem>
                      {enseignes.map(enseigne => (
                        <SelectItem key={enseigne.id} value={enseigne.id}>
                          {enseigne.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {form.watch('enseigne_id') && (
                  <>
                    <div>
                      <Label htmlFor="ownership_type">Type de propriété</Label>
                      <Select
                        value={form.watch('ownership_type') ?? '__none__'}
                        onValueChange={value =>
                          form.setValue(
                            'ownership_type',
                            value === '__none__'
                              ? null
                              : (value as 'succursale' | 'franchise')
                          )
                        }
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Non défini" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__none__">Non défini</SelectItem>
                          <SelectItem value="succursale">
                            Succursale (propre)
                          </SelectItem>
                          <SelectItem value="franchise">Franchise</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-end pb-1">
                      <div className="flex items-center space-x-3">
                        <Switch
                          id="is_enseigne_parent"
                          checked={form.watch('is_enseigne_parent')}
                          onCheckedChange={checked =>
                            form.setValue('is_enseigne_parent', checked)
                          }
                        />
                        <div>
                          <Label
                            htmlFor="is_enseigne_parent"
                            className="font-medium text-sm"
                          >
                            Société mère
                          </Label>
                          <p className="text-xs text-gray-400">
                            Holding de l&apos;enseigne
                          </p>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* 2. Entreprise */}
          <Separator />
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              <h3 className="text-sm font-medium text-muted-foreground">
                Entreprise
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="name">Dénomination sociale *</Label>
                <Input
                  id="name"
                  {...form.register('name')}
                  placeholder="Ex: SAS Mobilier Design"
                  className="mt-1"
                />
                {form.formState.errors.name && (
                  <p className="text-red-500 text-sm mt-1">
                    {form.formState.errors.name.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="business_name">
                  Nom commercial
                  <span className="text-gray-400 ml-1 font-normal">
                    (si différent)
                  </span>
                </Label>
                <Input
                  id="business_name"
                  {...form.register('business_name')}
                  placeholder="Ex: Pokawa Paris 1"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="legal_form">Forme juridique</Label>
                <Select
                  value={form.watch('legal_form')}
                  onValueChange={value => form.setValue('legal_form', value)}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Sélectionner..." />
                  </SelectTrigger>
                  <SelectContent>
                    {legalForms.map(lf => (
                      <SelectItem key={lf} value={lf}>
                        {lf}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* 3. Légal */}
          <Separator />
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <h3 className="text-sm font-medium text-muted-foreground">
                Légal
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="siren">SIREN</Label>
                <Input
                  id="siren"
                  {...form.register('siren')}
                  placeholder="123 456 789"
                  maxLength={9}
                  className="mt-1"
                />
                {form.formState.errors.siren && (
                  <p className="text-red-500 text-sm mt-1">
                    {form.formState.errors.siren.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="siret">SIRET</Label>
                <Input
                  id="siret"
                  {...form.register('siret')}
                  placeholder="123 456 789 00012"
                  maxLength={14}
                  className="mt-1"
                />
                {form.formState.errors.siret && (
                  <p className="text-red-500 text-sm mt-1">
                    {form.formState.errors.siret.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="vat_number">TVA intracommunautaire</Label>
                <Input
                  id="vat_number"
                  {...form.register('vat_number')}
                  placeholder="FR12345678901"
                  className="mt-1"
                />
              </div>
            </div>
          </div>

          {/* 4. Adresses */}
          <Separator />
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <h3 className="text-sm font-medium text-muted-foreground">
                Adresses
              </h3>
            </div>

            {/* Adresse de facturation */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-gray-700">
                Adresse de facturation
              </h4>
              <AddressAutocomplete
                value={form.watch('billing_address_line1') || ''}
                onChange={value =>
                  form.setValue('billing_address_line1', value)
                }
                onSelect={handleBillingAddressSelect}
                placeholder="Rechercher une adresse..."
                id="billing-address-create"
              />
              <Input
                {...form.register('billing_address_line2')}
                placeholder="Complément d'adresse (bâtiment, étage...)"
              />
            </div>

            {/* Toggle adresse de livraison différente */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="has_different_shipping"
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
                htmlFor="has_different_shipping"
                className="text-sm font-medium cursor-pointer"
              >
                Adresse de livraison différente
              </Label>
            </div>

            {/* Adresse de livraison (conditionnelle) */}
            {form.watch('has_different_shipping_address') && (
              <div className="space-y-3 border-t border-gray-200 pt-3">
                <h4 className="text-sm font-medium text-gray-700">
                  Adresse de livraison
                </h4>
                <AddressAutocomplete
                  value={form.watch('shipping_address_line1') || ''}
                  onChange={value =>
                    form.setValue('shipping_address_line1', value)
                  }
                  onSelect={handleShippingAddressSelect}
                  placeholder="Rechercher une adresse de livraison..."
                  id="shipping-address-create"
                />
                <Input
                  {...form.register('shipping_address_line2')}
                  placeholder="Complément d'adresse (bâtiment, étage...)"
                />
              </div>
            )}

            {/* Coordonnées GPS (lecture seule) */}
            {(form.watch('latitude') || form.watch('longitude')) && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
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

          {/* 5. Commercial */}
          <Separator />
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-muted-foreground" />
              <h3 className="text-sm font-medium text-muted-foreground">
                Commercial
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="payment_terms">Conditions de paiement</Label>
                <Select
                  value={form.watch('payment_terms')}
                  onValueChange={value =>
                    form.setValue(
                      'payment_terms',
                      value as '0' | '30' | '60' | '90'
                    )
                  }
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Sélectionner..." />
                  </SelectTrigger>
                  <SelectContent>
                    {paymentTermsOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="currency">Devise</Label>
                <Select
                  value={form.watch('currency')}
                  onValueChange={value => form.setValue('currency', value)}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Sélectionner..." />
                  </SelectTrigger>
                  <SelectContent>
                    {currencies.map(currency => (
                      <SelectItem key={currency.code} value={currency.code}>
                        {currency.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end pb-1">
                <div className="flex items-center space-x-3">
                  <Switch
                    id="is_active"
                    checked={form.watch('is_active')}
                    onCheckedChange={checked =>
                      form.setValue('is_active', checked)
                    }
                  />
                  <Label htmlFor="is_active" className="text-sm font-medium">
                    Client actif
                  </Label>
                </div>
              </div>
            </div>

            {/* Prépaiement conditionnel */}
            {form.watch('payment_terms') === '0' && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                <div className="flex items-center space-x-3">
                  <Switch
                    id="prepayment_required"
                    checked={form.watch('prepayment_required')}
                    onCheckedChange={checked =>
                      form.setValue('prepayment_required', checked)
                    }
                  />
                  <div className="flex-1">
                    <Label
                      htmlFor="prepayment_required"
                      className="text-gray-900 font-medium text-sm"
                    >
                      Prépaiement obligatoire
                    </Label>
                    <p className="text-xs text-gray-500">
                      {form.watch('prepayment_required')
                        ? "Commande bloquée jusqu'au règlement préalable"
                        : 'Envoi et facturation simultanés'}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 6. Contact */}
          <Separator />
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <h3 className="text-sm font-medium text-muted-foreground">
                Contact
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  {...form.register('email')}
                  placeholder="contact@entreprise.com"
                  className="mt-1"
                />
                {form.formState.errors.email && (
                  <p className="text-red-500 text-sm mt-1">
                    {form.formState.errors.email.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="phone">Téléphone</Label>
                <Input
                  id="phone"
                  {...form.register('phone')}
                  placeholder="01 23 45 67 89"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="website">Site web</Label>
                <Input
                  id="website"
                  type="url"
                  {...form.register('website')}
                  placeholder="https://www.entreprise.com"
                  className="mt-1"
                />
                {form.formState.errors.website && (
                  <p className="text-red-500 text-sm mt-1">
                    {form.formState.errors.website.message}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* 7. Notes */}
          <Separator />
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <StickyNote className="h-4 w-4 text-muted-foreground" />
              <h3 className="text-sm font-medium text-muted-foreground">
                Notes
              </h3>
            </div>

            <Textarea
              id="description"
              {...form.register('description')}
              placeholder="Notes sur le client, informations complémentaires..."
              rows={3}
            />
          </div>

          <Separator />
          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-black text-white hover:bg-gray-800"
            >
              {isSubmitting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {mode === 'edit' ? 'Mettre à jour' : 'Créer le client'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

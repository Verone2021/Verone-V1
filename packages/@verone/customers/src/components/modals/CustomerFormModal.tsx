'use client';

import { useState, useEffect } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { AddressSelector } from '@verone/common/components/address/AddressSelector';
import {
  useOrganisations,
  useActiveEnseignes,
  type Organisation,
} from '@verone/organisations/hooks';
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
import { Switch } from '@verone/ui';
import { Textarea } from '@verone/ui';
import { Loader2, Building2 } from 'lucide-react';
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
        country: data.country,
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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
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
          {/* Informations de base */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-black border-b pb-2">
              Informations de base
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Nom de l'entreprise *</Label>
                <Input
                  id="name"
                  {...form.register('name')}
                  placeholder="Ex: Entreprise ABC"
                  className="mt-1"
                />
                {form.formState.errors.name && (
                  <p className="text-red-500 text-sm mt-1">
                    {form.formState.errors.name.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="country">Pays</Label>
                <Select
                  value={form.watch('country')}
                  onValueChange={value => form.setValue('country', value)}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Sélectionner un pays" />
                  </SelectTrigger>
                  <SelectContent>
                    {countries.map(country => (
                      <SelectItem key={country.code} value={country.code}>
                        {country.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="description">Description / Notes</Label>
              <Textarea
                id="description"
                {...form.register('description')}
                placeholder="Description de l'activité, notes importantes..."
                className="mt-1"
                rows={3}
              />
            </div>
          </div>

          {/* Enseigne / Franchise */}
          {enseignes.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-black border-b pb-2">
                Enseigne / Franchise
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  <p className="text-xs text-gray-500 mt-1">
                    Associez ce client à une enseigne (groupe de franchises)
                  </p>
                </div>

                {form.watch('enseigne_id') && (
                  <div className="flex items-start pt-6">
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
                          className="font-medium"
                        >
                          Société mère
                        </Label>
                        <p className="text-xs text-gray-500">
                          Cochez si ce client est la holding/maison mère de
                          l'enseigne
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Type de propriété (succursale/franchise) */}
              {form.watch('enseigne_id') && (
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
                        Succursale (restaurant propre)
                      </SelectItem>
                      <SelectItem value="franchise">Franchise</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500 mt-1">
                    Succursale = détenu par l'enseigne, Franchise = franchisé
                    indépendant
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Informations de contact */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-black border-b pb-2">
              Contact
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

          {/* Informations légales */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-black border-b pb-2">
              Informations légales
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    {legalForms.map(form => (
                      <SelectItem key={form} value={form}>
                        {form}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="siren">SIREN</Label>
                <Input
                  id="siren"
                  {...form.register('siren')}
                  placeholder="123456789"
                  maxLength={9}
                  className="mt-1"
                />
                {form.formState.errors.siren && (
                  <p className="text-red-500 text-sm mt-1">
                    {form.formState.errors.siren.message}
                  </p>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  Numéro SIREN à 9 chiffres (identifiant unique de l'entreprise)
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="siret">SIRET</Label>
                <Input
                  id="siret"
                  {...form.register('siret')}
                  placeholder="12345678901234"
                  maxLength={14}
                  className="mt-1"
                />
                {form.formState.errors.siret && (
                  <p className="text-red-500 text-sm mt-1">
                    {form.formState.errors.siret.message}
                  </p>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  Numéro SIRET à 14 chiffres (SIREN + NIC de l'établissement)
                </p>
              </div>

              <div>
                <Label htmlFor="business_name">
                  Nom commercial
                  <span className="text-gray-500 ml-1">(si différent)</span>
                </Label>
                <Input
                  id="business_name"
                  {...form.register('business_name')}
                  placeholder="Ex: Pokawa Paris 1"
                  className="mt-1"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Nom sous lequel l'entreprise exerce son activité
                </p>
              </div>
            </div>

            <div>
              <Label htmlFor="vat_number">Numéro de TVA</Label>
              <Input
                id="vat_number"
                {...form.register('vat_number')}
                placeholder="FR12345678901"
                className="mt-1"
              />
            </div>
          </div>

          {/* Conditions commerciales */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-black border-b pb-2">
              Conditions commerciales
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            </div>

            {/* Prépaiement conditionnel */}
            {form.watch('payment_terms') === '0' && (
              <div className="bg-gray-50 border border-gray-300 rounded-lg p-4">
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
                      className="text-gray-900 font-medium"
                    >
                      Prépaiement obligatoire
                    </Label>
                    <p className="text-xs text-gray-900">
                      {form.watch('prepayment_required')
                        ? "Commande bloquée jusqu'au règlement préalable"
                        : 'Envoi et facturation simultanés'}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Adresses de facturation et livraison */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-black border-b pb-2">
              Adresses
            </h3>
            <AddressSelector form={form} />
          </div>

          {/* Statut */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-black border-b pb-2">
              Statut
            </h3>

            <div className="flex items-center space-x-3">
              <Switch
                id="is_active"
                checked={form.watch('is_active')}
                onCheckedChange={checked => form.setValue('is_active', checked)}
              />
              <Label htmlFor="is_active">Client actif</Label>
            </div>
          </div>

          <DialogFooter>
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

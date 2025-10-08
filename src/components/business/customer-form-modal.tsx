"use client"

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Loader2, Building2, Users } from 'lucide-react'
import { useOrganisations } from '@/hooks/use-organisations'
import { AddressSelector } from './address-selector'

// Schema de validation pour client professionnel
const customerSchema = z.object({
  name: z.string()
    .min(2, 'Le nom doit contenir au moins 2 caractères')
    .max(100, 'Le nom ne peut pas dépasser 100 caractères'),
  email: z.string()
    .email('Email invalide')
    .optional()
    .or(z.literal('')),
  country: z.string()
    .min(2, 'Le pays doit contenir au moins 2 caractères')
    .default('FR'),
  description: z.string().optional(),
  phone: z.string().optional(),
  website: z.string().url('URL invalide').optional().or(z.literal('')),
  is_active: z.boolean().default(true),
  // Champs spécifiques clients professionnels
  customer_type: z.literal('professional'),
  legal_form: z.string().optional(),
  siret: z.string().optional(),
  vat_number: z.string().optional(),
  payment_terms: z.enum(['0', '30', '60', '90']).optional(),
  prepayment_required: z.boolean().default(false),
  currency: z.string().default('EUR'),

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
  has_different_shipping_address: z.boolean().default(false)
})

type CustomerFormData = z.infer<typeof customerSchema>

interface Customer {
  id: string
  name: string
  email?: string
  country?: string
  phone?: string
  website?: string
  is_active: boolean
  customer_type?: 'professional' | 'individual'
  legal_form?: string
  siret?: string
  vat_number?: string
  payment_terms?: string
  prepayment_required?: boolean
  currency?: string
  notes?: string
}

interface CustomerFormModalProps {
  isOpen: boolean
  onClose: () => void
  onCustomerCreated?: (customer: Customer) => void
  onCustomerUpdated?: (customer: Customer) => void
  customer?: Customer // Pour l'édition
  mode?: 'create' | 'edit'
}

export function CustomerFormModal({
  isOpen,
  onClose,
  onCustomerCreated,
  onCustomerUpdated,
  customer,
  mode = 'create'
}: CustomerFormModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { createOrganisation, updateOrganisation } = useOrganisations()

  const form = useForm<CustomerFormData>({
    resolver: zodResolver(customerSchema),
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
      siret: '',
      vat_number: '',
      payment_terms: '30',
      prepayment_required: false,
      currency: 'EUR'
    }
  })

  // Pré-remplir le formulaire en mode édition
  useEffect(() => {
    if (mode === 'edit' && customer) {
      form.reset({
        name: customer.name || '',
        email: customer.email || '',
        country: customer.country || 'FR',
        description: customer.notes || '',
        phone: customer.phone || '',
        website: customer.website || '',
        is_active: customer.is_active ?? true,
        customer_type: 'professional',
        legal_form: customer.legal_form || '',
        siret: customer.siret || '',
        vat_number: customer.vat_number || '',
        payment_terms: (customer.payment_terms as '0' | '30' | '60' | '90') || '30',
        prepayment_required: customer.prepayment_required || false,
        currency: customer.currency || 'EUR'
      })
    }
  }, [mode, customer, form])

  const handleSubmit = async (data: CustomerFormData) => {
    setIsSubmitting(true)

    try {
      const customerData = {
        name: data.name,
        type: 'customer' as const,
        email: data.email || null,
        country: data.country,
        phone: data.phone || null,
        website: data.website || null,
        is_active: data.is_active,
        customer_type: data.customer_type,
        legal_form: data.legal_form || null,
        siret: data.siret || null,
        vat_number: data.vat_number || null,
        payment_terms: data.payment_terms || null,
        prepayment_required: data.prepayment_required,
        currency: data.currency,
        notes: data.description || null
      }

      if (mode === 'edit' && customer) {
        const updated = await updateOrganisation({
          id: customer.id,
          ...customerData
        })
        if (updated && onCustomerUpdated) {
          onCustomerUpdated(updated as Customer)
        }
      } else {
        const created = await createOrganisation(customerData)
        if (created && onCustomerCreated) {
          onCustomerCreated(created as Customer)
        }
      }

      form.reset()
      onClose()
    } catch (error) {
      console.error('❌ Erreur lors de l\'opération sur le client:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    form.reset()
    onClose()
  }

  // Options de pays fréquents
  const countries = [
    { code: 'FR', name: 'France' },
    { code: 'BE', name: 'Belgique' },
    { code: 'CH', name: 'Suisse' },
    { code: 'LU', name: 'Luxembourg' },
    { code: 'DE', name: 'Allemagne' },
    { code: 'IT', name: 'Italie' },
    { code: 'ES', name: 'Espagne' },
    { code: 'UK', name: 'Royaume-Uni' }
  ]

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
    'Autre'
  ]

  // Options de conditions de paiement
  const paymentTermsOptions = [
    { value: '0', label: 'Paiement immédiat (0 jours)' },
    { value: '30', label: '30 jours net' },
    { value: '60', label: '60 jours net' },
    { value: '90', label: '90 jours net' }
  ]

  // Options de devises
  const currencies = [
    { code: 'EUR', name: 'Euro (€)' },
    { code: 'USD', name: 'Dollar US ($)' },
    { code: 'GBP', name: 'Livre Sterling (£)' },
    { code: 'CHF', name: 'Franc Suisse (CHF)' }
  ]

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            {mode === 'edit' ? 'Modifier le client professionnel' : 'Nouveau client professionnel'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
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
                  onValueChange={(value) => form.setValue('country', value)}
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
                  onValueChange={(value) => form.setValue('legal_form', value)}
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
                <Label htmlFor="siret">SIRET</Label>
                <Input
                  id="siret"
                  {...form.register('siret')}
                  placeholder="12345678901234"
                  className="mt-1"
                />
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
                  onValueChange={(value) => form.setValue('payment_terms', value as '0' | '30' | '60' | '90')}
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
                  onValueChange={(value) => form.setValue('currency', value)}
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
                    onCheckedChange={(checked) => form.setValue('prepayment_required', checked)}
                  />
                  <div className="flex-1">
                    <Label htmlFor="prepayment_required" className="text-gray-900 font-medium">
                      Prépaiement obligatoire
                    </Label>
                    <p className="text-xs text-gray-900">
                      {form.watch('prepayment_required')
                        ? 'Commande bloquée jusqu\'au règlement préalable'
                        : 'Envoi et facturation simultanés'
                      }
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
                onCheckedChange={(checked) => form.setValue('is_active', checked)}
              />
              <Label htmlFor="is_active">
                Client actif
              </Label>
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
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {mode === 'edit' ? 'Mettre à jour' : 'Créer le client'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
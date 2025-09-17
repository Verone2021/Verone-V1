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
import { Loader2, User } from 'lucide-react'
import { useOrganisations } from '@/hooks/use-organisations'
import { AddressSelector } from './address-selector'

// Schema de validation pour client particulier
const individualCustomerSchema = z.object({
  name: z.string()
    .min(2, 'Le nom doit contenir au moins 2 caractères')
    .max(100, 'Le nom ne peut pas dépasser 100 caractères'),
  first_name: z.string()
    .min(2, 'Le prénom doit contenir au moins 2 caractères')
    .max(100, 'Le prénom ne peut pas dépasser 100 caractères'),
  email: z.string()
    .email('Email invalide')
    .optional()
    .or(z.literal('')),
  country: z.string()
    .min(2, 'Le pays doit contenir au moins 2 caractères')
    .default('FR'),
  description: z.string().optional(),
  phone: z.string().optional(),
  mobile_phone: z.string().optional(),
  is_active: z.boolean().default(true),

  // Champs spécifiques clients particuliers
  customer_type: z.literal('individual'),
  date_of_birth: z.string().optional(),
  nationality: z.string().optional(),
  preferred_language: z.string().default('FR'),
  communication_preference: z.enum(['email', 'phone', 'mail']).default('email'),
  marketing_consent: z.boolean().default(false),

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

type IndividualCustomerFormData = z.infer<typeof individualCustomerSchema>

interface IndividualCustomer {
  id: string
  name: string
  first_name?: string
  email?: string
  country?: string
  phone?: string
  mobile_phone?: string
  is_active: boolean
  customer_type?: 'individual'
  date_of_birth?: string
  nationality?: string
  preferred_language?: string
  communication_preference?: string
  marketing_consent?: boolean
  notes?: string
}

interface IndividualCustomerFormModalProps {
  isOpen: boolean
  onClose: () => void
  onCustomerCreated?: (customer: IndividualCustomer) => void
  onCustomerUpdated?: (customer: IndividualCustomer) => void
  customer?: IndividualCustomer // Pour l'édition
  mode?: 'create' | 'edit'
}

export function IndividualCustomerFormModal({
  isOpen,
  onClose,
  onCustomerCreated,
  onCustomerUpdated,
  customer,
  mode = 'create'
}: IndividualCustomerFormModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { createOrganisation, updateOrganisation } = useOrganisations()

  const form = useForm<IndividualCustomerFormData>({
    resolver: zodResolver(individualCustomerSchema),
    defaultValues: {
      name: '',
      first_name: '',
      email: '',
      country: 'FR',
      description: '',
      phone: '',
      mobile_phone: '',
      is_active: true,
      customer_type: 'individual',
      date_of_birth: '',
      nationality: 'FR',
      preferred_language: 'FR',
      communication_preference: 'email',
      marketing_consent: false
    }
  })

  // Pré-remplir le formulaire en mode édition
  useEffect(() => {
    if (mode === 'edit' && customer) {
      form.reset({
        name: customer.name || '',
        first_name: customer.first_name || '',
        email: customer.email || '',
        country: customer.country || 'FR',
        description: customer.notes || '',
        phone: customer.phone || '',
        mobile_phone: customer.mobile_phone || '',
        is_active: customer.is_active ?? true,
        customer_type: 'individual',
        date_of_birth: customer.date_of_birth || '',
        nationality: customer.nationality || 'FR',
        preferred_language: customer.preferred_language || 'FR',
        communication_preference: (customer.communication_preference as 'email' | 'phone' | 'mail') || 'email',
        marketing_consent: customer.marketing_consent || false
      })
    }
  }, [mode, customer, form])

  const handleSubmit = async (data: IndividualCustomerFormData) => {
    setIsSubmitting(true)

    try {
      const customerData = {
        name: data.name,
        first_name: data.first_name,
        type: 'customer' as const,
        email: data.email || null,
        country: data.country,
        phone: data.phone || null,
        mobile_phone: data.mobile_phone || null,
        is_active: data.is_active,
        customer_type: data.customer_type,
        date_of_birth: data.date_of_birth || null,
        nationality: data.nationality || null,
        preferred_language: data.preferred_language,
        communication_preference: data.communication_preference,
        marketing_consent: data.marketing_consent,
        notes: data.description || null,

        // Adresses
        billing_address_line1: data.billing_address_line1 || null,
        billing_address_line2: data.billing_address_line2 || null,
        billing_postal_code: data.billing_postal_code || null,
        billing_city: data.billing_city || null,
        billing_region: data.billing_region || null,
        billing_country: data.billing_country || 'FR',

        shipping_address_line1: data.shipping_address_line1 || null,
        shipping_address_line2: data.shipping_address_line2 || null,
        shipping_postal_code: data.shipping_postal_code || null,
        shipping_city: data.shipping_city || null,
        shipping_region: data.shipping_region || null,
        shipping_country: data.shipping_country || 'FR',

        has_different_shipping_address: data.has_different_shipping_address
      }

      if (mode === 'edit' && customer) {
        const updated = await updateOrganisation({
          id: customer.id,
          ...customerData
        })
        if (updated && onCustomerUpdated) {
          onCustomerUpdated(updated as IndividualCustomer)
        }
      } else {
        const created = await createOrganisation(customerData)
        if (created && onCustomerCreated) {
          onCustomerCreated(created as IndividualCustomer)
        }
      }

      form.reset()
      onClose()
    } catch (error) {
      console.error('❌ Erreur lors de l\'opération sur le client particulier:', error)
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

  // Options de langues
  const languages = [
    { code: 'FR', name: 'Français' },
    { code: 'EN', name: 'Anglais' },
    { code: 'DE', name: 'Allemand' },
    { code: 'IT', name: 'Italien' },
    { code: 'ES', name: 'Espagnol' }
  ]

  // Options de préférences de communication
  const communicationOptions = [
    { value: 'email', label: 'Email' },
    { value: 'phone', label: 'Téléphone' },
    { value: 'mail', label: 'Courrier postal' }
  ]

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            {mode === 'edit' ? 'Modifier le client particulier' : 'Nouveau client particulier'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          {/* Informations personnelles */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-black border-b pb-2">
              Informations personnelles
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Nom de famille *</Label>
                <Input
                  id="name"
                  {...form.register('name')}
                  placeholder="Ex: Martin"
                  className="mt-1"
                />
                {form.formState.errors.name && (
                  <p className="text-red-500 text-sm mt-1">
                    {form.formState.errors.name.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="first_name">Prénom *</Label>
                <Input
                  id="first_name"
                  {...form.register('first_name')}
                  placeholder="Ex: Jean"
                  className="mt-1"
                />
                {form.formState.errors.first_name && (
                  <p className="text-red-500 text-sm mt-1">
                    {form.formState.errors.first_name.message}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="date_of_birth">Date de naissance</Label>
                <Input
                  id="date_of_birth"
                  type="date"
                  {...form.register('date_of_birth')}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="nationality">Nationalité</Label>
                <Select
                  value={form.watch('nationality')}
                  onValueChange={(value) => form.setValue('nationality', value)}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Sélectionner..." />
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
              <Label htmlFor="description">Notes personnelles</Label>
              <Textarea
                id="description"
                {...form.register('description')}
                placeholder="Préférences, remarques particulières..."
                className="mt-1"
                rows={2}
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
                  placeholder="jean.martin@example.com"
                  className="mt-1"
                />
                {form.formState.errors.email && (
                  <p className="text-red-500 text-sm mt-1">
                    {form.formState.errors.email.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="phone">Téléphone fixe</Label>
                <Input
                  id="phone"
                  {...form.register('phone')}
                  placeholder="01 23 45 67 89"
                  className="mt-1"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="mobile_phone">Téléphone mobile</Label>
                <Input
                  id="mobile_phone"
                  {...form.register('mobile_phone')}
                  placeholder="06 12 34 56 78"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="preferred_language">Langue préférée</Label>
                <Select
                  value={form.watch('preferred_language')}
                  onValueChange={(value) => form.setValue('preferred_language', value)}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Sélectionner..." />
                  </SelectTrigger>
                  <SelectContent>
                    {languages.map(language => (
                      <SelectItem key={language.code} value={language.code}>
                        {language.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="communication_preference">Préférence de communication</Label>
              <Select
                value={form.watch('communication_preference')}
                onValueChange={(value) => form.setValue('communication_preference', value as 'email' | 'phone' | 'mail')}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Sélectionner..." />
                </SelectTrigger>
                <SelectContent>
                  {communicationOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Adresses de facturation et livraison */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-black border-b pb-2">
              Adresses
            </h3>
            <AddressSelector form={form} />
          </div>

          {/* Préférences marketing */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-black border-b pb-2">
              Préférences
            </h3>

            <div className="flex items-center space-x-3">
              <Switch
                id="marketing_consent"
                checked={form.watch('marketing_consent')}
                onCheckedChange={(checked) => form.setValue('marketing_consent', checked)}
              />
              <div>
                <Label htmlFor="marketing_consent">
                  Accepter les communications marketing
                </Label>
                <p className="text-xs text-gray-600">
                  Recevoir les newsletters, offres spéciales et actualités Vérone
                </p>
              </div>
            </div>
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
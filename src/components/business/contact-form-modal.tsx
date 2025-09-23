'use client'

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
import { Loader2, Phone, Users } from 'lucide-react'
import type { Contact } from '@/hooks/use-contacts'

// Schema de validation pour contact
const contactSchema = z.object({
  first_name: z.string()
    .min(2, 'Le prénom doit contenir au moins 2 caractères')
    .max(100, 'Le prénom ne peut pas dépasser 100 caractères'),
  last_name: z.string()
    .min(2, 'Le nom doit contenir au moins 2 caractères')
    .max(100, 'Le nom ne peut pas dépasser 100 caractères'),
  title: z.string().optional(),
  department: z.string().optional(),
  email: z.string()
    .email('Email invalide'),
  phone: z.string().optional(),
  mobile: z.string().optional(),
  secondary_email: z.string()
    .email('Email secondaire invalide')
    .optional()
    .or(z.literal('')),
  direct_line: z.string().optional(),
  is_primary_contact: z.boolean(),
  is_billing_contact: z.boolean(),
  is_technical_contact: z.boolean(),
  is_commercial_contact: z.boolean(),
  preferred_communication_method: z.enum(['email', 'phone', 'both']),
  accepts_marketing: z.boolean(),
  accepts_notifications: z.boolean(),
  language_preference: z.string(),
  notes: z.string().optional()
})

type ContactFormData = z.infer<typeof contactSchema>

interface ContactFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (contactData: ContactFormData) => void
  contact?: Contact | null
  organisationId: string
  organisationName: string
}

export function ContactFormModal({
  isOpen,
  onClose,
  onSave,
  contact,
  organisationId,
  organisationName
}: ContactFormModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const isEditing = !!contact

  const form = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      first_name: '',
      last_name: '',
      title: '',
      department: '',
      email: '',
      phone: '',
      mobile: '',
      secondary_email: '',
      direct_line: '',
      is_primary_contact: false,
      is_billing_contact: false,
      is_technical_contact: false,
      is_commercial_contact: true,
      preferred_communication_method: 'email',
      accepts_marketing: true,
      accepts_notifications: true,
      language_preference: 'fr',
      notes: ''
    }
  })

  // Pré-remplir le formulaire en mode édition
  useEffect(() => {
    if (isEditing && contact) {
      form.reset({
        first_name: contact.first_name || '',
        last_name: contact.last_name || '',
        title: contact.title || '',
        department: contact.department || '',
        email: contact.email || '',
        phone: contact.phone || '',
        mobile: contact.mobile || '',
        secondary_email: contact.secondary_email || '',
        direct_line: contact.direct_line || '',
        is_primary_contact: contact.is_primary_contact || false,
        is_billing_contact: contact.is_billing_contact || false,
        is_technical_contact: contact.is_technical_contact || false,
        is_commercial_contact: contact.is_commercial_contact || true,
        preferred_communication_method: contact.preferred_communication_method || 'email',
        accepts_marketing: contact.accepts_marketing ?? true,
        accepts_notifications: contact.accepts_notifications ?? true,
        language_preference: contact.language_preference || 'fr',
        notes: contact.notes || ''
      })
    } else {
      // Réinitialiser pour nouveau contact
      form.reset({
        first_name: '',
        last_name: '',
        title: '',
        department: '',
        email: '',
        phone: '',
        mobile: '',
        secondary_email: '',
        direct_line: '',
        is_primary_contact: false,
        is_billing_contact: false,
        is_technical_contact: false,
        is_commercial_contact: true,
        preferred_communication_method: 'email',
        accepts_marketing: true,
        accepts_notifications: true,
        language_preference: 'fr',
        notes: ''
      })
    }
  }, [isEditing, contact, form])

  const handleSubmit = async (data: ContactFormData) => {
    setIsSubmitting(true)

    try {
      await onSave(data)
    } catch (error) {
      console.error('❌ Erreur lors de la sauvegarde du contact:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    form.reset()
    onClose()
  }

  // Options de méthodes de communication
  const communicationMethods = [
    { value: 'email', label: 'Email' },
    { value: 'phone', label: 'Téléphone' },
    { value: 'both', label: 'Email et téléphone' }
  ]

  // Options de langues
  const languages = [
    { value: 'fr', label: 'Français' },
    { value: 'en', label: 'Anglais' },
    { value: 'de', label: 'Allemand' },
    { value: 'it', label: 'Italien' },
    { value: 'es', label: 'Espagnol' }
  ]

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            {isEditing ? 'Modifier le contact' : 'Nouveau contact'}
            <span className="text-sm font-normal text-gray-600">• {organisationName}</span>
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

              <div>
                <Label htmlFor="last_name">Nom de famille *</Label>
                <Input
                  id="last_name"
                  {...form.register('last_name')}
                  placeholder="Ex: Dupont"
                  className="mt-1"
                />
                {form.formState.errors.last_name && (
                  <p className="text-red-500 text-sm mt-1">
                    {form.formState.errors.last_name.message}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="title">Titre/Poste</Label>
                <Input
                  id="title"
                  {...form.register('title')}
                  placeholder="Ex: Directeur Commercial"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="department">Service/Département</Label>
                <Input
                  id="department"
                  {...form.register('department')}
                  placeholder="Ex: Commercial"
                  className="mt-1"
                />
              </div>
            </div>
          </div>

          {/* Contact principal */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-black border-b pb-2">
              Contact principal
            </h3>

            <div>
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                {...form.register('email')}
                placeholder="jean.dupont@entreprise.com"
                className="mt-1"
              />
              {form.formState.errors.email && (
                <p className="text-red-500 text-sm mt-1">
                  {form.formState.errors.email.message}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="phone">Téléphone fixe</Label>
                <Input
                  id="phone"
                  {...form.register('phone')}
                  placeholder="01 23 45 67 89"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="mobile">Téléphone mobile</Label>
                <Input
                  id="mobile"
                  {...form.register('mobile')}
                  placeholder="06 12 34 56 78"
                  className="mt-1"
                />
              </div>
            </div>
          </div>

          {/* Contact secondaire */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-black border-b pb-2">
              Contact secondaire (optionnel)
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="secondary_email">Email secondaire</Label>
                <Input
                  id="secondary_email"
                  type="email"
                  {...form.register('secondary_email')}
                  placeholder="jean.dupont.backup@entreprise.com"
                  className="mt-1"
                />
                {form.formState.errors.secondary_email && (
                  <p className="text-red-500 text-sm mt-1">
                    {form.formState.errors.secondary_email.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="direct_line">Ligne directe</Label>
                <Input
                  id="direct_line"
                  {...form.register('direct_line')}
                  placeholder="01 23 45 67 90"
                  className="mt-1"
                />
              </div>
            </div>
          </div>

          {/* Rôles et responsabilités */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-black border-b pb-2">
              Rôles et responsabilités
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Switch
                    id="is_primary_contact"
                    checked={form.watch('is_primary_contact')}
                    onCheckedChange={(checked) => form.setValue('is_primary_contact', checked)}
                  />
                  <div>
                    <Label htmlFor="is_primary_contact" className="font-medium">
                      Contact principal
                    </Label>
                    <p className="text-xs text-gray-600">
                      Contact prioritaire pour cette organisation
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <Switch
                    id="is_commercial_contact"
                    checked={form.watch('is_commercial_contact')}
                    onCheckedChange={(checked) => form.setValue('is_commercial_contact', checked)}
                  />
                  <div>
                    <Label htmlFor="is_commercial_contact" className="font-medium">
                      Contact commercial
                    </Label>
                    <p className="text-xs text-gray-600">
                      Commandes et négociations
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Switch
                    id="is_billing_contact"
                    checked={form.watch('is_billing_contact')}
                    onCheckedChange={(checked) => form.setValue('is_billing_contact', checked)}
                  />
                  <div>
                    <Label htmlFor="is_billing_contact" className="font-medium">
                      Contact facturation
                    </Label>
                    <p className="text-xs text-gray-600">
                      Factures et paiements
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <Switch
                    id="is_technical_contact"
                    checked={form.watch('is_technical_contact')}
                    onCheckedChange={(checked) => form.setValue('is_technical_contact', checked)}
                  />
                  <div>
                    <Label htmlFor="is_technical_contact" className="font-medium">
                      Contact technique
                    </Label>
                    <p className="text-xs text-gray-600">
                      Support et spécifications
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Préférences de communication */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-black border-b pb-2">
              Préférences de communication
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="preferred_communication_method">Méthode préférée</Label>
                <Select
                  value={form.watch('preferred_communication_method')}
                  onValueChange={(value) => form.setValue('preferred_communication_method', value as 'email' | 'phone' | 'both')}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Sélectionner..." />
                  </SelectTrigger>
                  <SelectContent>
                    {communicationMethods.map(method => (
                      <SelectItem key={method.value} value={method.value}>
                        {method.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="language_preference">Langue préférée</Label>
                <Select
                  value={form.watch('language_preference')}
                  onValueChange={(value) => form.setValue('language_preference', value)}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Sélectionner..." />
                  </SelectTrigger>
                  <SelectContent>
                    {languages.map(language => (
                      <SelectItem key={language.value} value={language.value}>
                        {language.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-center space-x-3">
                <Switch
                  id="accepts_marketing"
                  checked={form.watch('accepts_marketing')}
                  onCheckedChange={(checked) => form.setValue('accepts_marketing', checked)}
                />
                <div>
                  <Label htmlFor="accepts_marketing" className="font-medium">
                    Communications marketing
                  </Label>
                  <p className="text-xs text-gray-600">
                    Newsletters et offres commerciales
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <Switch
                  id="accepts_notifications"
                  checked={form.watch('accepts_notifications')}
                  onCheckedChange={(checked) => form.setValue('accepts_notifications', checked)}
                />
                <div>
                  <Label htmlFor="accepts_notifications" className="font-medium">
                    Notifications système
                  </Label>
                  <p className="text-xs text-gray-600">
                    Alertes et mises à jour importantes
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-black border-b pb-2">
              Notes
            </h3>

            <div>
              <Label htmlFor="notes">Notes libres</Label>
              <Textarea
                id="notes"
                {...form.register('notes')}
                placeholder="Informations complémentaires sur ce contact..."
                className="mt-1"
                rows={3}
              />
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
              {isEditing ? 'Mettre à jour' : 'Créer le contact'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
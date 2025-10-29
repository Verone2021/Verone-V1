"use client"

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ButtonV2 } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { spacing, colors } from '@/lib/design-system'
import { User, Mail, Phone, Briefcase } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

// ========================
// TYPES & SCHEMAS
// ========================

const contactSchema = z.object({
  first_name: z.string().min(1, 'Le prénom est obligatoire'),
  last_name: z.string().min(1, 'Le nom est obligatoire'),
  title: z.string().optional().or(z.literal('')),
  department: z.string().optional().or(z.literal('')),
  email: z.string().email('Email invalide'),
  phone: z.string().optional().or(z.literal('')),
  mobile: z.string().optional().or(z.literal('')),
  is_primary_contact: z.boolean().default(false),
  is_billing_contact: z.boolean().default(false),
  is_technical_contact: z.boolean().default(false),
  is_commercial_contact: z.boolean().default(false),
})

type ContactFormData = z.infer<typeof contactSchema>

interface Contact {
  id: string
  organisation_id: string
  first_name: string
  last_name: string
  title: string | null
  department: string | null
  email: string
  phone: string | null
  mobile: string | null
  is_primary_contact: boolean
  is_billing_contact: boolean
  is_technical_contact: boolean
  is_commercial_contact: boolean
  is_active: boolean
}

interface ContactFormModalProps {
  isOpen: boolean
  onClose: () => void
  organisationId: string
  contact?: Contact | null
  onSuccess?: () => void
}

export function ContactFormModal({
  isOpen,
  onClose,
  organisationId,
  contact = null,
  onSuccess
}: ContactFormModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const isEditing = !!contact

  const form = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema) as any,
    defaultValues: {
      first_name: contact?.first_name || '',
      last_name: contact?.last_name || '',
      title: contact?.title || '',
      department: contact?.department || '',
      email: contact?.email || '',
      phone: contact?.phone || '',
      mobile: contact?.mobile || '',
      is_primary_contact: contact?.is_primary_contact || false,
      is_billing_contact: contact?.is_billing_contact || false,
      is_technical_contact: contact?.is_technical_contact || false,
      is_commercial_contact: contact?.is_commercial_contact || false,
    }
  })

  useEffect(() => {
    if (isOpen) {
      form.reset({
        first_name: contact?.first_name || '',
        last_name: contact?.last_name || '',
        title: contact?.title || '',
        department: contact?.department || '',
        email: contact?.email || '',
        phone: contact?.phone || '',
        mobile: contact?.mobile || '',
        is_primary_contact: contact?.is_primary_contact || false,
        is_billing_contact: contact?.is_billing_contact || false,
        is_technical_contact: contact?.is_technical_contact || false,
        is_commercial_contact: contact?.is_commercial_contact || false,
      })
    }
  }, [isOpen, contact])

  const handleSubmit = async (data: ContactFormData) => {
    setIsSubmitting(true)
    try {
      const supabase = createClient()

      const contactData = {
        organisation_id: organisationId,
        first_name: data.first_name,
        last_name: data.last_name,
        title: data.title || null,
        department: data.department || null,
        email: data.email,
        phone: data.phone || null,
        mobile: data.mobile || null,
        is_primary_contact: data.is_primary_contact,
        is_billing_contact: data.is_billing_contact,
        is_technical_contact: data.is_technical_contact,
        is_commercial_contact: data.is_commercial_contact,
        is_active: true,
      }

      if (isEditing && contact) {
        // Update existing contact
        const { error } = await supabase
          .from('contacts')
          .update(contactData)
          .eq('id', contact.id)

        if (error) throw error
        console.log('✅ Contact mis à jour avec succès')
      } else {
        // Create new contact
        const { error } = await supabase
          .from('contacts')
          .insert([contactData])

        if (error) throw error
        console.log('✅ Contact créé avec succès')
      }

      onSuccess?.()
      handleClose()
    } catch (error) {
      console.error('❌ Erreur lors de la sauvegarde du contact:', error)
      alert('Erreur lors de la sauvegarde. Veuillez réessayer.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    if (!isSubmitting) {
      form.reset()
      onClose()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent
        className="max-w-2xl max-h-[90vh] overflow-y-auto"
        style={{
          backgroundColor: colors.background.DEFAULT,
          borderColor: colors.border.DEFAULT
        }}
      >
        <DialogHeader style={{ marginBottom: spacing[6] }}>
          <DialogTitle
            className="text-2xl font-semibold"
            style={{ color: colors.text.DEFAULT }}
          >
            {isEditing ? 'Modifier le contact' : 'Nouveau contact'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(handleSubmit as any)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[6] }}>

            {/* Section 1: Identité */}
            <div>
              <h3
                className="text-lg font-semibold flex items-center gap-2"
                style={{
                  color: colors.text.DEFAULT,
                  marginBottom: spacing[4]
                }}
              >
                <User className="h-5 w-5" />
                Identité
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[4] }}>
                {/* First Name + Last Name */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: spacing[3] }}>
                  <div>
                    <Label
                      htmlFor="first_name"
                      required
                      state={form.formState.errors.first_name ? "error" : "default"}
                    >
                      Prénom
                    </Label>
                    <Input
                      id="first_name"
                      {...form.register('first_name')}
                      placeholder="Jean"
                      disabled={isSubmitting}
                      variant={form.formState.errors.first_name ? "error" : "default"}
                      error={form.formState.errors.first_name?.message}
                    />
                  </div>

                  <div>
                    <Label
                      htmlFor="last_name"
                      required
                      state={form.formState.errors.last_name ? "error" : "default"}
                    >
                      Nom
                    </Label>
                    <Input
                      id="last_name"
                      {...form.register('last_name')}
                      placeholder="Dupont"
                      disabled={isSubmitting}
                      variant={form.formState.errors.last_name ? "error" : "default"}
                      error={form.formState.errors.last_name?.message}
                    />
                  </div>
                </div>

                {/* Title + Department */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: spacing[3] }}>
                  <div>
                    <Label htmlFor="title">
                      Fonction
                    </Label>
                    <Input
                      id="title"
                      {...form.register('title')}
                      placeholder="Directeur Commercial"
                      disabled={isSubmitting}
                    />
                  </div>

                  <div>
                    <Label htmlFor="department">
                      Département
                    </Label>
                    <Input
                      id="department"
                      {...form.register('department')}
                      placeholder="Ventes"
                      disabled={isSubmitting}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Section 2: Coordonnées */}
            <div>
              <h3
                className="text-lg font-semibold flex items-center gap-2"
                style={{
                  color: colors.text.DEFAULT,
                  marginBottom: spacing[4]
                }}
              >
                <Mail className="h-5 w-5" />
                Coordonnées
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[4] }}>
                {/* Email */}
                <div>
                  <Label
                    htmlFor="email"
                    required
                    state={form.formState.errors.email ? "error" : "default"}
                  >
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    {...form.register('email')}
                    placeholder="contact@exemple.com"
                    disabled={isSubmitting}
                    variant={form.formState.errors.email ? "error" : "default"}
                    error={form.formState.errors.email?.message}
                  />
                </div>

                {/* Phone + Mobile */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: spacing[3] }}>
                  <div>
                    <Label htmlFor="phone">
                      Téléphone fixe
                    </Label>
                    <Input
                      id="phone"
                      type="tel"
                      {...form.register('phone')}
                      placeholder="+33 1 23 45 67 89"
                      disabled={isSubmitting}
                    />
                  </div>

                  <div>
                    <Label htmlFor="mobile">
                      Mobile
                    </Label>
                    <Input
                      id="mobile"
                      type="tel"
                      {...form.register('mobile')}
                      placeholder="+33 6 12 34 56 78"
                      disabled={isSubmitting}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Section 3: Rôles */}
            <div>
              <h3
                className="text-lg font-semibold flex items-center gap-2"
                style={{
                  color: colors.text.DEFAULT,
                  marginBottom: spacing[4]
                }}
              >
                <Briefcase className="h-5 w-5" />
                Rôles
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[3] }}>
                {/* Primary Contact */}
                <div style={{ display: 'flex', alignItems: 'center', gap: spacing[2] }}>
                  <Checkbox
                    id="is_primary_contact"
                    checked={form.watch('is_primary_contact')}
                    onCheckedChange={(checked) => form.setValue('is_primary_contact', checked as boolean)}
                    disabled={isSubmitting}
                  />
                  <Label
                    htmlFor="is_primary_contact"
                    className="text-sm font-medium cursor-pointer"
                  >
                    Contact principal
                  </Label>
                </div>

                {/* Commercial Contact */}
                <div style={{ display: 'flex', alignItems: 'center', gap: spacing[2] }}>
                  <Checkbox
                    id="is_commercial_contact"
                    checked={form.watch('is_commercial_contact')}
                    onCheckedChange={(checked) => form.setValue('is_commercial_contact', checked as boolean)}
                    disabled={isSubmitting}
                  />
                  <Label
                    htmlFor="is_commercial_contact"
                    className="text-sm font-medium cursor-pointer"
                  >
                    Contact commercial
                  </Label>
                </div>

                {/* Billing Contact */}
                <div style={{ display: 'flex', alignItems: 'center', gap: spacing[2] }}>
                  <Checkbox
                    id="is_billing_contact"
                    checked={form.watch('is_billing_contact')}
                    onCheckedChange={(checked) => form.setValue('is_billing_contact', checked as boolean)}
                    disabled={isSubmitting}
                  />
                  <Label
                    htmlFor="is_billing_contact"
                    className="text-sm font-medium cursor-pointer"
                  >
                    Contact facturation
                  </Label>
                </div>

                {/* Technical Contact */}
                <div style={{ display: 'flex', alignItems: 'center', gap: spacing[2] }}>
                  <Checkbox
                    id="is_technical_contact"
                    checked={form.watch('is_technical_contact')}
                    onCheckedChange={(checked) => form.setValue('is_technical_contact', checked as boolean)}
                    disabled={isSubmitting}
                  />
                  <Label
                    htmlFor="is_technical_contact"
                    className="text-sm font-medium cursor-pointer"
                  >
                    Contact technique
                  </Label>
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: spacing[3],
                paddingTop: spacing[6],
                borderTopWidth: '1px',
                borderTopStyle: 'solid',
                borderTopColor: colors.border.DEFAULT
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
              <ButtonV2
                type="submit"
                variant="primary"
                disabled={isSubmitting}
              >
                {isSubmitting
                  ? 'Enregistrement...'
                  : isEditing
                    ? 'Mettre à jour'
                    : 'Créer'
                }
              </ButtonV2>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

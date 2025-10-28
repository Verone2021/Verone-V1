"use client"

import { useOrganisations } from '@/hooks/use-organisations'
import { UnifiedOrganisationForm, OrganisationFormData, Organisation } from './unified-organisation-form'

interface PartnerFormModalProps {
  isOpen: boolean
  onClose: () => void
  partner?: Organisation | null // null = création, objet = édition
  onSuccess?: (partner: Organisation) => void
}

/**
 * Modal pour création/édition de prestataire (partner)
 * Utilise UnifiedOrganisationForm sans section personnalisée
 */
export function PartnerFormModal({
  isOpen,
  onClose,
  partner = null,
  onSuccess
}: PartnerFormModalProps) {
  const { createOrganisation, updateOrganisation } = useOrganisations({ type: 'partner' })

  const isEditing = !!partner

  const handleSubmit = async (data: OrganisationFormData, organisationId?: string) => {
    const partnerData = {
      ...data,
      type: 'partner' as const,
    }

    let result

    if (isEditing && partner) {
      // Mise à jour
      result = await updateOrganisation({
        id: partner.id,
        legal_name: partnerData.legal_name,
        email: partnerData.email || undefined,
        secondary_email: partnerData.secondary_email || undefined,
        country: partnerData.country,
        phone: partnerData.phone || undefined,
        website: partnerData.website || undefined,
        is_active: partnerData.is_active,
        notes: partnerData.notes || undefined,

        // Adresse principale
        address_line1: partnerData.address_line1 || undefined,
        address_line2: partnerData.address_line2 || undefined,
        postal_code: partnerData.postal_code || undefined,
        city: partnerData.city || undefined,
        region: partnerData.region || undefined,

        // Légal
        legal_form: partnerData.legal_form || undefined,
        siret: partnerData.siret || undefined,
        vat_number: partnerData.vat_number || undefined,
        industry_sector: partnerData.industry_sector || undefined,

        // Commercial
        currency: partnerData.currency || 'EUR',
        payment_terms: partnerData.payment_terms || undefined,

        // Champs techniques
        abby_customer_id: partnerData.abby_customer_id || undefined,
        default_channel_id: partnerData.default_channel_id || undefined,
      })
    } else {
      // Création
      result = await createOrganisation({
        legal_name: partnerData.legal_name,
        type: 'partner',
        email: partnerData.email || undefined,
        secondary_email: partnerData.secondary_email || undefined,
        country: partnerData.country,
        phone: partnerData.phone || undefined,
        website: partnerData.website || undefined,
        is_active: partnerData.is_active,
        notes: partnerData.notes || undefined,

        // Adresse principale
        address_line1: partnerData.address_line1 || undefined,
        address_line2: partnerData.address_line2 || undefined,
        postal_code: partnerData.postal_code || undefined,
        city: partnerData.city || undefined,
        region: partnerData.region || undefined,

        // Légal
        legal_form: partnerData.legal_form || undefined,
        siret: partnerData.siret || undefined,
        vat_number: partnerData.vat_number || undefined,
        industry_sector: partnerData.industry_sector || undefined,

        // Commercial
        currency: partnerData.currency || 'EUR',
        payment_terms: partnerData.payment_terms || undefined,

        // Champs techniques
        abby_customer_id: partnerData.abby_customer_id || undefined,
        default_channel_id: partnerData.default_channel_id || undefined,
      })
    }

    if (result) {
      console.log('✅ Prestataire sauvegardé avec succès')
      onSuccess?.(result as Organisation)
      onClose()
    } else {
      console.error('❌ Erreur lors de la sauvegarde')
      alert('Erreur lors de la sauvegarde. Veuillez réessayer.')
    }
  }

  return (
    <UnifiedOrganisationForm
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={handleSubmit}
      onSuccess={onSuccess}
      organisationType="partner"
      organisation={partner}
      mode={isEditing ? 'edit' : 'create'}
      title={isEditing ? 'Modifier le prestataire' : 'Nouveau prestataire'}
      onLogoUploadSuccess={() => {
        // TODO: Refetch partner data if needed
      }}
    />
  )
}

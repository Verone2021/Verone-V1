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
        email: partnerData.email || null,
        secondary_email: partnerData.secondary_email || null,
        country: partnerData.country,
        phone: partnerData.phone || null,
        website: partnerData.website || null,
        is_active: partnerData.is_active,
        notes: partnerData.notes || null,

        // Adresse principale
        address_line1: partnerData.address_line1 || null,
        address_line2: partnerData.address_line2 || null,
        postal_code: partnerData.postal_code || null,
        city: partnerData.city || null,
        region: partnerData.region || null,

        // Légal
        legal_form: partnerData.legal_form || null,
        siret: partnerData.siret || null,
        vat_number: partnerData.vat_number || null,
        industry_sector: partnerData.industry_sector || null,

        // Commercial
        currency: partnerData.currency || 'EUR',
        payment_terms: partnerData.payment_terms || null,

        // Champs techniques
        abby_customer_id: partnerData.abby_customer_id || null,
        default_channel_id: partnerData.default_channel_id || null,
      })
    } else {
      // Création
      result = await createOrganisation({
        legal_name: partnerData.legal_name,
        type: 'partner',
        email: partnerData.email || null,
        secondary_email: partnerData.secondary_email || null,
        country: partnerData.country,
        phone: partnerData.phone || null,
        website: partnerData.website || null,
        is_active: partnerData.is_active,
        notes: partnerData.notes || null,

        // Adresse principale
        address_line1: partnerData.address_line1 || null,
        address_line2: partnerData.address_line2 || null,
        postal_code: partnerData.postal_code || null,
        city: partnerData.city || null,
        region: partnerData.region || null,

        // Légal
        legal_form: partnerData.legal_form || null,
        siret: partnerData.siret || null,
        vat_number: partnerData.vat_number || null,
        industry_sector: partnerData.industry_sector || null,

        // Commercial
        currency: partnerData.currency || 'EUR',
        payment_terms: partnerData.payment_terms || null,

        // Champs techniques
        abby_customer_id: partnerData.abby_customer_id || null,
        default_channel_id: partnerData.default_channel_id || null,
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

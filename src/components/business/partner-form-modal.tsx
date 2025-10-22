"use client"

import { useState } from 'react'
import { useOrganisations } from '@/hooks/use-organisations'
import { UnifiedOrganisationForm, OrganisationFormData, Organisation } from './unified-organisation-form'
import { ConfirmSubmitModal } from './confirm-submit-modal'
import { toast } from 'sonner'
import { Building2, Mail, Phone, MapPin, Globe, CreditCard } from 'lucide-react'

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

  // États pour modal de confirmation
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [pendingFormData, setPendingFormData] = useState<OrganisationFormData | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const isEditing = !!partner

  // Étape 1 : Préparer les données et ouvrir modal confirmation
  const handleSubmit = async (data: OrganisationFormData, organisationId?: string) => {
    setPendingFormData(data)
    setConfirmOpen(true)
  }

  // Étape 2 : Confirmation et sauvegarde réelle
  const handleConfirmSubmit = async () => {
    if (!pendingFormData) return

    setIsSubmitting(true)

    try {
      const data = pendingFormData
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
          trade_name: partnerData.trade_name || null,
          has_different_trade_name: partnerData.has_different_trade_name || false,
          email: partnerData.email || null,
          secondary_email: partnerData.secondary_email || null,
          country: partnerData.country,
          phone: partnerData.phone || null,
          website: partnerData.website || null,
          is_active: partnerData.is_active,
          notes: partnerData.notes || null,

          // Adresse de facturation
          billing_address_line1: partnerData.billing_address_line1 || null,
          billing_address_line2: partnerData.billing_address_line2 || null,
          billing_postal_code: partnerData.billing_postal_code || null,
          billing_city: partnerData.billing_city || null,
          billing_region: partnerData.billing_region || null,
          billing_country: partnerData.billing_country || 'FR',

          // Légal
          legal_form: partnerData.legal_form || null,
          siren: partnerData.siren || null,
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
          trade_name: partnerData.trade_name || null,
          has_different_trade_name: partnerData.has_different_trade_name || false,
          type: 'partner',
          email: partnerData.email || null,
          secondary_email: partnerData.secondary_email || null,
          country: partnerData.country,
          phone: partnerData.phone || null,
          website: partnerData.website || null,
          is_active: partnerData.is_active,
          notes: partnerData.notes || null,

          // Adresse de facturation
          billing_address_line1: partnerData.billing_address_line1 || null,
          billing_address_line2: partnerData.billing_address_line2 || null,
          billing_postal_code: partnerData.billing_postal_code || null,
          billing_city: partnerData.billing_city || null,
          billing_region: partnerData.billing_region || null,
          billing_country: partnerData.billing_country || 'FR',

          // Légal
          legal_form: partnerData.legal_form || null,
          siren: partnerData.siren || null,
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
        toast.success(isEditing ? 'Prestataire modifié avec succès !' : 'Prestataire créé avec succès !')
        onSuccess?.(result as Organisation)
        setConfirmOpen(false)
        onClose()
      } else {
        toast.error('Erreur lors de la sauvegarde. Veuillez réessayer.')
      }
    } catch (error) {
      toast.error('Une erreur est survenue lors de la sauvegarde.')
      console.error('Erreur sauvegarde prestataire:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Préparer les données de récapitulatif pour le modal
  const getSummaryData = () => {
    if (!pendingFormData) return []

    const items = [
      {
        label: 'Nom du prestataire',
        value: pendingFormData.legal_name,
        icon: <Building2 className="h-4 w-4 text-gray-500" />,
        isImportant: true
      },
      {
        label: 'Email',
        value: pendingFormData.email,
        icon: <Mail className="h-4 w-4 text-gray-500" />
      },
      {
        label: 'Téléphone',
        value: pendingFormData.phone,
        icon: <Phone className="h-4 w-4 text-gray-500" />
      },
      {
        label: 'Adresse',
        value: pendingFormData.billing_address_line1
          ? `${pendingFormData.billing_address_line1}${pendingFormData.billing_address_line2 ? ', ' + pendingFormData.billing_address_line2 : ''}`
          : null,
        icon: <MapPin className="h-4 w-4 text-gray-500" />
      },
      {
        label: 'Ville',
        value: pendingFormData.billing_city
          ? `${pendingFormData.billing_postal_code || ''} ${pendingFormData.billing_city}`.trim()
          : null,
        icon: <MapPin className="h-4 w-4 text-gray-500" />
      },
      {
        label: 'Pays',
        value: pendingFormData.country === 'FR' ? 'France' : pendingFormData.country
      }
    ]

    return items
  }

  return (
    <>
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

      {/* Modal de confirmation avant sauvegarde */}
      <ConfirmSubmitModal
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={isEditing ? 'Confirmer la modification' : 'Confirmer la création'}
        description={
          isEditing
            ? 'Veuillez vérifier les informations modifiées ci-dessous avant de sauvegarder.'
            : 'Veuillez vérifier les informations du nouveau prestataire ci-dessous avant de créer.'
        }
        summaryData={getSummaryData()}
        onConfirm={handleConfirmSubmit}
        confirmLabel={isEditing ? 'Modifier le prestataire' : 'Créer le prestataire'}
        isSubmitting={isSubmitting}
      />
    </>
  )
}

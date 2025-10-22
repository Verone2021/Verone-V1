"use client"

import { useState } from 'react'
import { useOrganisations } from '@/hooks/use-organisations'
import { UnifiedOrganisationForm, OrganisationFormData, Organisation } from './unified-organisation-form'
import { ConfirmSubmitModal } from './confirm-submit-modal'
import { toast } from 'sonner'
import { Building2, Mail, Phone, MapPin, Globe, CreditCard } from 'lucide-react'

interface CustomerFormModalProps {
  isOpen: boolean
  onClose: () => void
  onCustomerCreated?: (customer: Organisation) => void
  onCustomerUpdated?: (customer: Organisation) => void
  customer?: Organisation // Pour l'édition
  mode?: 'create' | 'edit'
}

/**
 * Modal pour création/édition de client professionnel
 * Utilise UnifiedOrganisationForm (même UX que fournisseurs)
 */
export function CustomerFormModal({
  isOpen,
  onClose,
  onCustomerCreated,
  onCustomerUpdated,
  customer,
  mode = 'create'
}: CustomerFormModalProps) {
  const { createOrganisation, updateOrganisation } = useOrganisations()

  // États pour modal de confirmation
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [pendingFormData, setPendingFormData] = useState<OrganisationFormData | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

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
      const customerData = {
        ...data,
        type: 'customer' as const,
        customer_type: 'professional' as const // Toujours professionnel pour ce modal
      }

      let result

      if (mode === 'edit' && customer) {
      // Mise à jour
      result = await updateOrganisation({
        id: customer.id,
        legal_name: customerData.legal_name,
        trade_name: customerData.trade_name || null,
        has_different_trade_name: customerData.has_different_trade_name || false,
        email: customerData.email || null,
        country: customerData.country,
        phone: customerData.phone || null,
        website: customerData.website || null,
        is_active: customerData.is_active,
        notes: customerData.notes || null,

        // Légal
        legal_form: customerData.legal_form || null,
        siren: customerData.siren || null,
        siret: customerData.siret || null,
        vat_number: customerData.vat_number || null,
        industry_sector: customerData.industry_sector || null,

        // Commercial
        currency: customerData.currency || 'EUR',
        payment_terms: customerData.payment_terms || null,
        prepayment_required: customerData.prepayment_required || false,

        // Adresses facturation/livraison
        has_different_shipping_address: customerData.has_different_shipping_address || false,
        billing_address_line1: customerData.billing_address_line1 || null,
        billing_address_line2: customerData.billing_address_line2 || null,
        billing_postal_code: customerData.billing_postal_code || null,
        billing_city: customerData.billing_city || null,
        billing_region: customerData.billing_region || null,
        billing_country: customerData.billing_country || 'FR',
        shipping_address_line1: customerData.shipping_address_line1 || null,
        shipping_address_line2: customerData.shipping_address_line2 || null,
        shipping_postal_code: customerData.shipping_postal_code || null,
        shipping_city: customerData.shipping_city || null,
        shipping_region: customerData.shipping_region || null,
        shipping_country: customerData.shipping_country || 'FR',

        // Client type
        customer_type: 'professional'
      })

      if (result && onCustomerUpdated) {
        onCustomerUpdated(result as Organisation)
      }
    } else {
      // Création
      result = await createOrganisation({
        legal_name: customerData.legal_name,
        trade_name: customerData.trade_name || null,
        has_different_trade_name: customerData.has_different_trade_name || false,
        type: 'customer',
        email: customerData.email || null,
        country: customerData.country,
        phone: customerData.phone || null,
        website: customerData.website || null,
        is_active: customerData.is_active,
        notes: customerData.notes || null,

        // Légal
        legal_form: customerData.legal_form || null,
        siren: customerData.siren || null,
        siret: customerData.siret || null,
        vat_number: customerData.vat_number || null,
        industry_sector: customerData.industry_sector || null,

        // Commercial
        currency: customerData.currency || 'EUR',
        payment_terms: customerData.payment_terms || null,
        prepayment_required: customerData.prepayment_required || false,

        // Adresses facturation/livraison
        has_different_shipping_address: customerData.has_different_shipping_address || false,
        billing_address_line1: customerData.billing_address_line1 || null,
        billing_address_line2: customerData.billing_address_line2 || null,
        billing_postal_code: customerData.billing_postal_code || null,
        billing_city: customerData.billing_city || null,
        billing_region: customerData.billing_region || null,
        billing_country: customerData.billing_country || 'FR',
        shipping_address_line1: customerData.shipping_address_line1 || null,
        shipping_address_line2: customerData.shipping_address_line2 || null,
        shipping_postal_code: customerData.shipping_postal_code || null,
        shipping_city: customerData.shipping_city || null,
        shipping_region: customerData.shipping_region || null,
        shipping_country: customerData.shipping_country || 'FR',

        // Client type
        customer_type: 'professional'
      })

        if (result && onCustomerCreated) {
          onCustomerCreated(result as Organisation)
        }
      }

      if (result) {
        toast.success(mode === 'edit' ? 'Client modifié avec succès !' : 'Client créé avec succès !')
        setConfirmOpen(false)
        onClose()
      } else {
        toast.error('Erreur lors de la sauvegarde. Veuillez réessayer.')
      }
    } catch (error) {
      toast.error('Une erreur est survenue lors de la sauvegarde.')
      console.error('Erreur sauvegarde client:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Préparer les données de récapitulatif pour le modal
  const getSummaryData = () => {
    if (!pendingFormData) return []

    const items = [
      {
        label: 'Nom du client',
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
        onSuccess={(org) => {
          if (mode === 'edit' && onCustomerUpdated) {
            onCustomerUpdated(org)
          } else if (mode === 'create' && onCustomerCreated) {
            onCustomerCreated(org)
          }
        }}
        organisationType="customer"
        organisation={customer}
        mode={mode}
        title={mode === 'edit' ? 'Modifier le client professionnel' : 'Nouveau client professionnel'}
        onLogoUploadSuccess={() => {
          // TODO: Refetch customer data if needed
        }}
      />

      {/* Modal de confirmation avant sauvegarde */}
      <ConfirmSubmitModal
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={mode === 'edit' ? 'Confirmer la modification' : 'Confirmer la création'}
        description={
          mode === 'edit'
            ? 'Veuillez vérifier les informations modifiées ci-dessous avant de sauvegarder.'
            : 'Veuillez vérifier les informations du nouveau client ci-dessous avant de créer.'
        }
        summaryData={getSummaryData()}
        onConfirm={handleConfirmSubmit}
        confirmLabel={mode === 'edit' ? 'Modifier le client' : 'Créer le client'}
        isSubmitting={isSubmitting}
      />
    </>
  )
}

"use client"

import { useOrganisations } from '@/hooks/use-organisations'
import { UnifiedOrganisationForm, OrganisationFormData, Organisation } from './unified-organisation-form'

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

  const handleSubmit = async (data: OrganisationFormData, organisationId?: string) => {
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
        email: customerData.email || null,
        country: customerData.country,
        phone: customerData.phone || null,
        website: customerData.website || null,
        is_active: customerData.is_active,
        notes: customerData.notes || null,

        // Adresse principale
        address_line1: customerData.address_line1 || null,
        address_line2: customerData.address_line2 || null,
        postal_code: customerData.postal_code || null,
        city: customerData.city || null,
        region: customerData.region || null,

        // Légal
        legal_form: customerData.legal_form || null,
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
        type: 'customer',
        email: customerData.email || null,
        country: customerData.country,
        phone: customerData.phone || null,
        website: customerData.website || null,
        is_active: customerData.is_active,
        notes: customerData.notes || null,

        // Adresse principale
        address_line1: customerData.address_line1 || null,
        address_line2: customerData.address_line2 || null,
        postal_code: customerData.postal_code || null,
        city: customerData.city || null,
        region: customerData.region || null,

        // Légal
        legal_form: customerData.legal_form || null,
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
      onClose()
    } else {
      console.error('❌ Erreur lors de l\'opération sur le client')
    }
  }

  return (
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
  )
}

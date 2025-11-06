"use client"

import { useState } from 'react'
import { useSuppliers } from '@/shared/modules/organisations/hooks'
import { UnifiedOrganisationForm, OrganisationFormData, Organisation } from './unified-organisation-form'
import { SupplierSegmentSelect } from './supplier-segment-select'
import { SupplierSegmentType } from './supplier-segment-badge'

interface SupplierFormModalProps {
  isOpen: boolean
  onClose: () => void
  supplier?: Organisation | null // null = création, objet = édition
  onSuccess?: (supplier: Organisation) => void
}

/**
 * Modal pour création/édition de fournisseur
 * Utilise UnifiedOrganisationForm avec section taxonomie personnalisée
 */
export function SupplierFormModal({
  isOpen,
  onClose,
  supplier = null,
  onSuccess
}: SupplierFormModalProps) {
  const { createOrganisation, updateOrganisation } = useSuppliers()
  const [taxonomyData, setTaxonomyData] = useState<{
    supplier_segment: SupplierSegmentType | null
  }>({
    supplier_segment: null
  })

  const isEditing = !!supplier

  // Charger données taxonomie en mode édition
  useState(() => {
    if (isEditing && supplier) {
      setTaxonomyData({
        supplier_segment: (supplier.supplier_segment as SupplierSegmentType) || undefined
      })
    }
  })

  const handleSubmit = async (data: OrganisationFormData, organisationId?: string) => {
    const supplierData = {
      ...data,
      type: 'supplier' as const,
      // Ajouter données taxonomie
      supplier_segment: taxonomyData.supplier_segment
    }

    let result

    if (isEditing && supplier) {
      // Mise à jour
      result = await updateOrganisation({
        id: supplier.id,
        legal_name: supplierData.legal_name,
        email: supplierData.email || undefined,
        country: supplierData.country,
        phone: supplierData.phone || undefined,
        website: supplierData.website || undefined,
        is_active: supplierData.is_active,
        notes: supplierData.notes || undefined,

        // Adresse principale
        address_line1: supplierData.address_line1 || undefined,
        address_line2: supplierData.address_line2 || undefined,
        postal_code: supplierData.postal_code || undefined,
        city: supplierData.city || undefined,
        region: supplierData.region || undefined,

        // Légal
        legal_form: supplierData.legal_form || undefined,
        siret: supplierData.siret || undefined,
        vat_number: supplierData.vat_number || undefined,
        industry_sector: supplierData.industry_sector || undefined,

        // Commercial
        currency: supplierData.currency || 'EUR',
        payment_terms: supplierData.payment_terms || undefined,

        // Taxonomie fournisseur
        supplier_segment: supplierData.supplier_segment || undefined
      })
    } else {
      // Création
      result = await createOrganisation({
        legal_name: supplierData.legal_name,
        type: 'supplier',
        email: supplierData.email || undefined,
        country: supplierData.country,
        phone: supplierData.phone || undefined,
        website: supplierData.website || undefined,
        is_active: supplierData.is_active,
        notes: supplierData.notes || undefined,

        // Adresse principale
        address_line1: supplierData.address_line1 || undefined,
        address_line2: supplierData.address_line2 || undefined,
        postal_code: supplierData.postal_code || undefined,
        city: supplierData.city || undefined,
        region: supplierData.region || undefined,

        // Légal
        legal_form: supplierData.legal_form || undefined,
        siret: supplierData.siret || undefined,
        vat_number: supplierData.vat_number || undefined,
        industry_sector: supplierData.industry_sector || undefined,

        // Commercial
        currency: supplierData.currency || 'EUR',
        payment_terms: supplierData.payment_terms || undefined,

        // Taxonomie fournisseur
        supplier_segment: supplierData.supplier_segment || undefined
      })
    }

    if (result) {
      console.log('✅ Fournisseur sauvegardé avec succès')
      onSuccess?.(result as Organisation)
      onClose()
    } else {
      console.error('❌ Erreur lors de la sauvegarde')
      alert('Erreur lors de la sauvegarde. Veuillez réessayer.')
    }
  }

  // Section taxonomie fournisseur (personnalisée)
  const taxonomySection = (
    <div className="space-y-4">
      <h3 className="text-sm font-medium mb-3">Classification fournisseur</h3>

      {/* Segment stratégique */}
      <SupplierSegmentSelect
        value={taxonomyData.supplier_segment}
        onChange={(segment) => setTaxonomyData(prev => ({ ...prev, supplier_segment: segment }))}
        showLabel={true}
        showTooltip={true}
        required={false}
      />
    </div>
  )

  return (
    <UnifiedOrganisationForm
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={handleSubmit}
      onSuccess={onSuccess}
      organisationType="supplier"
      organisation={supplier}
      mode={isEditing ? 'edit' : 'create'}
      title={isEditing ? 'Modifier le fournisseur' : 'Nouveau fournisseur'}
      customSections={taxonomySection}
      onLogoUploadSuccess={() => {
        // TODO: Refetch supplier data if needed
      }}
    />
  )
}

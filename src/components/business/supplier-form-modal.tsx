"use client"

import { useState } from 'react'
import { useSuppliers } from '@/hooks/use-organisations'
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
        supplier_segment: (supplier.supplier_segment as SupplierSegmentType) || null
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
        name: supplierData.name,
        email: supplierData.email || null,
        country: supplierData.country,
        phone: supplierData.phone || null,
        website: supplierData.website || null,
        is_active: supplierData.is_active,
        notes: supplierData.notes || null,

        // Adresse principale
        address_line1: supplierData.address_line1 || null,
        address_line2: supplierData.address_line2 || null,
        postal_code: supplierData.postal_code || null,
        city: supplierData.city || null,
        region: supplierData.region || null,

        // Légal
        legal_form: supplierData.legal_form || null,
        siret: supplierData.siret || null,
        vat_number: supplierData.vat_number || null,
        industry_sector: supplierData.industry_sector || null,

        // Commercial
        currency: supplierData.currency || 'EUR',
        payment_terms: supplierData.payment_terms || null,

        // Taxonomie fournisseur
        supplier_segment: supplierData.supplier_segment || null
      })
    } else {
      // Création
      result = await createOrganisation({
        name: supplierData.name,
        type: 'supplier',
        email: supplierData.email || null,
        country: supplierData.country,
        phone: supplierData.phone || null,
        website: supplierData.website || null,
        is_active: supplierData.is_active,
        notes: supplierData.notes || null,

        // Adresse principale
        address_line1: supplierData.address_line1 || null,
        address_line2: supplierData.address_line2 || null,
        postal_code: supplierData.postal_code || null,
        city: supplierData.city || null,
        region: supplierData.region || null,

        // Légal
        legal_form: supplierData.legal_form || null,
        siret: supplierData.siret || null,
        vat_number: supplierData.vat_number || null,
        industry_sector: supplierData.industry_sector || null,

        // Commercial
        currency: supplierData.currency || 'EUR',
        payment_terms: supplierData.payment_terms || null,

        // Taxonomie fournisseur
        supplier_segment: supplierData.supplier_segment || null
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

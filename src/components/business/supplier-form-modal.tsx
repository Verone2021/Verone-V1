"use client"

import { useState } from 'react'
import { useSuppliers } from '@/hooks/use-organisations'
import { UnifiedOrganisationForm, OrganisationFormData, Organisation } from './unified-organisation-form'
import { SupplierSegmentSelect } from './supplier-segment-select'
import { SupplierSegmentType } from './supplier-segment-badge'
import { ConfirmSubmitModal } from './confirm-submit-modal'
import { toast } from 'sonner'
import { Building2, Mail, Phone, MapPin, Globe, CreditCard } from 'lucide-react'

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

  // États pour modal de confirmation
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [pendingFormData, setPendingFormData] = useState<OrganisationFormData | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const isEditing = !!supplier

  // Charger données taxonomie en mode édition
  useState(() => {
    if (isEditing && supplier) {
      setTaxonomyData({
        supplier_segment: (supplier.supplier_segment as SupplierSegmentType) || null
      })
    }
  })

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
      const supplierData = {
        ...pendingFormData,
        type: 'supplier' as const,
        supplier_segment: taxonomyData.supplier_segment
      }

      let result

      if (isEditing && supplier) {
        // Mise à jour
        result = await updateOrganisation({
          id: supplier.id,
          legal_name: supplierData.legal_name,
          trade_name: supplierData.trade_name || undefined,
          has_different_trade_name: supplierData.has_different_trade_name || false,
          email: supplierData.email || undefined,
          country: supplierData.country,
          phone: supplierData.phone || undefined,
          website: supplierData.website || undefined,
          is_active: supplierData.is_active,
          notes: supplierData.notes || undefined,

          // Adresse de facturation
          billing_address_line1: supplierData.billing_address_line1 || undefined,
          billing_address_line2: supplierData.billing_address_line2 || undefined,
          billing_postal_code: supplierData.billing_postal_code || undefined,
          billing_city: supplierData.billing_city || undefined,
          billing_region: supplierData.billing_region || undefined,
          billing_country: supplierData.billing_country || 'FR',

          // Légal
          legal_form: supplierData.legal_form || undefined,
          siren: supplierData.siren || undefined,
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
          trade_name: supplierData.trade_name || undefined,
          has_different_trade_name: supplierData.has_different_trade_name || false,
          type: 'supplier',
          email: supplierData.email || undefined,
          country: supplierData.country,
          phone: supplierData.phone || undefined,
          website: supplierData.website || undefined,
          is_active: supplierData.is_active,
          notes: supplierData.notes || undefined,

          // Adresse de facturation
          billing_address_line1: supplierData.billing_address_line1 || undefined,
          billing_address_line2: supplierData.billing_address_line2 || undefined,
          billing_postal_code: supplierData.billing_postal_code || undefined,
          billing_city: supplierData.billing_city || undefined,
          billing_region: supplierData.billing_region || undefined,
          billing_country: supplierData.billing_country || 'FR',

          // Légal
          legal_form: supplierData.legal_form || undefined,
          siren: supplierData.siren || undefined,
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
        toast.success(isEditing ? 'Fournisseur modifié avec succès !' : 'Fournisseur créé avec succès !')
        onSuccess?.(result as Organisation)
        setConfirmOpen(false)
        onClose()
      } else {
        toast.error('Erreur lors de la sauvegarde. Veuillez réessayer.')
      }
    } catch (error) {
      toast.error('Une erreur est survenue lors de la sauvegarde.')
      console.error('Erreur sauvegarde fournisseur:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Préparer les données de récapitulatif pour le modal
  const getSummaryData = () => {
    if (!pendingFormData) return []

    const items = [
      {
        label: 'Nom du fournisseur',
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
    <>
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

      {/* Modal de confirmation avant sauvegarde */}
      <ConfirmSubmitModal
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={isEditing ? 'Confirmer la modification' : 'Confirmer la création'}
        description={
          isEditing
            ? 'Veuillez vérifier les informations modifiées ci-dessous avant de sauvegarder.'
            : 'Veuillez vérifier les informations du nouveau fournisseur ci-dessous avant de créer.'
        }
        summaryData={getSummaryData()}
        onConfirm={handleConfirmSubmit}
        confirmLabel={isEditing ? 'Modifier le fournisseur' : 'Créer le fournisseur'}
        isSubmitting={isSubmitting}
      />
    </>
  )
}

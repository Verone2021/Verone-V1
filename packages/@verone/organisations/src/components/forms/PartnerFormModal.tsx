'use client';

import type { Organisation } from '@verone/organisations/hooks';
import { useOrganisations } from '@verone/organisations/hooks';

import type { OrganisationFormData } from './unified-organisation-form';
import { UnifiedOrganisationForm } from './unified-organisation-form';

interface PartnerFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  partner?: Organisation | null; // null = création, objet = édition
  onSuccess?: (partner: Organisation) => void;
}

/**
 * Modal pour création/édition de prestataire (partner)
 * Utilise UnifiedOrganisationForm sans section personnalisée
 */
export function PartnerFormModal({
  isOpen,
  onClose,
  partner = null,
  onSuccess,
}: PartnerFormModalProps) {
  const { createOrganisation, updateOrganisation } = useOrganisations({
    type: 'partner',
  });

  const isEditing = !!partner;

  const handleSubmit = async (
    data: OrganisationFormData,
    _organisationId?: string
  ) => {
    const partnerData = {
      ...data,
      type: 'partner' as const,
    };

    let result;

    if (isEditing && partner) {
      // Mise à jour
      result = await updateOrganisation({
        id: partner.id,
        legal_name: partnerData.legal_name,
        email: partnerData.email ?? undefined,
        secondary_email: partnerData.secondary_email ?? undefined,
        country: partnerData.country,
        phone: partnerData.phone ?? undefined,
        website: partnerData.website ?? undefined,
        is_active: partnerData.is_active,
        notes: partnerData.notes ?? undefined,

        // Adresse principale (legacy)
        address_line1: partnerData.address_line1 ?? undefined,
        address_line2: partnerData.address_line2 ?? undefined,
        postal_code: partnerData.postal_code ?? undefined,
        city: partnerData.city ?? undefined,
        region: partnerData.region ?? undefined,

        // Adresse facturation
        billing_address_line1: partnerData.billing_address_line1 ?? undefined,
        billing_address_line2: partnerData.billing_address_line2 ?? undefined,
        billing_postal_code: partnerData.billing_postal_code ?? undefined,
        billing_city: partnerData.billing_city ?? undefined,
        billing_region: partnerData.billing_region ?? undefined,
        billing_country: partnerData.billing_country ?? undefined,

        // Adresse livraison
        shipping_address_line1: partnerData.shipping_address_line1 ?? undefined,
        shipping_address_line2: partnerData.shipping_address_line2 ?? undefined,
        shipping_postal_code: partnerData.shipping_postal_code ?? undefined,
        shipping_city: partnerData.shipping_city ?? undefined,
        shipping_region: partnerData.shipping_region ?? undefined,
        shipping_country: partnerData.shipping_country ?? undefined,
        has_different_shipping_address:
          partnerData.has_different_shipping_address,

        // GPS
        latitude: partnerData.latitude ?? undefined,
        longitude: partnerData.longitude ?? undefined,

        // Identite commerciale
        has_different_trade_name: partnerData.has_different_trade_name,
        trade_name: partnerData.trade_name ?? undefined,

        // Légal
        legal_form: partnerData.legal_form ?? undefined,
        siren: partnerData.siren ?? undefined,
        siret: partnerData.siret ?? undefined,
        vat_number: partnerData.vat_number ?? undefined,
        industry_sector: partnerData.industry_sector ?? undefined,

        // Commercial
        currency: partnerData.currency ?? 'EUR',
        payment_terms: partnerData.payment_terms ?? undefined,
      });
    } else {
      // Création
      result = await createOrganisation({
        legal_name: partnerData.legal_name ?? partnerData.name,
        type: 'partner',
        email: partnerData.email ?? undefined,
        secondary_email: partnerData.secondary_email ?? undefined,
        country: partnerData.country,
        phone: partnerData.phone ?? undefined,
        website: partnerData.website ?? undefined,
        is_active: partnerData.is_active,
        notes: partnerData.notes ?? undefined,

        // Adresse principale (legacy)
        address_line1: partnerData.address_line1 ?? undefined,
        address_line2: partnerData.address_line2 ?? undefined,
        postal_code: partnerData.postal_code ?? undefined,
        city: partnerData.city ?? undefined,
        region: partnerData.region ?? undefined,

        // Adresse facturation
        billing_address_line1: partnerData.billing_address_line1 ?? undefined,
        billing_address_line2: partnerData.billing_address_line2 ?? undefined,
        billing_postal_code: partnerData.billing_postal_code ?? undefined,
        billing_city: partnerData.billing_city ?? undefined,
        billing_region: partnerData.billing_region ?? undefined,
        billing_country: partnerData.billing_country ?? undefined,

        // Adresse livraison
        shipping_address_line1: partnerData.shipping_address_line1 ?? undefined,
        shipping_address_line2: partnerData.shipping_address_line2 ?? undefined,
        shipping_postal_code: partnerData.shipping_postal_code ?? undefined,
        shipping_city: partnerData.shipping_city ?? undefined,
        shipping_region: partnerData.shipping_region ?? undefined,
        shipping_country: partnerData.shipping_country ?? undefined,
        has_different_shipping_address:
          partnerData.has_different_shipping_address,

        // GPS
        latitude: partnerData.latitude ?? undefined,
        longitude: partnerData.longitude ?? undefined,

        // Identite commerciale
        has_different_trade_name: partnerData.has_different_trade_name,
        trade_name: partnerData.trade_name ?? undefined,

        // Légal
        legal_form: partnerData.legal_form ?? undefined,
        siren: partnerData.siren ?? undefined,
        siret: partnerData.siret ?? undefined,
        vat_number: partnerData.vat_number ?? undefined,
        industry_sector: partnerData.industry_sector ?? undefined,

        // Commercial
        currency: partnerData.currency ?? 'EUR',
        payment_terms: partnerData.payment_terms ?? undefined,
      });
    }

    if (result) {
      console.warn('✅ Prestataire sauvegardé avec succès');
      onSuccess?.(result as Organisation);
      onClose();
    } else {
      console.error('❌ Erreur lors de la sauvegarde');
      alert('Erreur lors de la sauvegarde. Veuillez réessayer.');
    }
  };

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
  );
}

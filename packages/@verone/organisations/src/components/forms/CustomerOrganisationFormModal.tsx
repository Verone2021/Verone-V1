'use client';

import type { Organisation } from '@verone/organisations/hooks';
import { useOrganisations } from '@verone/organisations/hooks';

import type { OrganisationFormData } from './unified-organisation-form';
import { UnifiedOrganisationForm } from './unified-organisation-form';

interface CustomerOrganisationFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  organisation?: Organisation | null; // null = creation, objet = edition
  onSuccess?: (organisation: Organisation) => void;
  /** Pre-fill enseigne_id (LinkMe context) */
  enseigneId?: string | null;
  /** Track origin: 'manual' | 'linkme' | 'site-internet' */
  sourceType?: 'manual' | 'linkme' | 'site-internet';
}

/**
 * Modal pour creation/edition de client professionnel (organisation customer)
 * Utilise UnifiedOrganisationForm — source de verite unique
 *
 * Utilise par :
 * - /contacts-organisations/customers (standalone)
 * - customer-selector.tsx (commandes manuelles + factures + devis)
 * - CreateLinkMeOrderModal (commandes LinkMe)
 * - apps/linkme/organisations (app LinkMe)
 */
export function CustomerOrganisationFormModal({
  isOpen,
  onClose,
  organisation = null,
  onSuccess,
  enseigneId,
  sourceType = 'manual',
}: CustomerOrganisationFormModalProps) {
  const { createOrganisation, updateOrganisation } = useOrganisations({
    type: 'customer',
  });

  const isEditing = !!organisation;

  const handleSubmit = async (
    data: OrganisationFormData,
    _organisationId?: string
  ) => {
    const customerData = {
      ...data,
      type: 'customer' as const,
    };

    let result;

    if (isEditing && organisation) {
      result = await updateOrganisation({
        id: organisation.id,
        legal_name: customerData.legal_name,
        email: customerData.email ?? undefined,
        secondary_email: customerData.secondary_email ?? undefined,
        country: customerData.country,
        phone: customerData.phone ?? undefined,
        website: customerData.website ?? undefined,
        is_active: customerData.is_active,
        notes: customerData.notes ?? undefined,

        // Adresse principale
        address_line1: customerData.address_line1 ?? undefined,
        address_line2: customerData.address_line2 ?? undefined,
        postal_code: customerData.postal_code ?? undefined,
        city: customerData.city ?? undefined,
        region: customerData.region ?? undefined,

        // Adresse facturation
        billing_address_line1: customerData.billing_address_line1 ?? undefined,
        billing_address_line2: customerData.billing_address_line2 ?? undefined,
        billing_postal_code: customerData.billing_postal_code ?? undefined,
        billing_city: customerData.billing_city ?? undefined,
        billing_region: customerData.billing_region ?? undefined,
        billing_country: customerData.billing_country ?? undefined,

        // Adresse livraison
        shipping_address_line1:
          customerData.shipping_address_line1 ?? undefined,
        shipping_address_line2:
          customerData.shipping_address_line2 ?? undefined,
        shipping_postal_code: customerData.shipping_postal_code ?? undefined,
        shipping_city: customerData.shipping_city ?? undefined,
        shipping_region: customerData.shipping_region ?? undefined,
        shipping_country: customerData.shipping_country ?? undefined,
        has_different_shipping_address:
          customerData.has_different_shipping_address,

        // GPS
        latitude: customerData.latitude ?? undefined,
        longitude: customerData.longitude ?? undefined,

        // Identite commerciale
        has_different_trade_name: customerData.has_different_trade_name,
        trade_name: customerData.trade_name ?? undefined,

        // Enseigne
        enseigne_id: customerData.enseigne_id ?? enseigneId ?? undefined,
        ownership_type:
          customerData.ownership_type === 'propre'
            ? 'succursale'
            : (customerData.ownership_type ?? undefined),

        // Legal
        legal_form: customerData.legal_form ?? undefined,
        siren: customerData.siren ?? undefined,
        siret: customerData.siret ?? undefined,
        vat_number: customerData.vat_number ?? undefined,
        industry_sector: customerData.industry_sector ?? undefined,

        // Commercial
        currency: customerData.currency ?? 'EUR',
        payment_terms: customerData.payment_terms ?? undefined,
      });
    } else {
      result = await createOrganisation({
        legal_name: customerData.legal_name ?? customerData.name,
        type: 'customer',
        source: 'manual' as const,
        source_type: sourceType,
        email: customerData.email ?? undefined,
        secondary_email: customerData.secondary_email ?? undefined,
        country: customerData.country,
        phone: customerData.phone ?? undefined,
        website: customerData.website ?? undefined,
        is_active: customerData.is_active,
        notes: customerData.notes ?? undefined,

        // Adresse principale
        address_line1: customerData.address_line1 ?? undefined,
        address_line2: customerData.address_line2 ?? undefined,
        postal_code: customerData.postal_code ?? undefined,
        city: customerData.city ?? undefined,
        region: customerData.region ?? undefined,

        // Adresse facturation
        billing_address_line1: customerData.billing_address_line1 ?? undefined,
        billing_address_line2: customerData.billing_address_line2 ?? undefined,
        billing_postal_code: customerData.billing_postal_code ?? undefined,
        billing_city: customerData.billing_city ?? undefined,
        billing_region: customerData.billing_region ?? undefined,
        billing_country: customerData.billing_country ?? undefined,

        // Adresse livraison
        shipping_address_line1:
          customerData.shipping_address_line1 ?? undefined,
        shipping_address_line2:
          customerData.shipping_address_line2 ?? undefined,
        shipping_postal_code: customerData.shipping_postal_code ?? undefined,
        shipping_city: customerData.shipping_city ?? undefined,
        shipping_region: customerData.shipping_region ?? undefined,
        shipping_country: customerData.shipping_country ?? undefined,
        has_different_shipping_address:
          customerData.has_different_shipping_address,

        // GPS
        latitude: customerData.latitude ?? undefined,
        longitude: customerData.longitude ?? undefined,

        // Identite commerciale
        has_different_trade_name: customerData.has_different_trade_name,
        trade_name: customerData.trade_name ?? undefined,

        // Enseigne
        enseigne_id: enseigneId ?? customerData.enseigne_id ?? undefined,
        ownership_type:
          customerData.ownership_type === 'propre'
            ? 'succursale'
            : (customerData.ownership_type ?? undefined),

        // Legal
        legal_form: customerData.legal_form ?? undefined,
        siren: customerData.siren ?? undefined,
        siret: customerData.siret ?? undefined,
        vat_number: customerData.vat_number ?? undefined,
        industry_sector: customerData.industry_sector ?? undefined,

        // Commercial
        currency: customerData.currency ?? 'EUR',
        payment_terms: customerData.payment_terms ?? undefined,
      });
    }

    if (result) {
      onSuccess?.(result as Organisation);
      onClose();
    } else {
      console.error('[CustomerOrganisationFormModal] Save failed');
      alert('Erreur lors de la sauvegarde. Veuillez reessayer.');
    }
  };

  return (
    <UnifiedOrganisationForm
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={handleSubmit}
      onSuccess={onSuccess}
      organisationType="customer"
      organisation={organisation}
      mode={isEditing ? 'edit' : 'create'}
      title={
        isEditing
          ? "Modifier l'organisation cliente"
          : 'Nouveau client professionnel'
      }
      onLogoUploadSuccess={() => {
        // Refetch handled by React Query invalidation
      }}
    />
  );
}

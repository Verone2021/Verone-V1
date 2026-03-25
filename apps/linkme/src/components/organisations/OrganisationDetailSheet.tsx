'use client';

/**
 * OrganisationDetailSheet
 *
 * Fiche détaillée d'une organisation avec onglets :
 * - Infos : Toutes les informations avec édition section par section
 * - Contacts : Téléphone, emails, site web
 * - Activité : Stats + 5 dernières commandes
 *
 * Mode view : Lecture seule (pour /reseau)
 * Mode edit : Édition section par section avec bouton modifier inline
 *
 * @module OrganisationDetailSheet
 * @since 2026-01-12
 * @updated 2026-01-15 - Refonte édition section par section (LM-ORG-005)
 */

import { useMemo, useState, useEffect } from 'react';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { OrganisationLogo } from '@verone/organisations/components/display/OrganisationLogo';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  Tabs,
  TabsList,
  TabsTrigger,
  Skeleton,
  type AddressResult,
} from '@verone/ui';
import { createClient } from '@verone/utils/supabase/client';
import { toast } from 'sonner';

import { usePermissions } from '@/hooks/use-permissions';

import { InfosTab, ContactsTab, ActivityTab } from './organisation-detail';
import { useOrganisationContacts } from '../../lib/hooks/use-organisation-contacts';
import { useOrganisationDetail } from '../../lib/hooks/use-organisation-detail';

// =====================================================================
// TYPES
// =====================================================================

interface OrganisationDetailSheetProps {
  organisationId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: 'view' | 'edit';
  onEdit?: () => void; // Deprecated - kept for compatibility
  /** Tab to show when opening the sheet (default: 'infos') */
  defaultTab?: 'infos' | 'contacts' | 'activite';
}

// =====================================================================
// MAIN COMPONENT
// =====================================================================

export function OrganisationDetailSheet({
  organisationId,
  open,
  onOpenChange,
  mode,
  defaultTab = 'infos',
}: OrganisationDetailSheetProps) {
  const [activeTab, setActiveTab] = useState(defaultTab);
  const { canViewCommissions } = usePermissions();

  // Sync activeTab when sheet opens with a specific tab
  useEffect(() => {
    if (open) {
      setActiveTab(defaultTab);
    }
  }, [open, defaultTab]);

  const { data, isLoading, error } = useOrganisationDetail(
    open ? organisationId : null
  );

  // Map ownership_type: 'propre' -> 'succursale' for compatibility
  const contactOwnershipType =
    data?.organisation?.ownership_type === 'propre'
      ? 'succursale'
      : (data?.organisation?.ownership_type as
          | 'succursale'
          | 'franchise'
          | null);

  const { data: contactsData, isLoading: contactsLoading } =
    useOrganisationContacts(
      open ? organisationId : null,
      open ? data?.organisation?.enseigne_id : null,
      open ? contactOwnershipType : null
    );

  // États pour l'édition de chaque section
  const [editingSection, setEditingSection] = useState<string | null>(null);

  // États des formulaires par section
  const [ownershipTypeForm, setOwnershipTypeForm] = useState<
    'succursale' | 'franchise' | null
  >(null);

  const [shippingForm, setShippingForm] = useState({
    shipping_address_line1: '',
    shipping_address_line2: '',
    shipping_city: '',
    shipping_postal_code: '',
    shipping_country: 'France',
    latitude: null as number | null,
    longitude: null as number | null,
  });

  const [billingForm, setBillingForm] = useState({
    billing_address_line1: '',
    billing_address_line2: '',
    billing_city: '',
    billing_postal_code: '',
    billing_country: 'France',
  });

  const [contactsForm, setContactsForm] = useState({
    phone: '',
    email: '',
    website: '',
  });

  const [legalForm, setLegalForm] = useState({
    siren: '',
    siret: '',
    vat_number: '',
  });

  const queryClient = useQueryClient();
  const supabase = createClient();

  // Mutation générique pour mettre à jour n'importe quel champ
  const updateMutation = useMutation({
    mutationFn: async (updates: Record<string, unknown>) => {
      if (!organisationId) throw new Error('No organisation ID');

      const { error } = await supabase
        .from('organisations')
        .update(updates)
        .eq('id', organisationId);

      if (error) throw error;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ['organisation-detail', organisationId],
      });
      await queryClient.invalidateQueries({
        queryKey: ['enseigne-organisations'],
      });
      toast.success('Modifications enregistrées');
      setEditingSection(null);
    },
    onError: error => {
      console.error('Error updating organisation:', error);
      toast.error('Erreur lors de la mise à jour');
    },
  });

  // Initialiser les formulaires quand les données changent
  useEffect(() => {
    if (data?.organisation) {
      const org = data.organisation;
      // Mapper 'propre' vers 'succursale' (propre est obsolète)
      const mappedOwnershipType =
        org.ownership_type === 'propre' ? 'succursale' : org.ownership_type;
      setOwnershipTypeForm(mappedOwnershipType);
      setShippingForm({
        shipping_address_line1: org.shipping_address_line1 ?? '',
        shipping_address_line2: org.shipping_address_line2 ?? '',
        shipping_city: org.shipping_city ?? '',
        shipping_postal_code: org.shipping_postal_code ?? '',
        shipping_country: org.shipping_country ?? 'France',
        latitude: org.latitude,
        longitude: org.longitude,
      });
      setBillingForm({
        billing_address_line1: org.billing_address_line1 ?? '',
        billing_address_line2: org.billing_address_line2 ?? '',
        billing_city: org.billing_city ?? '',
        billing_postal_code: org.billing_postal_code ?? '',
        billing_country: org.billing_country ?? 'France',
      });
      setContactsForm({
        phone: org.phone ?? '',
        email: org.email ?? '',
        website: org.website ?? '',
      });
      setLegalForm({
        siren: org.siren ?? '',
        siret: org.siret ?? '',
        vat_number: org.vat_number ?? '',
      });
    }
  }, [data?.organisation]);

  // Reset editing state when sheet closes
  useEffect(() => {
    if (!open) {
      setEditingSection(null);
    }
  }, [open]);

  // Handlers pour chaque section
  const handleSaveOwnershipType = () => {
    updateMutation.mutate({ ownership_type: ownershipTypeForm });
  };

  const handleSaveShipping = () => {
    updateMutation.mutate(shippingForm);
  };

  const handleSaveBilling = () => {
    updateMutation.mutate(billingForm);
  };

  const handleSaveContacts = () => {
    updateMutation.mutate(contactsForm);
  };

  const handleSaveLegal = () => {
    updateMutation.mutate(legalForm);
  };

  const handleShippingAddressSelect = (address: AddressResult) => {
    setShippingForm(prev => ({
      ...prev,
      shipping_address_line1: address.streetAddress,
      shipping_city: address.city,
      shipping_postal_code: address.postalCode,
      shipping_country: address.country || 'France',
      latitude: address.latitude,
      longitude: address.longitude,
    }));
  };

  const handleBillingAddressSelect = (address: AddressResult) => {
    setBillingForm(prev => ({
      ...prev,
      billing_address_line1: address.streetAddress,
      billing_city: address.city,
      billing_postal_code: address.postalCode,
      billing_country: address.country || 'France',
    }));
  };

  // Adresses formatées (données backfillées en DB, pas de fallback legacy)
  const shippingAddress = useMemo(() => {
    if (!data?.organisation) return null;
    const org = data.organisation;
    const parts = [
      org.shipping_address_line1,
      org.shipping_address_line2,
      [org.shipping_postal_code, org.shipping_city].filter(Boolean).join(' '),
      org.shipping_country && org.shipping_country !== 'France'
        ? org.shipping_country
        : null,
    ].filter(Boolean);
    return parts.length > 0 ? parts.join('\n') : null;
  }, [data?.organisation]);

  const billingAddress = useMemo(() => {
    if (!data?.organisation) return null;
    const org = data.organisation;
    const parts = [
      org.billing_address_line1,
      org.billing_address_line2,
      [org.billing_postal_code, org.billing_city].filter(Boolean).join(' '),
      org.billing_country && org.billing_country !== 'France'
        ? org.billing_country
        : null,
    ].filter(Boolean);
    return parts.length > 0 ? parts.join('\n') : null;
  }, [data?.organisation]);

  const displayName =
    data?.organisation?.trade_name ?? data?.organisation?.legal_name ?? '';

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto bg-white">
        {/* Header */}
        <SheetHeader className="pb-4 border-b">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <OrganisationLogo
                logoUrl={data?.organisation?.logo_url}
                organisationName={displayName}
                size="lg"
                fallback="icon"
                className="rounded-xl"
              />
              <div className="flex-1 min-w-0">
                <SheetTitle className="text-lg truncate">
                  {displayName}
                </SheetTitle>
                {data?.organisation?.trade_name &&
                  data.organisation.trade_name !==
                    data.organisation.legal_name && (
                    <p className="text-sm text-gray-500 truncate">
                      {data.organisation.legal_name}
                    </p>
                  )}
              </div>
            </div>
          </div>
        </SheetHeader>

        {/* Loading state */}
        {isLoading && (
          <div className="py-6 space-y-4">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="py-6 text-center text-red-500">
            <p>Erreur lors du chargement</p>
          </div>
        )}

        {/* Content */}
        {data && !isLoading && (
          <Tabs
            value={activeTab}
            onValueChange={v =>
              setActiveTab(v as 'infos' | 'contacts' | 'activite')
            }
            className="mt-4"
          >
            <TabsList className="w-full grid grid-cols-3 bg-gray-100">
              <TabsTrigger
                value="infos"
                className="data-[state=active]:bg-linkme-turquoise data-[state=active]:text-white"
              >
                Infos
              </TabsTrigger>
              <TabsTrigger
                value="contacts"
                className="data-[state=active]:bg-linkme-turquoise data-[state=active]:text-white"
              >
                Contacts
              </TabsTrigger>
              <TabsTrigger
                value="activite"
                className="data-[state=active]:bg-linkme-turquoise data-[state=active]:text-white"
              >
                Activité
              </TabsTrigger>
            </TabsList>

            <InfosTab
              data={data}
              mode={mode}
              editingSection={editingSection}
              setEditingSection={setEditingSection}
              isPending={updateMutation.isPending}
              ownershipTypeForm={ownershipTypeForm}
              setOwnershipTypeForm={setOwnershipTypeForm}
              onSaveOwnershipType={handleSaveOwnershipType}
              shippingForm={shippingForm}
              setShippingForm={setShippingForm}
              onShippingAddressSelect={handleShippingAddressSelect}
              onSaveShipping={handleSaveShipping}
              shippingAddress={shippingAddress}
              billingForm={billingForm}
              setBillingForm={setBillingForm}
              onBillingAddressSelect={handleBillingAddressSelect}
              onSaveBilling={handleSaveBilling}
              billingAddress={billingAddress}
              contactsForm={contactsForm}
              setContactsForm={setContactsForm}
              onSaveContacts={handleSaveContacts}
              legalForm={legalForm}
              setLegalForm={setLegalForm}
              onSaveLegal={handleSaveLegal}
            />

            <ContactsTab
              organisationId={organisationId}
              data={data}
              mode={mode}
              contactsData={contactsData}
              contactsLoading={contactsLoading}
            />

            <ActivityTab data={data} canViewCommissions={canViewCommissions} />
          </Tabs>
        )}
      </SheetContent>
    </Sheet>
  );
}

export default OrganisationDetailSheet;

'use client';

import { useState, useEffect, useCallback } from 'react';

import { useToast } from '@verone/common/hooks';
import { CustomerOrganisationFormModal } from '@verone/organisations';
import {
  ButtonV2,
  Combobox,
  Label,
  RadioGroup,
  RadioGroupItem,
} from '@verone/ui';
import { createClient } from '@verone/utils/supabase/client';
import { getOrganisationCardName } from '@verone/utils/utils/organisation-helpers';
import { Plus } from 'lucide-react';

import { CreateIndividualCustomerModal } from './create-individual-customer-modal';

export type CustomerType = 'professional' | 'individual';

export interface UnifiedCustomer {
  id: string;
  name: string;
  type: CustomerType;
  // Identité B2B
  legal_name?: string | null;
  trade_name?: string | null;
  siret?: string | null;
  // Conditions de paiement
  payment_terms?: string | null; // DEPRECATED - garder pour rétro-compatibilité
  payment_terms_type?: string | null; // NOUVEAU - enum payment_terms_type
  payment_terms_notes?: string | null; // NOUVEAU - notes complémentaires
  prepayment_required?: boolean | null;
  // Canal de vente par défaut
  default_channel_id?: string | null;
  // Adresses pour B2B (organisations)
  billing_address_line1?: string;
  billing_address_line2?: string;
  billing_city?: string;
  billing_postal_code?: string;
  billing_region?: string;
  billing_country?: string;
  shipping_address_line1?: string;
  shipping_address_line2?: string;
  shipping_city?: string;
  shipping_postal_code?: string;
  shipping_region?: string;
  shipping_country?: string;
  has_different_shipping_address?: boolean;
  // Adresses pour B2C (individual_customers)
  address_line1?: string;
  address_line2?: string;
  city?: string;
  postal_code?: string;
  region?: string;
  country?: string;
  billing_address_line1_individual?: string;
  billing_address_line2_individual?: string;
  billing_city_individual?: string;
  billing_postal_code_individual?: string;
  billing_region_individual?: string;
  billing_country_individual?: string;
  has_different_billing_address?: boolean;
}

interface CustomerSelectorProps {
  selectedCustomer: UnifiedCustomer | null;
  onCustomerChange: (customer: UnifiedCustomer | null) => void;
  disabled?: boolean;
  enseigneId?: string | null;
}

export function CustomerSelector({
  selectedCustomer,
  onCustomerChange,
  disabled,
  enseigneId,
}: CustomerSelectorProps) {
  const [customerType, setCustomerType] =
    useState<CustomerType>('professional');
  const [customers, setCustomers] = useState<UnifiedCustomer[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCreateOrgOpen, setIsCreateOrgOpen] = useState(false);
  const { toast } = useToast();

  // Charger les clients selon le type sélectionné (et l'enseigne si fournie)
  // Retourne la liste fraîche pour auto-select post-création (évite stale closure)
  const loadCustomers = useCallback(async (): Promise<UnifiedCustomer[]> => {
    try {
      setLoading(true);
      setError(null);

      const supabase = createClient();

      if (customerType === 'professional') {
        let orgQuery = supabase
          .from('organisations')
          .select(
            `
            id,
            legal_name,
            trade_name,
            siret,
            payment_terms,
            payment_terms_type,
            payment_terms_notes,
            prepayment_required,
            default_channel_id,
            billing_address_line1,
            billing_address_line2,
            billing_city,
            billing_postal_code,
            billing_region,
            billing_country,
            shipping_address_line1,
            shipping_address_line2,
            shipping_city,
            shipping_postal_code,
            shipping_region,
            shipping_country,
            has_different_shipping_address
          `
          )
          .eq('type', 'customer')
          .eq('is_active', true);

        if (enseigneId) {
          orgQuery = orgQuery.eq('enseigne_id', enseigneId);
        }

        const { data: organisations, error: orgError } =
          await orgQuery.order('legal_name');

        if (orgError) throw orgError;

        const mapped = (organisations ?? []).map(org => ({
          ...org,
          name: getOrganisationCardName(org),
          type: 'professional' as const,
        })) as unknown as UnifiedCustomer[];

        setCustomers(mapped);
        return mapped;
      } else {
        const { data: individuals, error: indError } = await supabase
          .from('individual_customers')
          .select(
            `
            id,
            first_name,
            last_name,
            payment_terms_type,
            payment_terms_notes,
            address_line1,
            address_line2,
            city,
            postal_code,
            region,
            country,
            billing_address_line1_individual:billing_address_line1,
            billing_address_line2_individual:billing_address_line2,
            billing_city_individual:billing_city,
            billing_postal_code_individual:billing_postal_code,
            billing_region_individual:billing_region,
            billing_country_individual:billing_country,
            has_different_billing_address
          `
          )
          .eq('is_active', true)
          .order('first_name');

        if (indError) throw indError;

        const mapped = (individuals ?? []).map(ind => ({
          id: ind.id,
          name: `${ind.first_name} ${ind.last_name}`,
          type: 'individual' as const,
          address_line1: ind.address_line1,
          address_line2: ind.address_line2,
          city: ind.city,
          postal_code: ind.postal_code,
          region: ind.region,
          country: ind.country,
          billing_address_line1_individual:
            ind.billing_address_line1_individual,
          billing_address_line2_individual:
            ind.billing_address_line2_individual,
          billing_city_individual: ind.billing_city_individual,
          billing_postal_code_individual: ind.billing_postal_code_individual,
          billing_region_individual: ind.billing_region_individual,
          billing_country_individual: ind.billing_country_individual,
          has_different_billing_address: ind.has_different_billing_address,
        })) as unknown as UnifiedCustomer[];

        setCustomers(mapped);
        return mapped;
      }
    } catch (err) {
      console.error('[CustomerSelector] loadCustomers error:', err);
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
      return [];
    } finally {
      setLoading(false);
    }
  }, [customerType, enseigneId]);

  useEffect(() => {
    void loadCustomers();
  }, [loadCustomers]);

  const handleTypeChange = (newType: CustomerType) => {
    setCustomerType(newType);
    // Réinitialiser la sélection quand on change de type
    onCustomerChange(null);
  };

  const handleCustomerChange = (customerId: string) => {
    if (!customerId) {
      onCustomerChange(null);
      return;
    }

    const customer = customers.find(c => c.id === customerId);
    if (customer) {
      onCustomerChange(customer);
    }
  };

  // Handler pour la création d'organisation professionnelle
  const handleOrganisationCreated = async (
    organisationId: string,
    organisationName: string
  ) => {
    // Rafraîchir la liste et utiliser la valeur retournée (évite stale closure)
    const freshList = await loadCustomers();
    const newOrg = freshList.find(c => c.id === organisationId);
    onCustomerChange(
      newOrg ?? {
        id: organisationId,
        name: organisationName,
        type: 'professional',
      }
    );
    toast({
      title: 'Client créé et sélectionné',
      description: `${organisationName} a été créé et sélectionné automatiquement.`,
    });
  };

  // Handler pour la création de client particulier
  const handleIndividualCustomerCreated = async (
    customerId: string,
    customerName: string
  ) => {
    // Rafraîchir la liste et utiliser la valeur retournée (évite stale closure)
    const freshList = await loadCustomers();
    const newCustomer = freshList.find(c => c.id === customerId);
    onCustomerChange(
      newCustomer ?? {
        id: customerId,
        name: customerName,
        type: 'individual',
      }
    );
    toast({
      title: 'Client créé et sélectionné',
      description: `${customerName} a été créé et sélectionné automatiquement.`,
    });
  };

  // Options pour le Combobox
  const customerOptions = customers.map(customer => ({
    value: customer.id,
    label: customer.name,
  }));

  return (
    <div className="space-y-4">
      {/* Choix du type de client */}
      <div className="space-y-2">
        <Label>Type de client *</Label>
        <RadioGroup
          value={customerType}
          onValueChange={value => handleTypeChange(value as CustomerType)}
          disabled={disabled}
          className="flex gap-6"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="professional" id="professional" />
            <Label htmlFor="professional">Client Professionnel (B2B)</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="individual" id="individual" />
            <Label htmlFor="individual">Client Particulier (B2C)</Label>
          </div>
        </RadioGroup>
      </div>

      {/* Sélection du client */}
      <div className="space-y-2">
        <Label htmlFor="customer">
          {customerType === 'professional'
            ? 'Organisation'
            : 'Client particulier'}{' '}
          *
        </Label>

        {error ? (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-600 text-sm">❌ {error}</p>
            <button
              onClick={() => {
                void loadCustomers();
              }}
              className="mt-1 text-red-700 underline text-xs"
              disabled={disabled}
            >
              Réessayer
            </button>
          </div>
        ) : (
          <div className="flex gap-2">
            <div className="flex-1">
              <Combobox
                options={customerOptions}
                value={selectedCustomer?.id ?? ''}
                onValueChange={handleCustomerChange}
                placeholder={
                  loading
                    ? 'Chargement...'
                    : `Sélectionner ${customerType === 'professional' ? 'une organisation' : 'un client particulier'}...`
                }
                searchPlaceholder={
                  customerType === 'professional'
                    ? 'Rechercher une organisation...'
                    : 'Rechercher un client...'
                }
                emptyMessage="Aucun client trouvé."
                disabled={!!disabled || loading}
              />
            </div>

            {/* Bouton création selon le type */}
            {customerType === 'professional' ? (
              <>
                <ButtonV2
                  variant="outline"
                  size="sm"
                  onClick={() => setIsCreateOrgOpen(true)}
                  className="shrink-0"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Nouveau
                </ButtonV2>
                <CustomerOrganisationFormModal
                  isOpen={isCreateOrgOpen}
                  onClose={() => setIsCreateOrgOpen(false)}
                  enseigneId={enseigneId}
                  onSuccess={org => {
                    void handleOrganisationCreated(
                      org.id,
                      org.legal_name ?? org.trade_name ?? 'Organisation'
                    );
                  }}
                />
              </>
            ) : (
              <CreateIndividualCustomerModal
                onCustomerCreated={(...args) => {
                  void handleIndividualCustomerCreated(...args);
                }}
              />
            )}
          </div>
        )}
      </div>

      {/* Affichage des informations du client sélectionné */}
      {selectedCustomer && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-md">
          <p className="text-green-700 text-sm">
            ✅ Client sélectionné: <strong>{selectedCustomer.name}</strong>(
            {customerType === 'professional' ? 'B2B' : 'B2C'})
          </p>
        </div>
      )}
    </div>
  );
}

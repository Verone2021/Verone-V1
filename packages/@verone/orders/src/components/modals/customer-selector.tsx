'use client';

import { useState, useEffect } from 'react';

import { Label } from '@verone/ui';
import { RadioGroup, RadioGroupItem } from '@verone/ui';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@verone/ui';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@verone/common/hooks';

import { CreateIndividualCustomerModal } from './create-individual-customer-modal';
import { CreateOrganisationModal } from './create-organisation-modal';

export type CustomerType = 'professional' | 'individual';

export interface UnifiedCustomer {
  id: string;
  name: string;
  type: CustomerType;
  // Conditions de paiement
  payment_terms?: string | null;
  prepayment_required?: boolean | null;
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
}

export function CustomerSelector({
  selectedCustomer,
  onCustomerChange,
  disabled,
}: CustomerSelectorProps) {
  const [customerType, setCustomerType] =
    useState<CustomerType>('professional');
  const [customers, setCustomers] = useState<UnifiedCustomer[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Charger les clients selon le type sélectionné
  useEffect(() => {
    loadCustomers();
  }, [customerType]);

  const loadCustomers = async () => {
    console.log(
      '🔍 [CustomerSelector] Début loadCustomers, type:',
      customerType
    );
    try {
      setLoading(true);
      console.log('🔄 [CustomerSelector] Loading state = true');
      setError(null);

      const supabase = createClient();

      if (customerType === 'professional') {
        // Charger les organisations professionnelles (B2B)
        console.log('🏢 [CustomerSelector] Chargement organisations B2B...');
        const { data: organisations, error: orgError } = await supabase
          .from('organisations')
          .select(
            `
            id,
            legal_name,
            trade_name,
            payment_terms,
            prepayment_required,
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
          .eq('is_active', true)
          .order('legal_name');

        if (orgError) {
          console.error(
            '❌ [CustomerSelector] Erreur Supabase organisations:',
            orgError
          );
          throw orgError;
        }

        console.log(
          '✅ [CustomerSelector] Organisations chargées:',
          organisations?.length || 0
        );
        setCustomers(
          (organisations || []).map(org => ({
            ...org,
            name: org.trade_name || org.legal_name,
            type: 'professional' as const,
          })) as any
        );
      } else {
        // Charger les clients particuliers (B2C)
        console.log('👤 [CustomerSelector] Chargement clients B2C...');
        const { data: individuals, error: indError } = await supabase
          .from('individual_customers')
          .select(
            `
            id,
            first_name,
            last_name,
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

        if (indError) {
          console.error(
            '❌ [CustomerSelector] Erreur Supabase individual_customers:',
            indError
          );
          throw indError;
        }

        console.log(
          '✅ [CustomerSelector] Clients B2C chargés:',
          individuals?.length || 0
        );
        setCustomers(
          (individuals || []).map(ind => ({
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
          })) as any
        );
      }
    } catch (err) {
      console.error('❌ [CustomerSelector] Exception dans loadCustomers:', err);
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      console.log('✔️ [CustomerSelector] Fin loadCustomers, loading = false');
      setLoading(false);
    }
  };

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
    // Rafraîchir la liste
    await loadCustomers();

    // Trouver et auto-sélectionner la nouvelle organisation
    const newOrg = customers.find(c => c.id === organisationId);
    if (newOrg) {
      onCustomerChange(newOrg);
    } else {
      // Si pas encore dans la liste, créer l'objet manuellement
      const customer: UnifiedCustomer = {
        id: organisationId,
        name: organisationName,
        type: 'professional',
      };
      onCustomerChange(customer);
    }

    toast({
      title: '✅ Client créé et sélectionné',
      description: `${organisationName} a été créé et sélectionné automatiquement.`,
    });
  };

  // Handler pour la création de client particulier
  const handleIndividualCustomerCreated = async (
    customerId: string,
    customerName: string
  ) => {
    // Rafraîchir la liste
    await loadCustomers();

    // Trouver et auto-sélectionner le nouveau client
    const newCustomer = customers.find(c => c.id === customerId);
    if (newCustomer) {
      onCustomerChange(newCustomer);
    } else {
      // Si pas encore dans la liste, créer l'objet manuellement
      const customer: UnifiedCustomer = {
        id: customerId,
        name: customerName,
        type: 'individual',
      };
      onCustomerChange(customer);
    }

    toast({
      title: '✅ Client créé et sélectionné',
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
              onClick={loadCustomers}
              className="mt-1 text-red-700 underline text-xs"
              disabled={disabled}
            >
              Réessayer
            </button>
          </div>
        ) : (
          <div className="flex gap-2">
            <div className="flex-1">
              <Select
                value={selectedCustomer?.id || ''}
                onValueChange={handleCustomerChange}
                disabled={disabled || loading}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      loading
                        ? 'Chargement...'
                        : `Sélectionner ${customerType === 'professional' ? 'une organisation' : 'un client particulier'}...`
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {customerOptions.length === 0 ? (
                    <div className="p-2 text-sm text-gray-500 text-center">
                      Aucun client trouvé.
                    </div>
                  ) : (
                    customerOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Bouton création selon le type */}
            {customerType === 'professional' ? (
              <CreateOrganisationModal
                onOrganisationCreated={handleOrganisationCreated}
                defaultType="customer"
              />
            ) : (
              <CreateIndividualCustomerModal
                onCustomerCreated={handleIndividualCustomerCreated}
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

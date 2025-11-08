'use client';

import { useState, useEffect } from 'react';

import { MapPin, Copy } from 'lucide-react';

import type { UnifiedCustomer } from '@/components/business/customer-selector';
import { ButtonV2 } from '@verone/ui';
import { Label } from '@verone/ui';
import { Textarea } from '@verone/ui';
import { getOrganisationDisplayName } from '@/lib/utils/organisation-helpers';
import type { Organisation } from '@verone/organisations/hooks';

interface AddressInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  selectedOrganisation?: Organisation | null;
  selectedCustomer?: UnifiedCustomer | null;
  addressType?: 'shipping' | 'billing';
  disabled?: boolean;
  className?: string;
}

export function AddressInput({
  label,
  value,
  onChange,
  placeholder,
  selectedOrganisation,
  selectedCustomer,
  addressType = 'shipping',
  disabled = false,
  className = '',
}: AddressInputProps) {
  const [showCopyButton, setShowCopyButton] = useState(false);

  // Vérifier si une adresse est disponible
  useEffect(() => {
    if (selectedOrganisation) {
      const hasAddress = !!(
        selectedOrganisation.address_line1 ||
        selectedOrganisation.city ||
        selectedOrganisation.postal_code
      );
      setShowCopyButton(hasAddress);
    } else if (selectedCustomer) {
      const hasAddress = hasCustomerAddress();
      setShowCopyButton(hasAddress);
    } else {
      setShowCopyButton(false);
    }
  }, [selectedOrganisation, selectedCustomer, addressType]);

  // Vérifier si le client a une adresse disponible
  const hasCustomerAddress = (): boolean => {
    if (!selectedCustomer) return false;

    if (selectedCustomer.type === 'professional') {
      // Client B2B
      if (addressType === 'billing') {
        return !!(
          selectedCustomer.billing_address_line1 ||
          selectedCustomer.billing_city ||
          selectedCustomer.billing_postal_code
        );
      } else {
        // Pour la livraison, vérifier d'abord l'adresse de livraison, puis celle de facturation
        return !!(
          selectedCustomer.shipping_address_line1 ||
          selectedCustomer.shipping_city ||
          selectedCustomer.shipping_postal_code ||
          selectedCustomer.billing_address_line1 ||
          selectedCustomer.billing_city ||
          selectedCustomer.billing_postal_code
        );
      }
    } else {
      // Client B2C
      if (addressType === 'billing') {
        // Vérifier d'abord l'adresse de facturation spécifique, puis l'adresse principale
        return !!(
          selectedCustomer.billing_address_line1_individual ||
          selectedCustomer.billing_city_individual ||
          selectedCustomer.billing_postal_code_individual ||
          selectedCustomer.address_line1 ||
          selectedCustomer.city ||
          selectedCustomer.postal_code
        );
      } else {
        // Pour la livraison, utiliser l'adresse principale
        return !!(
          selectedCustomer.address_line1 ||
          selectedCustomer.city ||
          selectedCustomer.postal_code
        );
      }
    }
  };

  // Formatter l'adresse de l'organisation
  const formatOrganisationAddress = (org: Organisation): string => {
    const parts = [
      getOrganisationDisplayName(org),
      org.address_line1,
      org.address_line2,
      [org.postal_code, org.city].filter(Boolean).join(' '),
      org.region,
      org.country,
    ].filter(Boolean);

    return parts.join('\n');
  };

  // Formatter l'adresse du client
  const formatCustomerAddress = (customer: UnifiedCustomer): string => {
    if (customer.type === 'professional') {
      // Client B2B
      if (addressType === 'billing') {
        const parts = [
          customer.name,
          customer.billing_address_line1,
          customer.billing_address_line2,
          [customer.billing_postal_code, customer.billing_city]
            .filter(Boolean)
            .join(' '),
          customer.billing_region,
          customer.billing_country,
        ].filter(Boolean);
        return parts.join('\n');
      } else {
        // Livraison : utiliser adresse de livraison si disponible, sinon adresse de facturation
        const useShipping = !!(
          customer.shipping_address_line1 ||
          customer.shipping_city ||
          customer.shipping_postal_code
        );
        const parts = [
          customer.name,
          useShipping
            ? customer.shipping_address_line1
            : customer.billing_address_line1,
          useShipping
            ? customer.shipping_address_line2
            : customer.billing_address_line2,
          useShipping
            ? [customer.shipping_postal_code, customer.shipping_city]
                .filter(Boolean)
                .join(' ')
            : [customer.billing_postal_code, customer.billing_city]
                .filter(Boolean)
                .join(' '),
          useShipping ? customer.shipping_region : customer.billing_region,
          useShipping ? customer.shipping_country : customer.billing_country,
        ].filter(Boolean);
        return parts.join('\n');
      }
    } else {
      // Client B2C
      if (addressType === 'billing') {
        // Utiliser adresse de facturation spécifique si disponible, sinon adresse principale
        const useSpecificBilling = !!(
          customer.billing_address_line1_individual ||
          customer.billing_city_individual ||
          customer.billing_postal_code_individual
        );
        const parts = [
          customer.name,
          useSpecificBilling
            ? customer.billing_address_line1_individual
            : customer.address_line1,
          useSpecificBilling
            ? customer.billing_address_line2_individual
            : customer.address_line2,
          useSpecificBilling
            ? [
                customer.billing_postal_code_individual,
                customer.billing_city_individual,
              ]
                .filter(Boolean)
                .join(' ')
            : [customer.postal_code, customer.city].filter(Boolean).join(' '),
          useSpecificBilling
            ? customer.billing_region_individual
            : customer.region,
          useSpecificBilling
            ? customer.billing_country_individual
            : customer.country,
        ].filter(Boolean);
        return parts.join('\n');
      } else {
        // Livraison : utiliser adresse principale
        const parts = [
          customer.name,
          customer.address_line1,
          customer.address_line2,
          [customer.postal_code, customer.city].filter(Boolean).join(' '),
          customer.region,
          customer.country,
        ].filter(Boolean);
        return parts.join('\n');
      }
    }
  };

  // Copier l'adresse appropriée
  const copyAddress = () => {
    if (selectedOrganisation) {
      const formattedAddress = formatOrganisationAddress(selectedOrganisation);
      onChange(formattedAddress);
    } else if (selectedCustomer) {
      const formattedAddress = formatCustomerAddress(selectedCustomer);
      onChange(formattedAddress);
    }
  };

  // Obtenir le texte du bouton et l'aperçu
  const getButtonText = () => {
    if (selectedOrganisation) {
      return `Utiliser adresse ${selectedOrganisation.type === 'customer' ? 'client' : 'fournisseur'}`;
    } else if (selectedCustomer) {
      return `Utiliser adresse client`;
    }
    return 'Utiliser adresse';
  };

  const getAddressPreview = () => {
    if (selectedOrganisation) {
      return formatOrganisationAddress(selectedOrganisation);
    } else if (selectedCustomer) {
      return formatCustomerAddress(selectedCustomer);
    }
    return '';
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center justify-between">
        <Label htmlFor={label.toLowerCase().replace(/\s+/g, '-')}>
          {label}
        </Label>
        {showCopyButton && (selectedOrganisation || selectedCustomer) && (
          <ButtonV2
            type="button"
            variant="outline"
            size="sm"
            onClick={copyAddress}
            className="h-8 px-2 text-xs"
            disabled={disabled}
          >
            <Copy className="h-3 w-3 mr-1" />
            {getButtonText()}
          </ButtonV2>
        )}
      </div>

      <Textarea
        id={label.toLowerCase().replace(/\s+/g, '-')}
        placeholder={placeholder || `${label} complète...`}
        value={value}
        onChange={e => onChange(e.target.value)}
        className="min-h-[100px] resize-none"
        disabled={disabled}
      />

      {showCopyButton && (selectedOrganisation || selectedCustomer) && (
        <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded border">
          <div className="flex items-center space-x-1 mb-1">
            <MapPin className="h-3 w-3" />
            <span className="font-medium">Adresse disponible :</span>
          </div>
          <div className="whitespace-pre-line">{getAddressPreview()}</div>
        </div>
      )}
    </div>
  );
}

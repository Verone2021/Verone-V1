'use client';

import { Button, cn } from '@verone/ui';
import { Building2, MapPin } from 'lucide-react';
import { OrganisationAddressPickerModal } from '@verone/organisations/components/modals';
import { OrganisationLogo } from '@verone/organisations/components/display';
import type {
  IBillingAddressResolved,
  IBillingOrg,
} from './BillingAddressEditor';

interface IOrgPickerSectionProps {
  otherOrgs: IBillingOrg[];
  selectedOrg: IBillingOrg | undefined;
  resolvedBillingAddr: IBillingAddressResolved | null;
  selectedOrgId: string;
  loadingOrgs: boolean;
  disabled: boolean;
  pickerOpen: boolean;
  setPickerOpen: (v: boolean) => void;
  onSelect: (org: { id: string }) => void;
}

export function BillingOrgPickerSection({
  otherOrgs,
  selectedOrg,
  resolvedBillingAddr,
  selectedOrgId,
  loadingOrgs,
  disabled,
  pickerOpen,
  setPickerOpen,
  onSelect,
}: IOrgPickerSectionProps): React.ReactNode {
  return (
    <div className="space-y-2">
      {selectedOrg ? (
        <div
          className={cn(
            'flex items-center gap-3 p-3 border rounded-lg bg-blue-50 border-blue-200'
          )}
        >
          <OrganisationLogo
            logoUrl={null}
            organisationName={selectedOrg.name}
            size="sm"
            fallback="initials"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-medium text-sm text-gray-900 truncate">
                {selectedOrg.name}
              </span>
            </div>
            {resolvedBillingAddr && (
              <div className="flex items-start gap-1 text-xs text-muted-foreground mt-0.5">
                <MapPin className="h-3 w-3 mt-0.5 flex-shrink-0" />
                <span>
                  {resolvedBillingAddr.address_line1},{' '}
                  {[resolvedBillingAddr.postal_code, resolvedBillingAddr.city]
                    .filter(Boolean)
                    .join(' ')}
                </span>
              </div>
            )}
            {selectedOrgId && !resolvedBillingAddr && !loadingOrgs && (
              <p className="text-xs text-amber-600 mt-0.5">
                Adresse non renseignee
              </p>
            )}
          </div>
          <Button
            variant="outline"
            size="sm"
            className="text-xs flex-shrink-0"
            disabled={disabled}
            onClick={() => setPickerOpen(true)}
          >
            Changer
          </Button>
        </div>
      ) : (
        <button
          type="button"
          disabled={disabled || loadingOrgs}
          onClick={() => setPickerOpen(true)}
          className={cn(
            'w-full flex items-center gap-3 px-4 py-3 border border-dashed rounded-lg text-left transition-colors',
            'hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
            'border-gray-300 text-gray-500',
            (disabled || loadingOrgs) && 'opacity-50 cursor-not-allowed'
          )}
        >
          <Building2 className="h-5 w-5 text-gray-400 flex-shrink-0" />
          <span className="text-sm">Selectionner une organisation...</span>
        </button>
      )}

      <OrganisationAddressPickerModal
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        organisations={otherOrgs.map(o => ({
          id: o.id,
          legal_name: o.legal_name,
          trade_name: o.trade_name,
          address_line1: o.billing_address_line1 ?? o.address_line1,
          city: o.billing_city ?? o.city,
          postal_code: o.billing_postal_code ?? o.postal_code,
          shipping_address_line1: null,
          logo_url: o.logo_url,
          ownership_type: o.ownership_type,
        }))}
        selectedId={selectedOrgId || null}
        onSelect={onSelect}
        title="Selectionner une adresse de facturation"
        description="Choisissez parmi les organisations du groupe"
        emptyMessage="Aucune organisation trouvee dans cette enseigne"
        showOwnershipFilter
        showMapView={false}
        hideTrigger
      />
    </div>
  );
}

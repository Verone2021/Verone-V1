'use client';

import { useCallback, useEffect, useState } from 'react';

import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@verone/ui';
import { AddressAutocomplete } from '@verone/ui';
import type { AddressResult } from '@verone/ui';
import { createClient } from '@verone/utils/supabase/client';
import { Checkbox } from '@verone/ui';
import { MapPin, Truck } from 'lucide-react';

interface IShippingOrg {
  id: string;
  name: string;
  address_line1: string | null;
  postal_code: string | null;
  city: string | null;
  country: string | null;
  shipping_address_line1: string | null;
  shipping_postal_code: string | null;
  shipping_city: string | null;
  has_different_shipping_address: boolean | null;
}

export interface IShippingAddressResolved {
  address_line1: string;
  postal_code: string;
  city: string;
  country: string;
  saveToOrg?: boolean;
}

type ShippingMode = 'same' | 'other_org' | 'new';

interface QuoteShippingSectionProps {
  enseigneId: string | null | undefined;
  defaultOrgId: string | null | undefined;
  /** Trade name of the default organisation, used in save checkbox label */
  orgName?: string | null;
  disabled?: boolean;
  onShippingAddressChange: (addr: IShippingAddressResolved | null) => void;
}

function resolveOrgAddress(org: IShippingOrg): IShippingAddressResolved | null {
  const useShipping = org.has_different_shipping_address;
  const line1 = useShipping
    ? (org.shipping_address_line1 ?? org.address_line1)
    : org.address_line1;
  const postal = useShipping
    ? (org.shipping_postal_code ?? org.postal_code)
    : org.postal_code;
  const city = useShipping ? (org.shipping_city ?? org.city) : org.city;
  if (!line1 || !city) return null;
  return {
    address_line1: line1,
    postal_code: postal ?? '',
    city,
    country: org.country ?? 'FR',
  };
}

export function QuoteShippingSection({
  enseigneId,
  defaultOrgId,
  orgName,
  disabled = false,
  onShippingAddressChange,
}: QuoteShippingSectionProps): React.ReactNode {
  const [mode, setMode] = useState<ShippingMode>('same');
  const [orgs, setOrgs] = useState<IShippingOrg[]>([]);
  const [selectedOrgId, setSelectedOrgId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [newAddressInput, setNewAddressInput] = useState('');
  const [newAddressResolved, setNewAddressResolved] =
    useState<IShippingAddressResolved | null>(null);
  const [saveToOrg, setSaveToOrg] = useState(false);

  // Load enseigne orgs for "other_org" mode
  useEffect(() => {
    if (!enseigneId) return;
    setLoading(true);
    const supabase = createClient();
    const fetchOrgs = async () => {
      try {
        const { data } = await supabase
          .from('organisations')
          .select(
            'id, trade_name, legal_name, address_line1, postal_code, city, country, shipping_address_line1, shipping_postal_code, shipping_city, has_different_shipping_address'
          )
          .eq('enseigne_id', enseigneId)
          .limit(20);
        if (data) {
          setOrgs(
            data.map(o => ({
              id: o.id,
              name: o.trade_name ?? o.legal_name,
              address_line1: o.address_line1,
              postal_code: o.postal_code,
              city: o.city,
              country: o.country,
              shipping_address_line1: o.shipping_address_line1,
              shipping_postal_code: o.shipping_postal_code,
              shipping_city: o.shipping_city,
              has_different_shipping_address: o.has_different_shipping_address,
            }))
          );
        }
      } catch (err) {
        console.error('[QuoteShippingSection] Failed to load orgs:', err);
      } finally {
        setLoading(false);
      }
    };
    void fetchOrgs();
  }, [enseigneId]);

  // Notify parent when mode/selection changes
  const notify = useCallback(
    (addr: IShippingAddressResolved | null) => {
      onShippingAddressChange(addr);
    },
    [onShippingAddressChange]
  );

  const handleModeChange = (newMode: ShippingMode) => {
    setMode(newMode);
    setSelectedOrgId('');
    setNewAddressInput('');
    setNewAddressResolved(null);
    setSaveToOrg(false);

    if (newMode === 'same') {
      notify(null);
    }
  };

  const handleOrgSelect = (orgId: string) => {
    setSelectedOrgId(orgId);
    const org = orgs.find(o => o.id === orgId);
    if (!org) {
      notify(null);
      return;
    }
    const addr = resolveOrgAddress(org);
    notify(addr);
  };

  const handleAddressSelect = (result: AddressResult) => {
    const resolved: IShippingAddressResolved = {
      address_line1: result.streetAddress,
      postal_code: result.postalCode,
      city: result.city,
      country: result.countryCode ?? 'FR',
      saveToOrg: false,
    };
    setNewAddressResolved(resolved);
    setSaveToOrg(false);
    notify({ ...resolved, saveToOrg: false });
  };

  const handleSaveToOrgChange = (checked: boolean) => {
    setSaveToOrg(checked);
    if (newAddressResolved) {
      notify({ ...newAddressResolved, saveToOrg: checked });
    }
  };

  const otherOrgs = orgs.filter(o => o.id !== defaultOrgId);
  const selectedOrg = orgs.find(o => o.id === selectedOrgId);
  const resolvedOtherAddr = selectedOrg ? resolveOrgAddress(selectedOrg) : null;
  const displayOrgName = orgName ?? 'cette organisation';

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Truck className="h-4 w-4" />
          Adresse de livraison
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Mode selector */}
        <Select
          value={mode}
          onValueChange={v => handleModeChange(v as ShippingMode)}
          disabled={disabled}
        >
          <SelectTrigger className="h-8 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="same">
              Même adresse que la facturation
            </SelectItem>
            {enseigneId && otherOrgs.length > 0 && (
              <SelectItem value="other_org">
                Autre adresse enregistrée
              </SelectItem>
            )}
            <SelectItem value="new">Nouvelle adresse</SelectItem>
          </SelectContent>
        </Select>

        {/* Other org sub-selector */}
        {mode === 'other_org' && (
          <div className="space-y-2">
            <Select
              value={selectedOrgId}
              onValueChange={handleOrgSelect}
              disabled={disabled || loading}
            >
              <SelectTrigger className="h-8 text-sm">
                <SelectValue placeholder="Choisir une organisation..." />
              </SelectTrigger>
              <SelectContent>
                {otherOrgs.map(o => (
                  <SelectItem key={o.id} value={o.id}>
                    {o.name}
                    {o.city ? ` — ${o.city}` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {resolvedOtherAddr && (
              <div className="flex items-start gap-2 text-xs text-muted-foreground">
                <MapPin className="h-3 w-3 mt-0.5 flex-shrink-0" />
                <div>
                  <p>{resolvedOtherAddr.address_line1}</p>
                  <p>
                    {[resolvedOtherAddr.postal_code, resolvedOtherAddr.city]
                      .filter(Boolean)
                      .join(' ')}
                  </p>
                </div>
              </div>
            )}

            {selectedOrgId && !resolvedOtherAddr && !loading && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 text-xs text-muted-foreground"
                onClick={() => {
                  setSelectedOrgId('');
                  notify(null);
                }}
              >
                Organisation sans adresse — revenir à la facturation
              </Button>
            )}
          </div>
        )}

        {/* New address with autocomplete */}
        {mode === 'new' && (
          <div className="space-y-3">
            <AddressAutocomplete
              value={newAddressInput}
              onChange={setNewAddressInput}
              onSelect={handleAddressSelect}
              placeholder="Rechercher une adresse..."
              disabled={disabled}
              id="quote-shipping-address"
            />

            {newAddressResolved && (
              <div className="flex items-start gap-2 text-xs text-muted-foreground">
                <MapPin className="h-3 w-3 mt-0.5 flex-shrink-0 text-green-500" />
                <div>
                  <p>{newAddressResolved.address_line1}</p>
                  <p>
                    {[newAddressResolved.postal_code, newAddressResolved.city]
                      .filter(Boolean)
                      .join(' ')}
                  </p>
                </div>
              </div>
            )}

            <div className="flex items-center gap-2 pt-1">
              <Checkbox
                id="save-shipping-to-org"
                checked={saveToOrg}
                onCheckedChange={checked =>
                  handleSaveToOrgChange(checked === true)
                }
                disabled={disabled || !newAddressResolved}
              />
              <label
                htmlFor="save-shipping-to-org"
                className="text-xs text-muted-foreground cursor-pointer leading-snug"
              >
                Sauvegarder cette adresse comme adresse de livraison de{' '}
                <span className="font-medium">{displayOrgName}</span> pour les
                prochains devis
              </label>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

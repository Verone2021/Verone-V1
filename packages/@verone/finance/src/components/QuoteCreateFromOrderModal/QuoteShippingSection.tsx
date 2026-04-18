'use client';

import { useEffect, useState } from 'react';

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
import { createClient } from '@verone/utils/supabase/client';
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
}

interface QuoteShippingSectionProps {
  enseigneId: string | null | undefined;
  defaultOrgId: string | null | undefined;
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
  disabled = false,
  onShippingAddressChange,
}: QuoteShippingSectionProps): React.ReactNode {
  const [orgs, setOrgs] = useState<IShippingOrg[]>([]);
  const [selectedOrgId, setSelectedOrgId] = useState<string>('__same__');
  const [loading, setLoading] = useState(false);

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

  const handleOrgSelect = (orgId: string) => {
    setSelectedOrgId(orgId);
    if (orgId === '__same__') {
      onShippingAddressChange(null);
      return;
    }
    const org = orgs.find(o => o.id === orgId);
    if (!org) return;
    const addr = resolveOrgAddress(org);
    onShippingAddressChange(addr);
  };

  // If no enseigne_id, no other orgs to pick from
  if (!enseigneId) return null;

  const selectedOrg =
    selectedOrgId !== '__same__'
      ? orgs.find(o => o.id === selectedOrgId)
      : null;
  const resolvedAddr = selectedOrg ? resolveOrgAddress(selectedOrg) : null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Truck className="h-4 w-4" />
          Adresse de livraison
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Select
          value={selectedOrgId}
          onValueChange={handleOrgSelect}
          disabled={disabled || loading}
        >
          <SelectTrigger className="h-8 text-sm">
            <SelectValue placeholder="Sélectionner une organisation..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__same__">
              Même adresse que la facturation
            </SelectItem>
            {orgs
              .filter(o => o.id !== defaultOrgId)
              .map(o => (
                <SelectItem key={o.id} value={o.id}>
                  {o.name}
                  {o.city ? ` — ${o.city}` : ''}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>

        {resolvedAddr && (
          <div className="flex items-start gap-2 text-xs text-muted-foreground">
            <MapPin className="h-3 w-3 mt-0.5 flex-shrink-0" />
            <div>
              <p>{resolvedAddr.address_line1}</p>
              <p>
                {[resolvedAddr.postal_code, resolvedAddr.city]
                  .filter(Boolean)
                  .join(' ')}
              </p>
            </div>
          </div>
        )}

        {selectedOrgId !== '__same__' && !resolvedAddr && !loading && (
          <Button
            variant="ghost"
            size="sm"
            className="h-6 text-xs text-muted-foreground"
            onClick={() => {
              setSelectedOrgId('__same__');
              onShippingAddressChange(null);
            }}
          >
            Organisation sans adresse — revenir à la facturation
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

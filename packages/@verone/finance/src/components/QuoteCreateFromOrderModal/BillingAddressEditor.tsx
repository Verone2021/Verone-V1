'use client';

import { useState, useEffect } from 'react';

import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Checkbox,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  AddressAutocomplete,
} from '@verone/ui';
import type { AddressResult } from '@verone/ui';
import { createClient } from '@verone/utils/supabase/client';
import { Building, MapPin } from 'lucide-react';

export interface IBillingAddressResolved {
  address_line1: string;
  postal_code: string;
  city: string;
  country: string;
}

interface IBillingOrg {
  id: string;
  name: string;
  billing_address_line1: string | null;
  billing_postal_code: string | null;
  billing_city: string | null;
  billing_country: string | null;
  address_line1: string | null;
  postal_code: string | null;
  city: string | null;
  country: string | null;
}

interface IBillingAddressEditorProps {
  /** ID de l'enseigne pour charger les orgs du groupe */
  enseigneId: string | null | undefined;
  /** ID de l'org par defaut (commande courante) */
  defaultOrgId: string | null | undefined;
  /** Adresse de facturation initiale (depuis la commande/org) */
  initialBillingAddress: IBillingAddressResolved | null;
  /** Nom de l'org pour le label de la checkbox */
  orgName?: string;
  disabled?: boolean;
  /** Callback quand l'adresse change (null = adresse initiale) */
  onBillingAddressChange: (addr: IBillingAddressResolved | null) => void;
  /** Callback quand la checkbox "sauvegarder" change */
  onUpdateOrgBillingChange: (save: boolean) => void;
}

type AddressMode = 'current' | 'other-org' | 'new';

function resolveOrgBillingAddress(
  org: IBillingOrg
): IBillingAddressResolved | null {
  const line1 = org.billing_address_line1 ?? org.address_line1;
  const postal = org.billing_postal_code ?? org.postal_code;
  const city = org.billing_city ?? org.city;
  if (!line1 || !city) return null;
  return {
    address_line1: line1,
    postal_code: postal ?? '',
    city,
    country: org.billing_country ?? org.country ?? 'FR',
  };
}

export function BillingAddressEditor({
  enseigneId,
  defaultOrgId,
  initialBillingAddress,
  orgName,
  disabled = false,
  onBillingAddressChange,
  onUpdateOrgBillingChange,
}: IBillingAddressEditorProps): React.ReactNode {
  const [isEditing, setIsEditing] = useState(false);
  const [mode, setMode] = useState<AddressMode>('current');
  const [orgs, setOrgs] = useState<IBillingOrg[]>([]);
  const [selectedOrgId, setSelectedOrgId] = useState<string>('');
  const [newAddress, setNewAddress] = useState<IBillingAddressResolved | null>(
    null
  );
  const [newAddressInput, setNewAddressInput] = useState('');
  const [saveToOrg, setSaveToOrg] = useState(false);
  const [loadingOrgs, setLoadingOrgs] = useState(false);

  useEffect(() => {
    if (!enseigneId || !isEditing) return;
    setLoadingOrgs(true);
    const supabase = createClient();
    const fetchOrgs = async () => {
      try {
        const { data } = await supabase
          .from('organisations')
          .select(
            'id, trade_name, legal_name, billing_address_line1, billing_postal_code, billing_city, billing_country, address_line1, postal_code, city, country'
          )
          .eq('enseigne_id', enseigneId)
          .limit(20);
        if (data) {
          setOrgs(
            data.map(o => ({
              id: o.id,
              name: o.trade_name ?? o.legal_name ?? '',
              billing_address_line1: o.billing_address_line1,
              billing_postal_code: o.billing_postal_code,
              billing_city: o.billing_city,
              billing_country: o.billing_country,
              address_line1: o.address_line1,
              postal_code: o.postal_code,
              city: o.city,
              country: o.country,
            }))
          );
        }
      } catch (err) {
        console.error('[BillingAddressEditor] Failed to load orgs:', err);
      } finally {
        setLoadingOrgs(false);
      }
    };
    void fetchOrgs();
  }, [enseigneId, isEditing]);

  const handleModeChange = (newMode: AddressMode) => {
    setMode(newMode);
    setSaveToOrg(false);
    onUpdateOrgBillingChange(false);

    if (newMode === 'current') {
      onBillingAddressChange(null);
    } else if (newMode === 'other-org') {
      setSelectedOrgId('');
      onBillingAddressChange(null);
    } else if (newMode === 'new') {
      setNewAddress(null);
      setNewAddressInput('');
      onBillingAddressChange(null);
    }
  };

  const handleOrgSelect = (orgId: string) => {
    setSelectedOrgId(orgId);
    const org = orgs.find(o => o.id === orgId);
    if (!org) return;
    const addr = resolveOrgBillingAddress(org);
    onBillingAddressChange(addr);
  };

  const handleAddressSelect = (result: AddressResult) => {
    const addr: IBillingAddressResolved = {
      address_line1: result.streetAddress,
      postal_code: result.postalCode,
      city: result.city,
      country: result.countryCode,
    };
    setNewAddress(addr);
    onBillingAddressChange(addr);
  };

  const handleSaveToggle = (checked: boolean) => {
    setSaveToOrg(checked);
    onUpdateOrgBillingChange(checked);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setMode('current');
    setSaveToOrg(false);
    setNewAddress(null);
    setNewAddressInput('');
    setSelectedOrgId('');
    onBillingAddressChange(null);
    onUpdateOrgBillingChange(false);
  };

  const displayAddr = initialBillingAddress;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Building className="h-4 w-4" />
          Adresse de facturation
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {!isEditing ? (
          <div className="space-y-2">
            {displayAddr ? (
              <div className="flex items-start gap-2 text-xs text-muted-foreground">
                <MapPin className="h-3 w-3 mt-0.5 flex-shrink-0" />
                <div>
                  {displayAddr.address_line1 && (
                    <p>{displayAddr.address_line1}</p>
                  )}
                  <p>
                    {[displayAddr.postal_code, displayAddr.city]
                      .filter(Boolean)
                      .join(' ')}
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground italic">
                Aucune adresse de facturation enregistree
              </p>
            )}
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              disabled={disabled}
              onClick={() => setIsEditing(true)}
            >
              Modifier
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <Select
              value={mode}
              onValueChange={(v: string) => handleModeChange(v as AddressMode)}
              disabled={disabled}
            >
              <SelectTrigger className="h-8 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="current">
                  Adresse actuelle de facturation
                </SelectItem>
                {enseigneId && (
                  <SelectItem value="other-org">
                    Autre adresse enregistree (groupe)
                  </SelectItem>
                )}
                <SelectItem value="new">Nouvelle adresse</SelectItem>
              </SelectContent>
            </Select>

            {mode === 'current' && displayAddr && (
              <div className="flex items-start gap-2 text-xs text-muted-foreground">
                <MapPin className="h-3 w-3 mt-0.5 flex-shrink-0" />
                <div>
                  {displayAddr.address_line1 && (
                    <p>{displayAddr.address_line1}</p>
                  )}
                  <p>
                    {[displayAddr.postal_code, displayAddr.city]
                      .filter(Boolean)
                      .join(' ')}
                  </p>
                </div>
              </div>
            )}

            {mode === 'other-org' && (
              <div className="space-y-2">
                <Select
                  value={selectedOrgId}
                  onValueChange={handleOrgSelect}
                  disabled={disabled || loadingOrgs}
                >
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue placeholder="Choisir une organisation..." />
                  </SelectTrigger>
                  <SelectContent>
                    {orgs
                      .filter(o => o.id !== defaultOrgId)
                      .map(o => (
                        <SelectItem key={o.id} value={o.id}>
                          {o.name}
                          {(o.billing_city ?? o.city)
                            ? ` — ${o.billing_city ?? o.city}`
                            : ''}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                {selectedOrgId &&
                  (() => {
                    const org = orgs.find(o => o.id === selectedOrgId);
                    const addr = org ? resolveOrgBillingAddress(org) : null;
                    return addr ? (
                      <div className="flex items-start gap-2 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3 mt-0.5 flex-shrink-0" />
                        <div>
                          <p>{addr.address_line1}</p>
                          <p>
                            {[addr.postal_code, addr.city]
                              .filter(Boolean)
                              .join(' ')}
                          </p>
                        </div>
                      </div>
                    ) : null;
                  })()}
              </div>
            )}

            {mode === 'new' && (
              <div className="space-y-2">
                <AddressAutocomplete
                  value={newAddressInput}
                  onChange={setNewAddressInput}
                  onSelect={handleAddressSelect}
                  placeholder="Rechercher une adresse..."
                  disabled={disabled}
                  id="billing-address-new"
                />
                {newAddress && (
                  <div className="flex items-start gap-2 text-xs text-green-700">
                    <MapPin className="h-3 w-3 mt-0.5 flex-shrink-0" />
                    <div>
                      <p>{newAddress.address_line1}</p>
                      <p>
                        {[newAddress.postal_code, newAddress.city]
                          .filter(Boolean)
                          .join(' ')}
                      </p>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-2 pt-1">
                  <Checkbox
                    id="save-billing-to-org"
                    checked={saveToOrg}
                    onCheckedChange={(checked: boolean) =>
                      handleSaveToggle(checked)
                    }
                    disabled={disabled || !newAddress}
                  />
                  <Label
                    htmlFor="save-billing-to-org"
                    className="text-xs cursor-pointer"
                  >
                    Sauvegarder comme adresse de facturation
                    {orgName ? ` de ${orgName}` : ''} pour les prochaines
                    commandes
                  </Label>
                </div>
              </div>
            )}

            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 text-xs text-muted-foreground"
              onClick={handleCancelEdit}
            >
              Annuler
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

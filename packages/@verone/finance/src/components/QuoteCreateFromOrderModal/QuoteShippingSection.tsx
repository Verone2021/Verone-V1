'use client';

import { useCallback, useEffect, useState } from 'react';

import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Checkbox,
  Label,
  cn,
} from '@verone/ui';
import { AddressAutocomplete } from '@verone/ui';
import type { AddressResult } from '@verone/ui';
import { createClient } from '@verone/utils/supabase/client';
import { MapPin, Truck, Building2, Plus } from 'lucide-react';
import { OrganisationAddressPickerModal } from '@verone/organisations/components/modals';
import { OrganisationLogo } from '@verone/organisations/components/display';
import type { IOrderForDocument } from '../order-select/types';

interface IShippingOrg {
  id: string;
  /** Résolu : trade_name ?? legal_name — pour affichage local */
  name: string;
  trade_name: string | null;
  legal_name: string;
  address_line1: string | null;
  postal_code: string | null;
  city: string | null;
  country: string | null;
  shipping_address_line1: string | null;
  shipping_postal_code: string | null;
  shipping_city: string | null;
  has_different_shipping_address: boolean | null;
  logo_url: string | null;
  ownership_type: string | null;
}

export interface IShippingAddressResolved {
  address_line1: string;
  postal_code: string;
  city: string;
  country: string;
}

type ShippingMode = 'org_default' | 'other_org' | 'new';

interface QuoteShippingSectionProps {
  order: IOrderForDocument;
  disabled?: boolean;
  onShippingAddressChange: (addr: IShippingAddressResolved | null) => void;
  /** Callback pour sauvegarder l'adresse de livraison sur l'org commande */
  onSaveToOrg?: (save: boolean) => void;
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

/** Résout l'adresse de livraison de l'org commande pour affichage initial */
function resolveOrderOrgShippingAddress(
  org: IOrderForDocument['organisations']
): IShippingAddressResolved | null {
  if (!org) return null;
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
  order,
  disabled = false,
  onShippingAddressChange,
  onSaveToOrg,
}: QuoteShippingSectionProps): React.ReactNode {
  const org = order.organisations;
  const enseigneId = org?.enseigne_id;
  const hasDifferentShipping = org?.has_different_shipping_address === true;
  const defaultShippingAddr = resolveOrderOrgShippingAddress(org);

  // Section visible si org a une adresse de livraison distincte OU si user l'active
  const [sectionVisible, setSectionVisible] = useState(hasDifferentShipping);
  // Mode d'édition : affiché uniquement si user clique "Modifier"
  const [isEditing, setIsEditing] = useState(false);
  const [mode, setMode] = useState<ShippingMode>('org_default');
  const [orgs, setOrgs] = useState<IShippingOrg[]>([]);
  const [selectedOrgId, setSelectedOrgId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [newAddressInput, setNewAddressInput] = useState('');
  const [newAddressResolved, setNewAddressResolved] =
    useState<IShippingAddressResolved | null>(null);
  const [saveToOrg, setSaveToOrg] = useState(false);

  // Charger les orgs de l'enseigne pour le picker
  useEffect(() => {
    if (!enseigneId || !isEditing) return;
    setLoading(true);
    const supabase = createClient();
    const fetchOrgs = async () => {
      try {
        const { data } = await supabase
          .from('organisations')
          .select(
            'id, trade_name, legal_name, address_line1, postal_code, city, country, shipping_address_line1, shipping_postal_code, shipping_city, has_different_shipping_address, logo_url, ownership_type'
          )
          .eq('enseigne_id', enseigneId);
        if (data) {
          setOrgs(
            data.map(o => ({
              id: o.id,
              name: o.trade_name ?? o.legal_name,
              trade_name: o.trade_name,
              legal_name: o.legal_name,
              address_line1: o.address_line1,
              postal_code: o.postal_code,
              city: o.city,
              country: o.country,
              shipping_address_line1: o.shipping_address_line1,
              shipping_postal_code: o.shipping_postal_code,
              shipping_city: o.shipping_city,
              has_different_shipping_address: o.has_different_shipping_address,
              logo_url: o.logo_url,
              ownership_type: o.ownership_type,
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
  }, [enseigneId, isEditing]);

  const notify = useCallback(
    (addr: IShippingAddressResolved | null) => {
      onShippingAddressChange(addr);
    },
    [onShippingAddressChange]
  );

  const handleOrgPickerSelect = useCallback(
    (pickedOrg: { id: string }) => {
      setSelectedOrgId(pickedOrg.id);
      const found = orgs.find(o => o.id === pickedOrg.id);
      if (!found) {
        notify(null);
        return;
      }
      notify(resolveOrgAddress(found));
    },
    [orgs, notify]
  );

  const handleAddressSelect = (result: AddressResult) => {
    const resolved: IShippingAddressResolved = {
      address_line1: result.streetAddress,
      postal_code: result.postalCode,
      city: result.city,
      country: result.countryCode ?? 'FR',
    };
    setNewAddressResolved(resolved);
    notify(resolved);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setMode('org_default');
    setSelectedOrgId('');
    setNewAddressInput('');
    setNewAddressResolved(null);
    setSaveToOrg(false);
    onSaveToOrg?.(false);
    // Revenir à l'adresse par défaut si la section était active
    if (hasDifferentShipping && defaultShippingAddr) {
      notify(defaultShippingAddr);
    } else {
      notify(null);
    }
  };

  const handleActivateSection = () => {
    setSectionVisible(true);
    // Si l'org a déjà une adresse de livraison distincte, la notifier immédiatement
    if (hasDifferentShipping && defaultShippingAddr) {
      notify(defaultShippingAddr);
    }
  };

  const handleSaveToOrgToggle = (checked: boolean) => {
    setSaveToOrg(checked);
    onSaveToOrg?.(checked);
  };

  const selectedOrg = orgs.find(o => o.id === selectedOrgId);
  const resolvedOtherAddr = selectedOrg ? resolveOrgAddress(selectedOrg) : null;

  // Cas : section non activée
  if (!sectionVisible) {
    return (
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="w-full h-9 text-xs text-muted-foreground border-dashed"
        disabled={disabled}
        onClick={handleActivateSection}
      >
        <Plus className="h-3 w-3 mr-1" />
        Ajouter une adresse de livraison différente
      </Button>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Truck className="h-4 w-4" />
          Adresse de livraison
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {!isEditing ? (
          <div className="space-y-2">
            {/* Affichage de l'adresse par défaut de l'org */}
            {defaultShippingAddr ? (
              <div className="flex items-start gap-2 text-xs text-muted-foreground">
                <MapPin className="h-3 w-3 mt-0.5 flex-shrink-0" />
                <div>
                  {defaultShippingAddr.address_line1 && (
                    <p>{defaultShippingAddr.address_line1}</p>
                  )}
                  <p>
                    {[defaultShippingAddr.postal_code, defaultShippingAddr.city]
                      .filter(Boolean)
                      .join(' ')}
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground italic">
                Aucune adresse de livraison enregistrée
              </p>
            )}
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7 text-xs"
                disabled={disabled}
                onClick={() => {
                  setIsEditing(true);
                  if (hasDifferentShipping && defaultShippingAddr) {
                    notify(defaultShippingAddr);
                  }
                }}
              >
                Modifier
              </Button>
              {!hasDifferentShipping && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs text-muted-foreground"
                  disabled={disabled}
                  onClick={() => {
                    setSectionVisible(false);
                    notify(null);
                  }}
                >
                  Retirer
                </Button>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Choix : adresse org par défaut, autre org du groupe, nouvelle adresse */}
            <div className="flex flex-col gap-2 sm:flex-row">
              {defaultShippingAddr && (
                <Button
                  type="button"
                  variant={mode === 'org_default' ? 'default' : 'outline'}
                  size="sm"
                  className="h-7 text-xs flex-1"
                  disabled={disabled}
                  onClick={() => {
                    setMode('org_default');
                    setSelectedOrgId('');
                    setNewAddressInput('');
                    setNewAddressResolved(null);
                    notify(defaultShippingAddr);
                  }}
                >
                  Adresse de l&apos;org
                </Button>
              )}
              {enseigneId && (
                <Button
                  type="button"
                  variant={mode === 'other_org' ? 'default' : 'outline'}
                  size="sm"
                  className="h-7 text-xs flex-1"
                  disabled={disabled}
                  onClick={() => {
                    setMode('other_org');
                    notify(null);
                  }}
                >
                  Autre org du groupe
                </Button>
              )}
              <Button
                type="button"
                variant={mode === 'new' ? 'default' : 'outline'}
                size="sm"
                className="h-7 text-xs flex-1"
                disabled={disabled}
                onClick={() => {
                  setMode('new');
                  setSelectedOrgId('');
                  setNewAddressInput('');
                  setNewAddressResolved(null);
                  notify(null);
                }}
              >
                Nouvelle adresse
              </Button>
            </div>

            {/* Mode : adresse org par défaut */}
            {mode === 'org_default' && defaultShippingAddr && (
              <div className="flex items-start gap-2 text-xs text-muted-foreground">
                <MapPin className="h-3 w-3 mt-0.5 flex-shrink-0" />
                <div>
                  {defaultShippingAddr.address_line1 && (
                    <p>{defaultShippingAddr.address_line1}</p>
                  )}
                  <p>
                    {[defaultShippingAddr.postal_code, defaultShippingAddr.city]
                      .filter(Boolean)
                      .join(' ')}
                  </p>
                </div>
              </div>
            )}

            {/* Mode : autre org du groupe */}
            {mode === 'other_org' && (
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
                      <span className="font-medium text-sm text-gray-900 truncate block">
                        {selectedOrg.name}
                      </span>
                      {resolvedOtherAddr ? (
                        <div className="flex items-start gap-1 text-xs text-muted-foreground mt-0.5">
                          <MapPin className="h-3 w-3 mt-0.5 flex-shrink-0" />
                          <span>
                            {resolvedOtherAddr.address_line1},{' '}
                            {[
                              resolvedOtherAddr.postal_code,
                              resolvedOtherAddr.city,
                            ]
                              .filter(Boolean)
                              .join(' ')}
                          </span>
                        </div>
                      ) : (
                        !loading && (
                          <p className="text-xs text-amber-600 mt-0.5">
                            Adresse non renseignée
                          </p>
                        )
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
                    disabled={disabled || loading}
                    onClick={() => setPickerOpen(true)}
                    className={cn(
                      'w-full flex items-center gap-3 px-4 py-3 border border-dashed rounded-lg text-left transition-colors',
                      'hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
                      'border-gray-300 text-gray-500',
                      (disabled || loading) && 'opacity-50 cursor-not-allowed'
                    )}
                  >
                    <Building2 className="h-5 w-5 text-gray-400 flex-shrink-0" />
                    <span className="text-sm">
                      Sélectionner une organisation...
                    </span>
                  </button>
                )}

                <OrganisationAddressPickerModal
                  open={pickerOpen}
                  onOpenChange={setPickerOpen}
                  organisations={orgs.map(o => ({
                    id: o.id,
                    legal_name: o.legal_name,
                    trade_name: o.trade_name,
                    address_line1: o.address_line1,
                    city: o.city,
                    postal_code: o.postal_code,
                    shipping_address_line1: o.shipping_address_line1,
                    logo_url: o.logo_url,
                    ownership_type: o.ownership_type,
                  }))}
                  selectedId={selectedOrgId || null}
                  onSelect={handleOrgPickerSelect}
                  title="Sélectionner une adresse de livraison"
                  description={
                    orgs.length > 0
                      ? `${orgs.length.toString()} organisation${orgs.length > 1 ? 's' : ''} disponible${orgs.length > 1 ? 's' : ''}`
                      : undefined
                  }
                  emptyMessage="Aucune organisation trouvée dans cette enseigne"
                  showOwnershipFilter
                  showMapView={false}
                  hideTrigger
                />
              </div>
            )}

            {/* Mode : nouvelle adresse */}
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
                        {[
                          newAddressResolved.postal_code,
                          newAddressResolved.city,
                        ]
                          .filter(Boolean)
                          .join(' ')}
                      </p>
                    </div>
                  </div>
                )}

                {newAddressResolved && (
                  <div className="flex items-center gap-2 pt-1">
                    <Checkbox
                      id="save-shipping-to-org"
                      checked={saveToOrg}
                      onCheckedChange={(checked: boolean) =>
                        handleSaveToOrgToggle(checked)
                      }
                      disabled={disabled}
                    />
                    <Label
                      htmlFor="save-shipping-to-org"
                      className="text-xs cursor-pointer"
                    >
                      Sauvegarder comme adresse de livraison de
                      l&apos;organisation (mise à jour fiche)
                    </Label>
                  </div>
                )}
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

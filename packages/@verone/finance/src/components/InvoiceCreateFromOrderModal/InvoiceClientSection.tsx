'use client';

import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Checkbox,
  Input,
  Label,
} from '@verone/ui';
import { AlertTriangle, Building2, MapPin, Pencil, Truck } from 'lucide-react';

import type { IDocumentAddress } from '../OrderSelectModal';

interface IInvoiceClientSectionProps {
  customerName: string;
  customerEmail: string | null | undefined;
  legalName: string | null | undefined;
  billingAddress: IDocumentAddress;
  setBillingAddress: (
    v: IDocumentAddress | ((prev: IDocumentAddress) => IDocumentAddress)
  ) => void;
  editingBilling: boolean;
  setEditingBilling: (v: boolean) => void;
  hasDifferentShipping: boolean;
  setHasDifferentShipping: (v: boolean) => void;
  shippingAddress: IDocumentAddress;
  setShippingAddress: (
    v: IDocumentAddress | ((prev: IDocumentAddress) => IDocumentAddress)
  ) => void;
  editingShipping: boolean;
  setEditingShipping: (v: boolean) => void;
}

export function InvoiceClientSection({
  customerName,
  customerEmail,
  legalName,
  billingAddress,
  setBillingAddress,
  editingBilling,
  setEditingBilling,
  hasDifferentShipping,
  setHasDifferentShipping,
  shippingAddress,
  setShippingAddress,
  editingShipping,
  setEditingShipping,
}: IInvoiceClientSectionProps): React.ReactNode {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Building2 className="h-4 w-4" />
          Client
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Info client */}
        <div>
          <p className="font-medium">{customerName}</p>
          {legalName && legalName !== customerName && (
            <p className="text-xs text-muted-foreground">{legalName}</p>
          )}
          {customerEmail && (
            <p className="text-sm text-muted-foreground">{customerEmail}</p>
          )}
        </div>

        {/* Adresse de facturation */}
        <div className="border rounded-lg p-3 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
              <MapPin className="h-3 w-3" />
              Adresse de facturation
            </p>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-xs"
              onClick={() => setEditingBilling(!editingBilling)}
            >
              <Pencil className="h-3 w-3 mr-1" />
              {editingBilling ? 'Fermer' : 'Modifier'}
            </Button>
          </div>

          {!editingBilling ? (
            <div className="text-sm">
              {billingAddress.address_line1 && (
                <p>{billingAddress.address_line1}</p>
              )}
              <p>
                {[billingAddress.postal_code, billingAddress.city]
                  .filter(Boolean)
                  .join(' ')}
                {billingAddress.country ? `, ${billingAddress.country}` : ''}
              </p>
              {!billingAddress.city && !billingAddress.postal_code && (
                <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 p-2 rounded mt-1">
                  <AlertTriangle className="h-3 w-3 flex-shrink-0" />
                  <span>Ville et code postal requis pour Qonto</span>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <div className="space-y-1">
                <Label className="text-xs">Adresse</Label>
                <Input
                  value={billingAddress.address_line1}
                  onChange={e =>
                    setBillingAddress(prev => ({
                      ...prev,
                      address_line1: e.target.value,
                    }))
                  }
                  placeholder="Rue, numero..."
                  className="h-8"
                />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Code postal *</Label>
                  <Input
                    value={billingAddress.postal_code}
                    onChange={e =>
                      setBillingAddress(prev => ({
                        ...prev,
                        postal_code: e.target.value,
                      }))
                    }
                    placeholder="75001"
                    className="h-8"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Ville *</Label>
                  <Input
                    value={billingAddress.city}
                    onChange={e =>
                      setBillingAddress(prev => ({
                        ...prev,
                        city: e.target.value,
                      }))
                    }
                    placeholder="Paris"
                    className="h-8"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Pays</Label>
                  <Input
                    value={billingAddress.country}
                    onChange={e =>
                      setBillingAddress(prev => ({
                        ...prev,
                        country: e.target.value,
                      }))
                    }
                    placeholder="FR"
                    className="h-8"
                  />
                </div>
              </div>
              {!billingAddress.city && !billingAddress.postal_code && (
                <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 p-2 rounded">
                  <AlertTriangle className="h-3 w-3 flex-shrink-0" />
                  <span>Ville et code postal requis pour Qonto</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Adresse de livraison differente */}
        <div className="flex items-center gap-2">
          <Checkbox
            id="different-shipping"
            checked={hasDifferentShipping}
            onCheckedChange={checked =>
              setHasDifferentShipping(checked === true)
            }
          />
          <Label
            htmlFor="different-shipping"
            className="text-xs cursor-pointer"
          >
            Adresse de livraison differente
          </Label>
        </div>

        {hasDifferentShipping && (
          <div className="border rounded-lg p-3 space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                <Truck className="h-3 w-3" />
                Adresse de livraison
              </p>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-xs"
                onClick={() => setEditingShipping(!editingShipping)}
              >
                <Pencil className="h-3 w-3 mr-1" />
                {editingShipping ? 'Fermer' : 'Modifier'}
              </Button>
            </div>

            {!editingShipping ? (
              <div className="text-sm">
                {shippingAddress.address_line1 && (
                  <p>{shippingAddress.address_line1}</p>
                )}
                <p>
                  {[shippingAddress.postal_code, shippingAddress.city]
                    .filter(Boolean)
                    .join(' ')}
                  {shippingAddress.country
                    ? `, ${shippingAddress.country}`
                    : ''}
                </p>
                {!shippingAddress.city && !shippingAddress.postal_code && (
                  <p className="text-xs text-muted-foreground italic">
                    Aucune adresse renseignee
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <div className="space-y-1">
                  <Label className="text-xs">Adresse</Label>
                  <Input
                    value={shippingAddress.address_line1}
                    onChange={e =>
                      setShippingAddress(prev => ({
                        ...prev,
                        address_line1: e.target.value,
                      }))
                    }
                    placeholder="Rue, numero..."
                    className="h-8"
                  />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Code postal</Label>
                    <Input
                      value={shippingAddress.postal_code}
                      onChange={e =>
                        setShippingAddress(prev => ({
                          ...prev,
                          postal_code: e.target.value,
                        }))
                      }
                      placeholder="75001"
                      className="h-8"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Ville</Label>
                    <Input
                      value={shippingAddress.city}
                      onChange={e =>
                        setShippingAddress(prev => ({
                          ...prev,
                          city: e.target.value,
                        }))
                      }
                      placeholder="Paris"
                      className="h-8"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Pays</Label>
                    <Input
                      value={shippingAddress.country}
                      onChange={e =>
                        setShippingAddress(prev => ({
                          ...prev,
                          country: e.target.value,
                        }))
                      }
                      placeholder="FR"
                      className="h-8"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

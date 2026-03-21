/**
 * Composant: ShippingConfigCard
 * Configuration livraison & frais de port pour le canal site internet
 */

'use client';

import { useState, useEffect, useCallback } from 'react';

import { useToast } from '@verone/common/hooks';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Checkbox,
  Switch,
} from '@verone/ui';
import { ButtonV2 } from '@verone/ui';
import { Input } from '@verone/ui';
import { Textarea } from '@verone/ui';
import { Label } from '@verone/ui';
import { Loader2, Save, Truck } from 'lucide-react';

import type { SiteInternetConfig } from '../types';

const DEFAULT_SHIPPING: NonNullable<SiteInternetConfig['config']['shipping']> =
  {
    standard_enabled: true,
    standard_label: 'Livraison standard',
    standard_price_cents: 1290,
    standard_min_days: 5,
    standard_max_days: 7,

    express_enabled: true,
    express_label: 'Livraison express',
    express_price_cents: 1990,
    express_min_days: 2,
    express_max_days: 3,

    free_shipping_enabled: true,
    free_shipping_threshold_cents: 15000,
    free_shipping_applies_to: 'standard',

    allowed_countries: ['FR', 'BE', 'CH', 'LU', 'MC'],

    shipping_info_message: "Livraison offerte dès 150€ d'achat",
  };

const COUNTRY_OPTIONS = [
  { code: 'FR', label: 'France' },
  { code: 'BE', label: 'Belgique' },
  { code: 'CH', label: 'Suisse' },
  { code: 'LU', label: 'Luxembourg' },
  { code: 'MC', label: 'Monaco' },
] as const;

interface ShippingConfigCardProps {
  config: SiteInternetConfig | null | undefined;
  onSave: (
    shippingConfig: NonNullable<SiteInternetConfig['config']['shipping']>
  ) => Promise<void>;
  isSaving: boolean;
}

function centsToEuros(cents: number): string {
  return (cents / 100).toFixed(2);
}

function eurosToCents(euros: string): number {
  const parsed = parseFloat(euros);
  if (isNaN(parsed)) return 0;
  return Math.round(parsed * 100);
}

export function ShippingConfigCard({
  config,
  onSave,
  isSaving,
}: ShippingConfigCardProps) {
  const { toast } = useToast();
  const [form, setForm] = useState(DEFAULT_SHIPPING);

  useEffect(() => {
    if (config?.config?.shipping) {
      setForm({ ...DEFAULT_SHIPPING, ...config.config.shipping });
    }
  }, [config]);

  const handleSave = useCallback(async () => {
    if (
      form.standard_enabled &&
      form.standard_min_days > form.standard_max_days
    ) {
      toast({
        title: 'Erreur de validation',
        description:
          'Le délai minimum standard doit être inférieur au délai maximum.',
        variant: 'destructive',
      });
      return;
    }
    if (form.express_enabled && form.express_min_days > form.express_max_days) {
      toast({
        title: 'Erreur de validation',
        description:
          'Le délai minimum express doit être inférieur au délai maximum.',
        variant: 'destructive',
      });
      return;
    }
    if (!form.standard_enabled && !form.express_enabled) {
      toast({
        title: 'Erreur de validation',
        description: 'Au moins une option de livraison doit être activée.',
        variant: 'destructive',
      });
      return;
    }
    if (form.allowed_countries.length === 0) {
      toast({
        title: 'Erreur de validation',
        description: 'Au moins un pays de livraison doit être sélectionné.',
        variant: 'destructive',
      });
      return;
    }

    try {
      await onSave(form);
      toast({
        title: 'Livraison sauvegardée',
        description: 'Les paramètres de livraison ont été mis à jour.',
      });
    } catch (_error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de sauvegarder les paramètres de livraison.',
        variant: 'destructive',
      });
    }
  }, [form, onSave, toast]);

  const toggleCountry = (code: string) => {
    setForm(prev => ({
      ...prev,
      allowed_countries: prev.allowed_countries.includes(code)
        ? prev.allowed_countries.filter(c => c !== code)
        : [...prev.allowed_countries, code],
    }));
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Truck className="h-5 w-5 text-indigo-600" />
          <CardTitle>Livraison & Frais de Port</CardTitle>
        </div>
        <CardDescription>
          Options de livraison affichées lors du checkout Stripe
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        {/* Livraison Standard */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground">
              Livraison Standard
            </h3>
            <Switch
              checked={form.standard_enabled}
              onCheckedChange={checked =>
                setForm(prev => ({ ...prev, standard_enabled: checked }))
              }
            />
          </div>
          {form.standard_enabled && (
            <div className="grid grid-cols-2 gap-4 pl-1">
              <div className="col-span-2 space-y-2">
                <Label htmlFor="standard-label">Libellé</Label>
                <Input
                  id="standard-label"
                  value={form.standard_label}
                  onChange={e =>
                    setForm(prev => ({
                      ...prev,
                      standard_label: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="standard-price">Prix (euros)</Label>
                <Input
                  id="standard-price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={centsToEuros(form.standard_price_cents)}
                  onChange={e =>
                    setForm(prev => ({
                      ...prev,
                      standard_price_cents: eurosToCents(e.target.value),
                    }))
                  }
                />
              </div>
              <div className="flex gap-2">
                <div className="flex-1 space-y-2">
                  <Label htmlFor="standard-min">Délai min (jours)</Label>
                  <Input
                    id="standard-min"
                    type="number"
                    min="1"
                    value={form.standard_min_days}
                    onChange={e =>
                      setForm(prev => ({
                        ...prev,
                        standard_min_days: parseInt(e.target.value) || 1,
                      }))
                    }
                  />
                </div>
                <div className="flex-1 space-y-2">
                  <Label htmlFor="standard-max">Délai max (jours)</Label>
                  <Input
                    id="standard-max"
                    type="number"
                    min="1"
                    value={form.standard_max_days}
                    onChange={e =>
                      setForm(prev => ({
                        ...prev,
                        standard_max_days: parseInt(e.target.value) || 1,
                      }))
                    }
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="border-t border-border" />

        {/* Livraison Express */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground">
              Livraison Express
            </h3>
            <Switch
              checked={form.express_enabled}
              onCheckedChange={checked =>
                setForm(prev => ({ ...prev, express_enabled: checked }))
              }
            />
          </div>
          {form.express_enabled && (
            <div className="grid grid-cols-2 gap-4 pl-1">
              <div className="col-span-2 space-y-2">
                <Label htmlFor="express-label">Libellé</Label>
                <Input
                  id="express-label"
                  value={form.express_label}
                  onChange={e =>
                    setForm(prev => ({
                      ...prev,
                      express_label: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="express-price">Prix (euros)</Label>
                <Input
                  id="express-price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={centsToEuros(form.express_price_cents)}
                  onChange={e =>
                    setForm(prev => ({
                      ...prev,
                      express_price_cents: eurosToCents(e.target.value),
                    }))
                  }
                />
              </div>
              <div className="flex gap-2">
                <div className="flex-1 space-y-2">
                  <Label htmlFor="express-min">Délai min (jours)</Label>
                  <Input
                    id="express-min"
                    type="number"
                    min="1"
                    value={form.express_min_days}
                    onChange={e =>
                      setForm(prev => ({
                        ...prev,
                        express_min_days: parseInt(e.target.value) || 1,
                      }))
                    }
                  />
                </div>
                <div className="flex-1 space-y-2">
                  <Label htmlFor="express-max">Délai max (jours)</Label>
                  <Input
                    id="express-max"
                    type="number"
                    min="1"
                    value={form.express_max_days}
                    onChange={e =>
                      setForm(prev => ({
                        ...prev,
                        express_max_days: parseInt(e.target.value) || 1,
                      }))
                    }
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="border-t border-border" />

        {/* Livraison Gratuite */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground">
              Livraison Gratuite
            </h3>
            <Switch
              checked={form.free_shipping_enabled}
              onCheckedChange={checked =>
                setForm(prev => ({
                  ...prev,
                  free_shipping_enabled: checked,
                }))
              }
            />
          </div>
          {form.free_shipping_enabled && (
            <div className="grid grid-cols-2 gap-4 pl-1">
              <div className="space-y-2">
                <Label htmlFor="free-threshold">Seuil (euros)</Label>
                <Input
                  id="free-threshold"
                  type="number"
                  step="0.01"
                  min="0"
                  value={centsToEuros(form.free_shipping_threshold_cents)}
                  onChange={e =>
                    setForm(prev => ({
                      ...prev,
                      free_shipping_threshold_cents: eurosToCents(
                        e.target.value
                      ),
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="free-applies-to">S&apos;applique à</Label>
                <select
                  id="free-applies-to"
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  value={form.free_shipping_applies_to}
                  onChange={e =>
                    setForm(prev => ({
                      ...prev,
                      free_shipping_applies_to: e.target.value as
                        | 'standard'
                        | 'all',
                    }))
                  }
                >
                  <option value="standard">Standard uniquement</option>
                  <option value="all">Toutes les options</option>
                </select>
              </div>
            </div>
          )}
        </div>

        <div className="border-t border-border" />

        {/* Zones de Livraison */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-foreground">
            Zones de Livraison
          </h3>
          <div className="flex flex-wrap gap-4">
            {COUNTRY_OPTIONS.map(country => (
              <label
                key={country.code}
                className="flex items-center gap-2 cursor-pointer"
              >
                <Checkbox
                  checked={form.allowed_countries.includes(country.code)}
                  onCheckedChange={() => toggleCountry(country.code)}
                />
                <span className="text-sm">{country.label}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="border-t border-border" />

        {/* Supplement par produit */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base font-medium">
                Supplement par produit
              </Label>
              <p className="text-xs text-muted-foreground mt-0.5">
                Si active, le checkout utilisera le cout d&apos;expedition le
                plus eleve parmi les produits du panier
              </p>
            </div>
            <Switch
              checked={
                (form as Record<string, unknown>).use_product_shipping === true
              }
              onCheckedChange={checked =>
                setForm(prev => ({
                  ...prev,
                  use_product_shipping: checked,
                }))
              }
            />
          </div>
          <p className="text-xs text-muted-foreground bg-muted/50 p-2 rounded">
            Configurez les couts par produit dans la section &quot;Cout
            d&apos;expedition par produit&quot; ci-dessous
          </p>
        </div>

        <div className="border-t border-border" />

        {/* Message */}
        <div className="space-y-2">
          <Label htmlFor="shipping-message">Message affiché sur le site</Label>
          <Textarea
            id="shipping-message"
            placeholder="Ex: Livraison offerte dès 150€ d'achat"
            value={form.shipping_info_message ?? ''}
            onChange={e =>
              setForm(prev => ({
                ...prev,
                shipping_info_message: e.target.value,
              }))
            }
            rows={2}
          />
          <p className="text-xs text-muted-foreground">
            Affiché dans le récapitulatif panier et sur la page checkout
          </p>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <ButtonV2
            onClick={() => {
              void handleSave().catch(error => {
                console.error('[ShippingConfigCard] Save failed:', error);
              });
            }}
            disabled={isSaving}
          >
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sauvegarde...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Sauvegarder
              </>
            )}
          </ButtonV2>
        </div>
      </CardContent>
    </Card>
  );
}

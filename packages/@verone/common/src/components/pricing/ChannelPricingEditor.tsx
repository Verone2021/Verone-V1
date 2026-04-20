'use client';

import { useState } from 'react';

import { Badge, ButtonV2, Input, Switch } from '@verone/ui';
import { cn, formatPrice } from '@verone/utils';
import { AlertTriangle, Check, Globe, Link2, Store, X } from 'lucide-react';

import {
  useChannelPricing,
  useUpdateChannelPrice,
  type ChannelPricingEntry,
} from '../../hooks/use-channel-pricing';

interface ChannelPricingEditorProps {
  productId: string;
  minimumSellingPrice: number;
  className?: string;
}

const CHANNEL_ICONS: Record<
  string,
  React.ComponentType<{ className?: string }>
> = {
  'site-internet': Globe,
  linkme: Link2,
  'google-merchant': Store,
  'meta-commerce': Store,
};

const CHANNEL_HINT: Record<string, string> = {
  'site-internet': 'Prix publié sur veronecollections.fr (= Google + Meta)',
  linkme: 'Prix B2B affilié LinkMe',
  'google-merchant': 'Prix Google Shopping (lecture seule, aligné site)',
  'meta-commerce': 'Prix Meta FB/IG (lecture seule, aligné site)',
};

const READ_ONLY_CHANNELS = new Set(['google-merchant', 'meta-commerce']);

export function ChannelPricingEditor({
  productId,
  minimumSellingPrice,
  className,
}: ChannelPricingEditorProps) {
  const { data: channels, isLoading, error } = useChannelPricing(productId);
  const update = useUpdateChannelPrice();
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState<{
    custom_price_ht: string;
    is_active: boolean;
    override: boolean;
  }>({ custom_price_ht: '', is_active: true, override: false });
  const [rowError, setRowError] = useState<string | null>(null);

  const startEdit = (entry: ChannelPricingEntry) => {
    setEditing(entry.channel_id);
    setDraft({
      custom_price_ht:
        entry.custom_price_ht != null ? String(entry.custom_price_ht) : '',
      is_active: entry.is_active,
      override: false,
    });
    setRowError(null);
  };

  const cancel = () => {
    setEditing(null);
    setRowError(null);
  };

  const save = async (entry: ChannelPricingEntry) => {
    setRowError(null);
    const parsed = draft.custom_price_ht
      ? parseFloat(draft.custom_price_ht)
      : null;

    if (parsed != null && (Number.isNaN(parsed) || parsed < 0)) {
      setRowError('Prix invalide');
      return;
    }

    try {
      await update.mutateAsync({
        product_id: productId,
        channel_id: entry.channel_id,
        custom_price_ht: parsed,
        discount_rate: null,
        is_active: draft.is_active,
        override_minimum: draft.override,
      });
      setEditing(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur inconnue';
      setRowError(message);
    }
  };

  const editable = channels?.filter(
    c => !READ_ONLY_CHANNELS.has(c.channel_code)
  );
  const mirrored = channels?.filter(c =>
    READ_ONLY_CHANNELS.has(c.channel_code)
  );

  return (
    <div className={cn('card-verone p-4', className)}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-medium text-black">Prix par canal</h3>
        {minimumSellingPrice > 0 && (
          <Badge variant="outline" className="text-xs">
            Min de vente: {formatPrice(minimumSellingPrice)}
          </Badge>
        )}
      </div>

      {isLoading && (
        <div className="text-sm text-neutral-500">Chargement des canaux…</div>
      )}

      {error && (
        <div className="text-sm text-red-600">Erreur: {error.message}</div>
      )}

      {editable && editable.length > 0 && (
        <div className="space-y-2">
          {editable.map(entry => {
            const Icon = CHANNEL_ICONS[entry.channel_code] ?? Globe;
            const isEditing = editing === entry.channel_id;
            const effectivePrice = entry.custom_price_ht;
            const belowMin =
              effectivePrice != null &&
              minimumSellingPrice > 0 &&
              effectivePrice < minimumSellingPrice;

            return (
              <div
                key={entry.channel_id}
                className={cn(
                  'border rounded-lg p-3 bg-white',
                  belowMin ? 'border-red-300 bg-red-50' : 'border-neutral-200'
                )}
              >
                <div className="flex items-start gap-3">
                  <Icon className="h-5 w-5 text-neutral-500 mt-0.5 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-neutral-900">
                        {entry.channel_name}
                      </span>
                      {entry.is_active ? (
                        <Badge
                          variant="outline"
                          className="text-xs bg-green-50 border-green-200 text-green-700"
                        >
                          Actif
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs">
                          Inactif
                        </Badge>
                      )}
                      {belowMin && (
                        <Badge
                          variant="destructive"
                          className="text-xs inline-flex items-center gap-1"
                        >
                          <AlertTriangle className="h-3 w-3" />
                          Sous le min
                        </Badge>
                      )}
                    </div>
                    <div className="text-xs text-neutral-500 mt-0.5">
                      {CHANNEL_HINT[entry.channel_code]}
                    </div>

                    {!isEditing ? (
                      <div className="mt-2 flex items-end justify-between gap-3">
                        <div>
                          <div className="text-2xl font-semibold text-neutral-900 tabular-nums">
                            {entry.custom_price_ht != null
                              ? formatPrice(entry.custom_price_ht)
                              : '—'}
                          </div>
                          {entry.custom_price_ht == null && (
                            <div className="text-xs text-neutral-500">
                              Aucun prix défini pour ce canal
                            </div>
                          )}
                        </div>
                        <ButtonV2
                          size="sm"
                          variant="outline"
                          onClick={() => startEdit(entry)}
                        >
                          Modifier
                        </ButtonV2>
                      </div>
                    ) : (
                      <div className="mt-3 space-y-3">
                        <div className="flex items-end gap-2">
                          <div className="flex-1">
                            <label className="text-xs text-neutral-600 font-medium block mb-1">
                              Prix HT (€)
                            </label>
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              value={draft.custom_price_ht}
                              onChange={e =>
                                setDraft(d => ({
                                  ...d,
                                  custom_price_ht: e.target.value,
                                }))
                              }
                              placeholder="0.00"
                            />
                          </div>
                          <div className="flex items-center gap-2 pb-2">
                            <Switch
                              checked={draft.is_active}
                              onCheckedChange={checked =>
                                setDraft(d => ({ ...d, is_active: checked }))
                              }
                            />
                            <span className="text-xs text-neutral-600">
                              Actif
                            </span>
                          </div>
                        </div>

                        {minimumSellingPrice > 0 &&
                          draft.custom_price_ht &&
                          parseFloat(draft.custom_price_ht) <
                            minimumSellingPrice && (
                            <label className="flex items-start gap-2 text-xs text-red-700 bg-red-50 border border-red-200 rounded p-2">
                              <input
                                type="checkbox"
                                checked={draft.override}
                                onChange={e =>
                                  setDraft(d => ({
                                    ...d,
                                    override: e.target.checked,
                                  }))
                                }
                                className="mt-0.5"
                              />
                              <span>
                                Le prix est inférieur au minimum de vente (
                                {formatPrice(minimumSellingPrice)}). Cocher pour
                                forcer la sauvegarde.
                              </span>
                            </label>
                          )}

                        {rowError && (
                          <div className="text-xs text-red-600">{rowError}</div>
                        )}

                        <div className="flex items-center gap-2">
                          <ButtonV2
                            size="sm"
                            onClick={() => {
                              void save(entry);
                            }}
                            disabled={update.isPending}
                          >
                            <Check className="h-3 w-3 mr-1" />
                            {update.isPending
                              ? 'Enregistrement…'
                              : 'Enregistrer'}
                          </ButtonV2>
                          <ButtonV2
                            size="sm"
                            variant="outline"
                            onClick={cancel}
                            disabled={update.isPending}
                          >
                            <X className="h-3 w-3 mr-1" />
                            Annuler
                          </ButtonV2>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {mirrored && mirrored.length > 0 && (
        <div className="mt-4 pt-3 border-t border-neutral-200">
          <div className="text-xs text-neutral-500 font-medium uppercase tracking-wide mb-2">
            Canaux miroirs (prix synchronisé depuis site internet)
          </div>
          <ul className="space-y-1.5">
            {mirrored.map(entry => {
              const Icon = CHANNEL_ICONS[entry.channel_code] ?? Store;
              return (
                <li
                  key={entry.channel_id}
                  className="flex items-center justify-between text-sm text-neutral-600 px-2 py-1.5 rounded bg-neutral-50"
                >
                  <span className="inline-flex items-center gap-2">
                    <Icon className="h-4 w-4" />
                    {entry.channel_name}
                  </span>
                  <span className="text-xs text-neutral-400">
                    = prix site-internet
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}

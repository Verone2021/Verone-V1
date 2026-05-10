'use client';

import React, { useState } from 'react';

import {
  AlertTriangle,
  BarChart2,
  Box,
  CheckCircle2,
  Clock,
  Globe,
  Megaphone,
  ShoppingBag,
} from 'lucide-react';

import { Badge } from '@verone/ui/components/ui/badge';
import { Button } from '@verone/ui/components/ui/button';
import { Label } from '@verone/ui/components/ui/label';
import { Switch } from '@verone/ui/components/ui/switch';
import { Textarea } from '@verone/ui/components/ui/textarea';
import { cn } from '@verone/utils';

import {
  useMarketingEligibility,
  type MarketingStockLevel,
} from '../../hooks/use-marketing-eligibility';

// ============================================================================
// TYPES
// ============================================================================

interface MarketingEligibilitySectionProps {
  productId: string;
  className?: string;
}

// ============================================================================
// HELPERS
// ============================================================================

function ChannelLight({
  ok,
  label,
  Icon,
}: {
  ok: boolean;
  label: string;
  Icon: React.ElementType;
}) {
  return (
    <div className="flex items-center gap-2">
      <Icon
        className={cn(
          'h-4 w-4 shrink-0',
          ok ? 'text-green-600' : 'text-gray-300'
        )}
      />
      <span className={cn('text-sm', ok ? 'text-green-700' : 'text-gray-400')}>
        {label}
      </span>
      <span
        className={cn(
          'ml-auto h-2 w-2 rounded-full',
          ok ? 'bg-green-500' : 'bg-gray-300'
        )}
      />
    </div>
  );
}

// Couleur + libellé du voyant stock — règle "Tolérante" (avertissement, pas blocage)
function getStockBadge(
  level: MarketingStockLevel,
  stockReal: number,
  stockForecastedIn: number
): {
  Icon: React.ElementType;
  label: string;
  color: string;
  textColor: string;
  ringColor: string;
} {
  switch (level) {
    case 'in_stock':
      return {
        Icon: CheckCircle2,
        label: `Stock OK (${stockReal})`,
        color: 'bg-green-50',
        textColor: 'text-green-700',
        ringColor: 'ring-green-200',
      };
    case 'preorder':
      return {
        Icon: Clock,
        label: 'Précommande active',
        color: 'bg-blue-50',
        textColor: 'text-blue-700',
        ringColor: 'ring-blue-200',
      };
    case 'reorder_pending':
      return {
        Icon: Clock,
        label: `Réappro en cours (+${stockForecastedIn})`,
        color: 'bg-orange-50',
        textColor: 'text-orange-700',
        ringColor: 'ring-orange-200',
      };
    case 'out_of_stock':
      return {
        Icon: AlertTriangle,
        label: 'Stock épuisé sans réappro',
        color: 'bg-red-50',
        textColor: 'text-red-700',
        ringColor: 'ring-red-200',
      };
  }
}

function getIneligibilityReason(
  archived: boolean,
  productStatus: string,
  marketingBlocked: boolean,
  marketingBlockedReason: string | null,
  isPublishedOnline: boolean,
  isOnMeta: boolean
): string {
  if (archived) return 'Produit archivé';
  if (productStatus === 'discontinued') return 'Produit arrêté';
  if (productStatus === 'draft') return 'Produit en brouillon';
  if (marketingBlocked) {
    return marketingBlockedReason
      ? `Bloqué manuellement : ${marketingBlockedReason}`
      : 'Bloqué manuellement';
  }
  if (!isPublishedOnline && !isOnMeta)
    return 'Pas encore publié sur Site ni Meta';
  return 'Non éligible';
}

// ============================================================================
// COMPONENT
// ============================================================================

export function MarketingEligibilitySection({
  productId,
  className,
}: MarketingEligibilitySectionProps) {
  const {
    marketingBlocked,
    marketingBlockedReason,
    isPublishedOnline,
    isOnMeta,
    isOnGoogleMerchant,
    productStatus,
    archived,
    stockReal,
    stockForecastedIn,
    stockLevel,
    isEligible,
    loading,
    saving,
    error,
    setBlocked,
  } = useMarketingEligibility(productId);

  const [localBlocked, setLocalBlocked] = useState<boolean | null>(null);
  const [localReason, setLocalReason] = useState('');
  const [isDirty, setIsDirty] = useState(false);

  // Sync état local quand données chargées
  React.useEffect(() => {
    if (!loading) {
      setLocalBlocked(marketingBlocked);
      setLocalReason(marketingBlockedReason ?? '');
      setIsDirty(false);
    }
  }, [loading, marketingBlocked, marketingBlockedReason]);

  const autoManaged = archived || productStatus === 'discontinued';
  const currentBlocked = localBlocked ?? marketingBlocked;

  const handleSave = () => {
    void setBlocked(currentBlocked, localReason.trim() || null).catch(err =>
      console.error('[MarketingEligibilitySection] save failed:', err)
    );
    setIsDirty(false);
  };

  if (loading) {
    return (
      <div
        className={cn(
          'rounded-lg border border-gray-200 bg-white p-4 shadow-sm',
          className
        )}
      >
        <div className="flex items-center gap-2 mb-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-50">
            <Megaphone className="h-4 w-4 text-orange-500" />
          </div>
          <h3 className="font-medium text-gray-900">Marketing</h3>
        </div>
        <p className="text-sm text-gray-400">Chargement…</p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'rounded-lg border border-gray-200 bg-white p-4 shadow-sm',
        className
      )}
    >
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-50">
            <Megaphone className="h-4 w-4 text-orange-500" />
          </div>
          <h3 className="font-medium text-gray-900">Marketing</h3>
        </div>

        {isEligible ? (
          <Badge className="bg-green-100 text-green-800 border-green-200 text-xs">
            Éligible pour le marketing
          </Badge>
        ) : (
          <Badge variant="destructive" className="text-xs">
            Non éligible
          </Badge>
        )}
      </div>

      {/* Raison d'inéligibilité */}
      {!isEligible && (
        <p className="mb-3 text-xs text-red-600">
          {getIneligibilityReason(
            archived,
            productStatus,
            marketingBlocked,
            marketingBlockedReason,
            isPublishedOnline,
            isOnMeta
          )}
        </p>
      )}

      {/* Voyant stock — avertissement non-bloquant */}
      {(() => {
        const stockBadge = getStockBadge(
          stockLevel,
          stockReal,
          stockForecastedIn
        );
        return (
          <div
            className={cn(
              'mb-3 flex items-center gap-2 rounded-md p-2 ring-1',
              stockBadge.color,
              stockBadge.ringColor
            )}
          >
            <stockBadge.Icon
              className={cn('h-4 w-4 shrink-0', stockBadge.textColor)}
            />
            <span className={cn('text-xs font-medium', stockBadge.textColor)}>
              <Box className="mr-1 inline h-3 w-3" />
              {stockBadge.label}
            </span>
            {stockLevel === 'out_of_stock' && (
              <span className="ml-auto text-[10px] text-red-600">
                À publier avec prudence
              </span>
            )}
          </div>
        );
      })()}

      {/* Voyants canaux */}
      <div className="mb-4 space-y-2 rounded-md bg-gray-50 p-3">
        <ChannelLight ok={isPublishedOnline} label="Site Vérone" Icon={Globe} />
        <ChannelLight
          ok={isOnMeta}
          label="Meta (Facebook / Instagram)"
          Icon={ShoppingBag}
        />
        <ChannelLight
          ok={isOnGoogleMerchant}
          label="Google Merchant"
          Icon={BarChart2}
        />
      </div>

      {/* Interrupteur blocage */}
      {autoManaged ? (
        <div className="rounded-md bg-gray-50 p-3">
          <p className="text-xs text-gray-500">
            Le statut marketing est géré automatiquement pour ce produit (
            {productStatus === 'discontinued' ? 'arrêté' : 'archivé'}).
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <Label
              htmlFor={`mkt-blocked-${productId}`}
              className="text-sm font-normal"
            >
              Bloquer pour le marketing
            </Label>
            <Switch
              id={`mkt-blocked-${productId}`}
              checked={currentBlocked}
              onCheckedChange={v => {
                setLocalBlocked(v);
                setIsDirty(true);
              }}
              disabled={saving}
            />
          </div>

          {currentBlocked && (
            <div className="space-y-1">
              <Label
                htmlFor={`mkt-reason-${productId}`}
                className="text-xs text-gray-600"
              >
                Raison du blocage (optionnelle)
              </Label>
              <Textarea
                id={`mkt-reason-${productId}`}
                value={localReason}
                onChange={e => {
                  setLocalReason(e.target.value);
                  setIsDirty(true);
                }}
                placeholder="Ex : stock écoulé, litige fournisseur…"
                rows={2}
                className="resize-none text-sm"
                disabled={saving}
              />
            </div>
          )}

          {isDirty && (
            <Button
              size="sm"
              onClick={handleSave}
              disabled={saving}
              className="w-full"
            >
              {saving ? 'Sauvegarde…' : 'Sauvegarder'}
            </Button>
          )}
        </div>
      )}

      {error && <p className="mt-2 text-xs text-red-600">Erreur : {error}</p>}
    </div>
  );
}

'use client';

import { useState } from 'react';

import Link from 'next/link';

import {
  MoreVertical,
  Edit,
  FileText,
  RefreshCw,
  EyeOff,
  Trash2,
  ExternalLink,
  CheckCircle,
  Clock,
  AlertCircle,
  XCircle,
  BarChart,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { ButtonV2 } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@verone/utils';
import { GoogleMerchantMetadataEditor } from '@/shared/modules/channels/components/google-merchant/GoogleMerchantMetadataEditor';
import { GoogleMerchantPriceEditor } from '@/shared/modules/channels/components/google-merchant/GoogleMerchantPriceEditor';
import { ProductThumbnail } from '@/shared/modules/products/components/images/ProductThumbnail';

/**
 * Produit Google Merchant (simplifié pour card)
 */
export interface GoogleMerchantProductCardData {
  id: string;
  product_id: string;
  sku: string;
  product_name: string;
  primary_image_url?: string | null;
  cost_price?: number;
  custom_price_ht?: number | null;
  custom_title?: string | null;
  custom_description?: string | null;
  description?: string | null;
  sync_status: 'success' | 'pending' | 'error' | 'skipped';
  google_status: 'approved' | 'pending' | 'rejected' | 'not_synced' | null;
  impressions: number;
  clicks: number;
  conversions: number;
  synced_at: string;
  error_message?: string | null;
}

/**
 * Props pour GoogleMerchantProductCard
 */
export interface GoogleMerchantProductCardProps {
  /** Données produit */
  product: GoogleMerchantProductCardData;
  /** Callback pour mise à jour prix custom */
  onUpdatePrice: (productId: string, newPriceHT: number) => Promise<void>;
  /** Callback pour mise à jour métadonnées */
  onUpdateMetadata: (
    productId: string,
    metadata: { title: string; description: string }
  ) => Promise<void>;
  /** Callback pour re-synchroniser */
  onResync: (productId: string) => Promise<void>;
  /** Callback pour masquer */
  onHide: (productId: string) => Promise<void>;
  /** Callback pour retirer */
  onRemove: (productId: string) => Promise<void>;
}

/**
 * Composant: GoogleMerchantProductCard
 *
 * Card compact pour afficher un produit synchronisé avec Google Merchant.
 * Features:
 * - Thumbnail 64×64 avec fallback
 * - Nom + SKU
 * - Prix HT/TTC + badge source
 * - Badge statut sync (✅ ⏳ ❌)
 * - Badge statut Google (🟢 🟡 🔴)
 * - Métriques (impressions, clics)
 * - DropdownMenu actions
 * - Hover elevation effect
 *
 * Design System V2:
 * - Compact card design
 * - Hover: elevation + border color
 * - Badges colorés selon statut
 * - Actions dropdown discret
 *
 * @example
 * <GoogleMerchantProductCard
 *   product={product}
 *   onUpdatePrice={updatePrice}
 *   onUpdateMetadata={updateMetadata}
 *   onResync={resyncProduct}
 *   onHide={hideProduct}
 *   onRemove={removeProduct}
 * />
 */
export function GoogleMerchantProductCard({
  product,
  onUpdatePrice,
  onUpdateMetadata,
  onResync,
  onHide,
  onRemove,
}: GoogleMerchantProductCardProps) {
  const [isPriceEditorOpen, setIsPriceEditorOpen] = useState(false);
  const [isMetadataEditorOpen, setIsMetadataEditorOpen] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);

  const TVA_RATE = 1.2;
  const currentPriceHT = product.custom_price_ht ?? product.cost_price ?? 0;
  const currentPriceTTC = currentPriceHT * TVA_RATE;

  // Helper: Badge statut sync
  const getSyncStatusBadge = () => {
    switch (product.sync_status) {
      case 'success':
        return (
          <Badge
            variant="outline"
            className="border-[#38ce3c] text-[#38ce3c] bg-green-50"
          >
            <CheckCircle className="h-3 w-3 mr-1" />
            Succès
          </Badge>
        );
      case 'pending':
        return (
          <Badge
            variant="outline"
            className="border-[#ff9b3e] text-[#ff9b3e] bg-orange-50"
          >
            <Clock className="h-3 w-3 mr-1" />
            En cours
          </Badge>
        );
      case 'error':
        return (
          <Badge
            variant="outline"
            className="border-[#ff4d6b] text-[#ff4d6b] bg-red-50"
          >
            <XCircle className="h-3 w-3 mr-1" />
            Erreur
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="border-gray-300 text-gray-500">
            Ignoré
          </Badge>
        );
    }
  };

  // Helper: Badge statut Google
  const getGoogleStatusBadge = () => {
    if (!product.google_status) {
      return (
        <Badge variant="outline" className="border-gray-300 text-gray-500">
          Non synchronisé
        </Badge>
      );
    }

    switch (product.google_status) {
      case 'approved':
        return (
          <Badge
            variant="outline"
            className="border-[#38ce3c] text-[#38ce3c] bg-green-50"
          >
            🟢 Approuvé
          </Badge>
        );
      case 'pending':
        return (
          <Badge
            variant="outline"
            className="border-[#ff9b3e] text-[#ff9b3e] bg-orange-50"
          >
            🟡 En attente
          </Badge>
        );
      case 'rejected':
        return (
          <Badge
            variant="outline"
            className="border-[#ff4d6b] text-[#ff4d6b] bg-red-50"
          >
            🔴 Refusé
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="border-gray-300 text-gray-500">
            Non synchronisé
          </Badge>
        );
    }
  };

  // Handlers actions avec loading state
  const handleAction = async (action: () => Promise<void>) => {
    setIsActionLoading(true);
    try {
      await action();
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleUpdatePrice = async (productId: string, newPriceHT: number) => {
    await handleAction(() => onUpdatePrice(productId, newPriceHT));
    setIsPriceEditorOpen(false);
  };

  const handleUpdateMetadata = async (
    productId: string,
    metadata: { title: string; description: string }
  ) => {
    await handleAction(() => onUpdateMetadata(productId, metadata));
    setIsMetadataEditorOpen(false);
  };

  return (
    <>
      <Card
        className={cn(
          'border-2 border-gray-200 hover:border-[#3b86d1] transition-all duration-150',
          'hover:shadow-md'
        )}
      >
        <CardContent className="p-4">
          <div className="flex items-start gap-4">
            {/* Thumbnail */}
            <ProductThumbnail
              src={product.primary_image_url}
              alt={product.product_name}
              size="md"
              className="flex-shrink-0"
            />

            {/* Contenu principal */}
            <div className="flex-1 min-w-0 space-y-3">
              {/* Header: Nom + Actions */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-black truncate">
                    {product.product_name}
                  </h3>
                  <p className="text-sm text-gray-500 font-mono">
                    {product.sku}
                  </p>
                </div>

                {/* Actions dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <ButtonV2
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      disabled={isActionLoading}
                    >
                      <MoreVertical className="h-4 w-4" />
                      <span className="sr-only">Actions</span>
                    </ButtonV2>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem
                      onClick={() => setIsPriceEditorOpen(true)}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Modifier prix
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => setIsMetadataEditorOpen(true)}
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      Modifier métadonnées
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() =>
                        handleAction(() => onResync(product.product_id))
                      }
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Re-synchroniser
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() =>
                        handleAction(() => onHide(product.product_id))
                      }
                    >
                      <EyeOff className="h-4 w-4 mr-2" />
                      Masquer
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() =>
                        handleAction(() => onRemove(product.product_id))
                      }
                      className="text-[#ff4d6b] focus:text-[#ff4d6b]"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Retirer
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Prix */}
              <div className="flex items-center gap-3 flex-wrap">
                <div>
                  <p className="text-xs text-gray-500">Prix HT</p>
                  <p className="text-lg font-bold text-black">
                    {currentPriceHT.toFixed(2)} €
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Prix TTC</p>
                  <p className="text-lg font-semibold text-gray-700">
                    {currentPriceTTC.toFixed(2)} €
                  </p>
                </div>
                <Badge
                  variant="outline"
                  className={cn(
                    'border-2',
                    product.custom_price_ht
                      ? 'border-[#3b86d1] text-[#3b86d1] bg-blue-50'
                      : 'border-gray-300 text-gray-600'
                  )}
                >
                  {product.custom_price_ht ? 'Prix custom' : 'Prix base'}
                </Badge>
              </div>

              {/* Statuts */}
              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">Sync:</span>
                  {getSyncStatusBadge()}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">Google:</span>
                  {getGoogleStatusBadge()}
                </div>
              </div>

              {/* Métriques */}
              <div className="grid grid-cols-3 gap-4 pt-2 border-t border-gray-200">
                <div>
                  <p className="text-xs text-gray-500 flex items-center gap-1">
                    <BarChart className="h-3 w-3" />
                    Impressions
                  </p>
                  <p className="text-sm font-semibold text-black">
                    {product.impressions.toLocaleString('fr-FR')}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Clics</p>
                  <p className="text-sm font-semibold text-black">
                    {product.clicks}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Conversions</p>
                  <p className="text-sm font-semibold text-[#38ce3c]">
                    {product.conversions}
                  </p>
                </div>
              </div>

              {/* Lien fiche produit */}
              <Link
                href={`/produits/${product.product_id}`}
                className="inline-flex items-center gap-1 text-sm text-[#3b86d1] hover:underline"
              >
                Voir fiche produit
                <ExternalLink className="h-3 w-3" />
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Modals */}
      <GoogleMerchantPriceEditor
        product={{
          id: product.product_id,
          name: product.product_name,
          sku: product.sku,
          cost_price: product.cost_price,
          custom_price_ht: product.custom_price_ht,
        }}
        onSave={handleUpdatePrice}
        onCancel={() => setIsPriceEditorOpen(false)}
        open={isPriceEditorOpen}
      />

      <GoogleMerchantMetadataEditor
        product={{
          id: product.product_id,
          name: product.product_name,
          sku: product.sku,
          description: product.description,
          custom_title: product.custom_title,
          custom_description: product.custom_description,
        }}
        onSave={handleUpdateMetadata}
        onCancel={() => setIsMetadataEditorOpen(false)}
        open={isMetadataEditorOpen}
      />
    </>
  );
}

'use client';

import { useState } from 'react';

import { ButtonV2 } from '@verone/ui';
import { Card, CardContent, CardHeader, CardTitle } from '@verone/ui';
import { CloudflareImage } from '@verone/ui';
import { Label } from '@verone/ui';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@verone/ui';
import { Textarea } from '@verone/ui';
import { cn, formatCurrency } from '@verone/utils';
import {
  Plus,
  X,
  Store,
  Globe,
  Users,
  ChevronRight,
  Eye,
  Building2,
  Loader2,
  Package,
} from 'lucide-react';

import { LinkMeCartTable } from './LinkMeCartTable';
import type { LinkMeWorkflowProps } from './linkme-workflow-types';

export type { LinkMeWorkflowProps } from './linkme-workflow-types';

export function LinkMeWorkflow({
  affiliateType,
  onAffiliateTypeChange,
  affiliateId,
  onAffiliateIdChange,
  affiliates,
  loadingAffiliates,
  selectionId,
  onSelectionIdChange,
  selections,
  loadingSelections,
  selectionDetail,
  loadingSelectionDetail,
  cart,
  cartTotals,
  onAddProduct,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  notes,
  onNotesChange,
  loading,
  canSubmit,
  onSubmit,
  onCancel,
  previewSelection,
  previewLoading,
}: LinkMeWorkflowProps) {
  const [previewSelectionId, setPreviewSelectionId] = useState<string | null>(
    null
  );

  return (
    <div className="space-y-6">
      {/* STEP 1: Affiliate type */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-purple-600" />
            Type d&apos;affili&eacute;
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => {
                onAffiliateTypeChange('enseigne');
                onAffiliateIdChange(null);
                onSelectionIdChange(null);
                onClearCart();
              }}
              className={cn(
                'flex items-center gap-3 p-4 rounded-lg border-2 transition-all text-left',
                affiliateType === 'enseigne'
                  ? 'border-purple-500 bg-purple-50'
                  : 'border-gray-200 hover:border-gray-300'
              )}
            >
              <Store
                className={cn(
                  'h-5 w-5',
                  affiliateType === 'enseigne'
                    ? 'text-purple-600'
                    : 'text-gray-400'
                )}
              />
              <div>
                <p className="font-medium">Enseigne</p>
                <p className="text-xs text-gray-500">
                  Chaîne de magasins affiliée
                </p>
              </div>
            </button>
            <button
              type="button"
              onClick={() => {
                onAffiliateTypeChange('org_independante');
                onAffiliateIdChange(null);
                onSelectionIdChange(null);
                onClearCart();
              }}
              className={cn(
                'flex items-center gap-3 p-4 rounded-lg border-2 transition-all text-left',
                affiliateType === 'org_independante'
                  ? 'border-purple-500 bg-purple-50'
                  : 'border-gray-200 hover:border-gray-300'
              )}
            >
              <Building2
                className={cn(
                  'h-5 w-5',
                  affiliateType === 'org_independante'
                    ? 'text-purple-600'
                    : 'text-gray-400'
                )}
              />
              <div>
                <p className="font-medium">Organisation indépendante</p>
                <p className="text-xs text-gray-500">
                  Entreprise affiliée autonome
                </p>
              </div>
            </button>
          </div>
        </CardContent>
      </Card>

      {/* STEP 2: Affiliate selection */}
      {affiliateType && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Store className="h-5 w-5 text-purple-600" />
              Affili&eacute;
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="linkme-affiliate">
                Sélectionner l&apos;affilié *
              </Label>
              {loadingAffiliates ? (
                <div className="flex items-center gap-2 py-4">
                  <Loader2 className="h-4 w-4 animate-spin text-purple-600" />
                  <span className="text-sm text-gray-500">
                    Chargement des affiliés...
                  </span>
                </div>
              ) : (affiliates ?? []).length > 0 ? (
                <Select
                  value={affiliateId ?? ''}
                  onValueChange={value => {
                    onAffiliateIdChange(value ?? null);
                    onSelectionIdChange(null);
                    onClearCart();
                  }}
                  disabled={loading}
                >
                  <SelectTrigger id="linkme-affiliate">
                    <SelectValue placeholder="Choisir un affilié" />
                  </SelectTrigger>
                  <SelectContent>
                    {(affiliates ?? []).map(affiliate => (
                      <SelectItem key={affiliate.id} value={affiliate.id}>
                        {affiliate.display_name}{' '}
                        <span className="text-muted-foreground">
                          ({affiliate.selections_count} sélection
                          {affiliate.selections_count > 1 ? 's' : ''})
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <p className="text-sm text-amber-600 py-2">
                  Aucun affilié de ce type disponible
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* STEP 3: Selection (Mini-boutique) */}
      {affiliateId && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-purple-600" />
              Sélection (Mini-boutique)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Label>Sélectionner la sélection *</Label>
              {loadingSelections ? (
                <div className="flex items-center gap-2 py-4">
                  <Loader2 className="h-4 w-4 animate-spin text-purple-600" />
                  <span className="text-sm text-gray-500">
                    Chargement des sélections...
                  </span>
                </div>
              ) : (selections ?? []).length === 0 ? (
                <div className="text-center py-4 text-muted-foreground">
                  Aucune sélection disponible pour cet affilié
                </div>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {(selections ?? []).map(selection => (
                    <div key={selection.id} className="flex items-center gap-2">
                      {/* Selection button */}
                      <button
                        type="button"
                        onClick={() => {
                          onSelectionIdChange(selection.id);
                          onClearCart();
                        }}
                        disabled={loading}
                        className={cn(
                          'flex-1 flex items-center justify-between p-3 rounded-lg border-2 text-left transition-all',
                          selectionId === selection.id
                            ? 'border-purple-500 bg-purple-50'
                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        )}
                      >
                        <div>
                          <p className="font-medium">{selection.name}</p>
                          <p className="text-xs text-gray-500">
                            {selection.products_count ?? 0} produit
                            {(selection.products_count ?? 0) > 1
                              ? 's'
                              : ''} - {selection.affiliate_name}
                          </p>
                        </div>
                        {selectionId === selection.id && (
                          <ChevronRight className="h-5 w-5 text-purple-600" />
                        )}
                      </button>
                      {/* Preview button */}
                      <button
                        type="button"
                        onClick={() => setPreviewSelectionId(selection.id)}
                        className="p-3 hover:bg-purple-100 rounded-lg transition-colors border border-gray-200"
                        title="Aperçu des produits"
                      >
                        <Eye className="h-4 w-4 text-gray-500 hover:text-purple-600" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* STEP 4: Products from selection */}
      {selectionId && (
        <Card>
          <CardHeader>
            <CardTitle>Produits disponibles</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingSelectionDetail ? (
              <div className="flex justify-center py-8">
                <div className="text-gray-500">Chargement des produits...</div>
              </div>
            ) : (selectionDetail?.items ?? []).length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Aucun produit dans cette sélection
              </div>
            ) : (
              <div className="grid gap-3 max-h-80 overflow-y-auto pr-2">
                {(selectionDetail?.items ?? []).map(item => {
                  const sellingPrice =
                    item.selling_price_ht ??
                    item.base_price_ht * (1 + (item.margin_rate ?? 0) / 100);
                  const isUserProduct = (item.commission_rate ?? 0) > 0;
                  const marginPercent = isUserProduct
                    ? (item.commission_rate ?? 0).toFixed(2)
                    : (item.margin_rate ?? 0).toFixed(
                        (item.margin_rate ?? 0) % 1 === 0 ? 0 : 2
                      );
                  const isInCart = cart.some(
                    c => c.product_id === item.product_id
                  );

                  return (
                    <div
                      key={item.id}
                      className={cn(
                        'flex items-center justify-between p-3 border rounded-lg',
                        isInCart
                          ? 'bg-purple-50 border-purple-200'
                          : 'hover:bg-gray-50'
                      )}
                    >
                      <div className="flex items-center gap-3">
                        {(item.product_image_cloudflare_id ??
                        item.product_image_url) ? (
                          <CloudflareImage
                            cloudflareId={item.product_image_cloudflare_id}
                            fallbackSrc={item.product_image_url}
                            alt={item.product?.name ?? 'Produit'}
                            width={48}
                            height={48}
                            className="w-12 h-12 object-cover rounded"
                          />
                        ) : (
                          <div className="w-12 h-12 bg-gray-100 rounded flex items-center justify-center">
                            <Store className="h-6 w-6 text-gray-400" />
                          </div>
                        )}
                        <div>
                          <p className="font-medium">
                            {item.product?.name ?? 'Produit inconnu'}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {item.product?.sku ?? 'N/A'}
                          </p>
                          <p className="text-sm">
                            <span className="font-semibold text-purple-700">
                              {formatCurrency(sellingPrice)}
                            </span>
                            <span className="text-muted-foreground ml-2">
                              (
                              {isUserProduct
                                ? `frais LinkMe ${marginPercent}%`
                                : `marge ${marginPercent}%`}
                              )
                            </span>
                          </p>
                        </div>
                      </div>
                      <ButtonV2
                        type="button"
                        size="sm"
                        variant={isInCart ? 'secondary' : 'default'}
                        onClick={() => onAddProduct(item)}
                        disabled={loading}
                      >
                        <Plus className="h-4 w-4" />
                        {isInCart ? 'Ajouter +1' : 'Ajouter'}
                      </ButtonV2>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* STEP 5: LinkMe Cart */}
      <LinkMeCartTable
        cart={cart}
        cartTotals={cartTotals}
        loading={loading}
        onUpdateQuantity={onUpdateQuantity}
        onRemoveItem={onRemoveItem}
      />

      {/* Notes */}
      <Card>
        <CardHeader>
          <CardTitle>Notes (optionnel)</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={notes}
            onChange={e => onNotesChange(e.target.value)}
            placeholder="Notes internes sur la commande..."
            disabled={loading}
          />
        </CardContent>
      </Card>

      {/* Actions LinkMe */}
      <div className="flex justify-end gap-4">
        <ButtonV2
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={loading}
        >
          Annuler
        </ButtonV2>
        <ButtonV2
          type="button"
          onClick={onSubmit}
          disabled={!canSubmit}
          className="bg-purple-600 hover:bg-purple-700"
        >
          {loading ? 'Création...' : 'Créer la commande LinkMe'}
        </ButtonV2>
      </div>

      {/* Preview Selection Dialog */}
      {previewSelectionId && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden mx-4">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="font-semibold">
                Aperçu : {previewSelection?.name ?? 'Chargement...'}
              </h3>
              <button
                onClick={() => setPreviewSelectionId(null)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-4 overflow-y-auto max-h-[60vh]">
              {previewLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-purple-600" />
                </div>
              ) : !previewSelection?.items?.length ? (
                <div className="text-center py-8 text-gray-500">
                  Aucun produit dans cette sélection
                </div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                  {previewSelection.items.map(item => {
                    const commissionRate = (item.commission_rate ?? 0) / 100;
                    const marginRate = (item.margin_rate ?? 0) / 100;
                    const sellingPrice =
                      (item.base_price_ht / (1 - marginRate)) *
                      (1 + commissionRate);
                    return (
                      <div
                        key={item.id}
                        className="border rounded-lg p-2 bg-gray-50"
                      >
                        <div className="w-16 h-16 mx-auto mb-2 overflow-hidden rounded">
                          {(item.product_image_cloudflare_id ??
                          item.product_image_url) ? (
                            <CloudflareImage
                              cloudflareId={item.product_image_cloudflare_id}
                              fallbackSrc={item.product_image_url}
                              alt={item.product?.name ?? 'Produit'}
                              width={64}
                              height={64}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                              <Package className="h-6 w-6 text-gray-400" />
                            </div>
                          )}
                        </div>
                        <p className="text-xs font-medium text-center truncate">
                          {item.product?.name ?? 'Produit'}
                        </p>
                        <p className="text-xs text-gray-500 text-center">
                          {formatCurrency(sellingPrice)}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            <div className="p-4 border-t flex justify-end">
              <button
                onClick={() => setPreviewSelectionId(null)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

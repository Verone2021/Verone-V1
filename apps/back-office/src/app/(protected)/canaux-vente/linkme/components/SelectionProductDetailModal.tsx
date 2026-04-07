'use client';

import Image from 'next/image';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Badge,
  Separator,
  Input,
  Label,
} from '@verone/ui';
import { cn } from '@verone/utils';
import {
  Package,
  Tag,
  Truck,
  Check,
  Euro,
  Calculator,
  TrendingDown,
} from 'lucide-react';

import { MarginSlider } from './MarginSlider';
import { SelectionProductDetailActions } from './SelectionProductDetailActions';
import { useSelectionProductDetail } from './use-selection-product-detail';
import type { SelectionItem } from '../hooks/use-linkme-selections';

interface SelectionProductDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: SelectionItem | null;
  mode?: 'view' | 'edit';
  onSave?: (
    itemId: string,
    updates: { marginRate?: number; customPriceHT?: number }
  ) => Promise<void>;
  isSaving?: boolean;
}

export function SelectionProductDetailModal({
  open,
  onOpenChange,
  item,
  mode = 'edit',
  onSave,
  isSaving = false,
}: SelectionProductDetailModalProps) {
  const {
    localMarginRate,
    localCustomPriceHT,
    hasChanges,
    isGeneratingPdf,
    pdfContentRef,
    marginResult,
    basePrice,
    commissionRate,
    isAffiliateProduct,
    sellingPriceWithMargin,
    finalPriceWithCommission,
    prixClientLinkMe,
    affiliateCommissionRate,
    affiliateCommissionAmount,
    affiliateNetRevenue,
    prixCatalogueLinkMe,
    remiseVsCatalogue,
    bufferRate,
    handleMarginChange,
    handlePriceChange,
    handleSave,
    handleCancel,
    handleDownloadPdf,
  } = useSelectionProductDetail({ item, mode, onSave, onOpenChange });

  if (!item) return null;

  const product = item.product;
  const sellingPoints = (
    Array.isArray(product?.selling_points) ? product.selling_points : []
  ) as string[];
  const isViewMode = mode === 'view';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            {isViewMode ? 'Fiche Produit' : 'Modifier Produit'}
          </DialogTitle>
        </DialogHeader>

        {/* Contenu pour export PDF */}
        <div ref={pdfContentRef} className="space-y-6 bg-white p-2">
          {/* === SECTION HEADER: Image + Infos === */}
          <div className="flex gap-6">
            {/* Image - Plus grande pour un look professionnel */}
            <div className="relative h-48 w-48 shrink-0 overflow-hidden rounded-xl border bg-gradient-to-br from-gray-50 to-gray-100 shadow-sm">
              {item.product_image_url ? (
                <Image
                  src={item.product_image_url}
                  alt={product?.name ?? 'Produit'}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <Package className="h-16 w-16 text-muted-foreground/40" />
                </div>
              )}
            </div>

            {/* Infos produit */}
            <div className="flex-1 space-y-3">
              <div className="flex items-start justify-between gap-4">
                <h2 className="text-2xl font-bold leading-tight">
                  {product?.name ?? 'Produit'}
                </h2>
                <Badge variant="outline" className="font-mono text-xs shrink-0">
                  {product?.sku ?? 'N/A'}
                </Badge>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {product?.category_name && (
                  <Badge variant="secondary" className="text-xs">
                    {product.category_name}
                  </Badge>
                )}
                {product?.supplier_name && (
                  <span className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Truck className="h-3.5 w-3.5" />
                    {product.supplier_name}
                  </span>
                )}
                {product?.weight_kg && (
                  <span className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Tag className="h-3.5 w-3.5" />
                    {product.weight_kg} kg
                  </span>
                )}
              </div>

              {/* Description */}
              {product?.description && (
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {product.description}
                </p>
              )}
            </div>
          </div>

          <Separator />

          {/* === COMPARATIF PRIX (Catalogue vs Sélection) === */}
          {prixCatalogueLinkMe && (
            <div className="rounded-xl border bg-blue-50/50 p-4 space-y-3">
              <h4 className="font-medium text-sm flex items-center gap-2">
                <TrendingDown className="h-4 w-4 text-blue-600" />
                Comparatif Prix
              </h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                {/* Prix catalogue LinkMe */}
                <div>
                  <p className="text-xs text-muted-foreground">
                    Prix LinkMe (catalogue)
                  </p>
                  <p className="font-mono font-semibold text-lg">
                    {prixCatalogueLinkMe.toFixed(2)} €
                  </p>
                </div>
                {/* Prix sélection */}
                <div>
                  <p className="text-xs text-blue-600">Prix client sélection</p>
                  <p className="font-mono font-semibold text-lg text-blue-600">
                    {prixClientLinkMe.toFixed(2)} €
                  </p>
                </div>
                {/* Remise vs catalogue */}
                {remiseVsCatalogue !== null && (
                  <div className="col-span-2">
                    <Badge
                      variant="outline"
                      className={cn(
                        'font-mono',
                        remiseVsCatalogue < 0
                          ? 'border-green-500 text-green-600 bg-green-50'
                          : remiseVsCatalogue > 0
                            ? 'border-red-500 text-red-600 bg-red-50'
                            : 'border-gray-500 text-gray-600'
                      )}
                    >
                      {remiseVsCatalogue > 0 ? '+' : ''}
                      {remiseVsCatalogue.toFixed(2)}% vs catalogue
                    </Badge>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* === SECTION TARIFICATION === */}
          <div className="rounded-xl border bg-gradient-to-br from-slate-50 to-slate-100/50 p-5 space-y-4">
            <h3 className="font-semibold flex items-center gap-2 text-lg">
              <Euro className="h-5 w-5 text-primary" />
              Tarification
            </h3>

            {/* Prix de vente HT */}
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="custom_price" className="text-sm font-medium">
                  Prix de vente HT (sélection)
                </Label>
                {isViewMode ? (
                  <p className="text-2xl font-bold font-mono">
                    {basePrice.toFixed(2)} €
                  </p>
                ) : (
                  <div className="relative">
                    <Input
                      id="custom_price"
                      type="number"
                      value={localCustomPriceHT}
                      onChange={e =>
                        handlePriceChange(parseFloat(e.target.value) || 0)
                      }
                      step={0.01}
                      min={0}
                      className="font-mono pr-8"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                      €
                    </span>
                  </div>
                )}
              </div>

              {/* Prix client LinkMe (calculé) */}
              <div className="space-y-2">
                <p className="text-sm font-medium text-blue-600">
                  {isAffiliateProduct ? 'Prix client' : 'Prix client (calculé)'}
                </p>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold text-blue-600">
                    {prixClientLinkMe.toFixed(2)} €
                  </span>
                  {isAffiliateProduct ? (
                    <span className="text-xs text-muted-foreground">
                      (prix fixé par l&apos;affilié)
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground">
                      (× {((1 + commissionRate) * 100).toFixed(0)}%)
                    </span>
                  )}
                </div>
                {isAffiliateProduct && (
                  <p className="text-xs text-amber-600">
                    Commission Vérone : -{affiliateCommissionAmount.toFixed(2)}{' '}
                    € | Net affilié : {affiliateNetRevenue.toFixed(2)} €
                  </p>
                )}
              </div>
            </div>

            <Separator />

            {/* Jauge de marge */}
            <div className="margin-section space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">Marge affilié</p>
                <Badge
                  variant="outline"
                  className={cn(
                    'font-mono',
                    marginResult &&
                      localMarginRate <= marginResult.greenZoneEnd &&
                      'border-green-500 text-green-600',
                    marginResult &&
                      localMarginRate > marginResult.greenZoneEnd &&
                      localMarginRate <= marginResult.orangeZoneEnd &&
                      'border-orange-500 text-orange-600',
                    marginResult &&
                      localMarginRate > marginResult.orangeZoneEnd &&
                      'border-red-500 text-red-600'
                  )}
                >
                  {(localMarginRate * 100).toFixed(1)} %
                </Badge>
              </div>

              {marginResult?.isProductSellable ? (
                <MarginSlider
                  marginResult={marginResult}
                  value={localMarginRate}
                  onChange={isViewMode ? undefined : handleMarginChange}
                  readOnly={isViewMode}
                />
              ) : (
                <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-sm text-amber-700">
                  <p className="font-medium">
                    Données de marge non disponibles
                  </p>
                  <p className="text-xs mt-1">
                    Vérifiez que le prix public HT est renseigné sur la fiche
                    produit catalogue.
                  </p>
                </div>
              )}
            </div>

            <Separator />

            {/* Prix de vente final */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">
                  {isAffiliateProduct
                    ? 'Prix client final HT'
                    : 'Prix de vente final HT'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {isAffiliateProduct
                    ? '(prix affilié, commission déduite du revenu)'
                    : '(base + marge + commission)'}
                </p>
              </div>
              <p className="text-3xl font-bold text-primary">
                {finalPriceWithCommission.toFixed(2)} €
              </p>
            </div>
          </div>

          {/* === DÉTAIL DES CALCULS === */}
          <div className="rounded-xl border p-4 space-y-3">
            <h4 className="font-medium flex items-center gap-2 text-sm">
              <Calculator className="h-4 w-4" />
              Détail des calculs
            </h4>
            <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
              <span>Prix de vente HT</span>
              <span className="font-mono text-right text-foreground">
                {basePrice.toFixed(2)} €
              </span>

              {isAffiliateProduct ? (
                <>
                  <span>Commission Vérone ({affiliateCommissionRate}%)</span>
                  <span className="font-mono text-right text-amber-600">
                    -{affiliateCommissionAmount.toFixed(2)} €
                  </span>

                  <Separator className="col-span-2 my-2" />

                  <span className="font-medium text-foreground">
                    Revenu net affilié
                  </span>
                  <span className="font-mono text-right font-bold text-green-600">
                    {affiliateNetRevenue.toFixed(2)} €
                  </span>
                </>
              ) : (
                <>
                  <span>
                    Commission LinkMe ({(item?.commission_rate ?? 0).toFixed(0)}
                    %)
                  </span>
                  <span className="font-mono text-right">
                    {(basePrice * commissionRate).toFixed(2)} €
                  </span>

                  <span>
                    Marge affilié ({(localMarginRate * 100).toFixed(1)}%)
                  </span>
                  <span className="font-mono text-right">
                    {(sellingPriceWithMargin - basePrice).toFixed(2)} €
                  </span>
                </>
              )}

              {item?.public_price_ht && (
                <>
                  <Separator className="col-span-2 my-2" />

                  <span>Prix public HT</span>
                  <span className="font-mono text-right">
                    {item.public_price_ht.toFixed(2)} €
                  </span>

                  <span>
                    Buffer sécurité ({(bufferRate * 100).toFixed(0)}%)
                  </span>
                  <span className="font-mono text-right">
                    {(item.public_price_ht * bufferRate).toFixed(2)} €
                  </span>

                  <span>Prix max autorisé</span>
                  <span className="font-mono text-right">
                    {(item.public_price_ht * (1 - bufferRate)).toFixed(2)} €
                  </span>

                  <span>Écart vs prix public</span>
                  <span
                    className={cn(
                      'font-mono text-right',
                      finalPriceWithCommission <=
                        item.public_price_ht * (1 - bufferRate)
                        ? 'text-green-600'
                        : 'text-red-600'
                    )}
                  >
                    {(item.public_price_ht - finalPriceWithCommission).toFixed(
                      2
                    )}{' '}
                    € (
                    {(
                      ((item.public_price_ht - finalPriceWithCommission) /
                        item.public_price_ht) *
                      100
                    ).toFixed(1)}
                    %)
                  </span>
                </>
              )}
            </div>
          </div>

          {/* === ARGUMENTS DE VENTE === */}
          {sellingPoints.length > 0 && (
            <>
              <Separator />
              <div className="space-y-3">
                <h3 className="font-semibold text-lg">Arguments de vente</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {sellingPoints.map((point, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-2 text-sm text-muted-foreground bg-green-50/50 rounded-lg p-2"
                    >
                      <Check className="h-4 w-4 shrink-0 text-green-600 mt-0.5" />
                      <span>{point}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        <Separator />

        <SelectionProductDetailActions
          isViewMode={isViewMode}
          isSaving={isSaving}
          isGeneratingPdf={isGeneratingPdf}
          hasChanges={hasChanges}
          handleSave={handleSave}
          handleCancel={handleCancel}
          handleDownloadPdf={handleDownloadPdf}
        />
      </DialogContent>
    </Dialog>
  );
}

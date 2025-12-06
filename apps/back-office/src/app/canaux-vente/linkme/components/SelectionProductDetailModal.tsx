'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

import Image from 'next/image';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Button,
  Badge,
  Separator,
  Input,
  Label,
} from '@verone/ui';
import { cn } from '@verone/utils';
import {
  X,
  Package,
  Tag,
  Truck,
  Check,
  Info,
  FileDown,
  Euro,
  Loader2,
} from 'lucide-react';

import { MarginSlider } from './MarginSlider';
import type { SelectionItem } from '../hooks/use-linkme-selections';
import { calculateLinkMeMargins } from '../types';

interface SelectionProductDetailModalProps {
  /** État d'ouverture du modal */
  open: boolean;
  /** Callback pour changer l'état d'ouverture */
  onOpenChange: (open: boolean) => void;
  /** Item de la sélection à afficher */
  item: SelectionItem | null;
  /** Mode du modal: 'view' (lecture seule) ou 'edit' (éditable) */
  mode?: 'view' | 'edit';
  /** Callback pour sauvegarder (mode edit) - marginRate en %, customPriceHT en € */
  onSave?: (
    itemId: string,
    updates: { marginRate?: number; customPriceHT?: number }
  ) => Promise<void>;
  /** Indique si une sauvegarde est en cours */
  isSaving?: boolean;
}

/**
 * Modal de détail produit pour les sélections LinkMe
 *
 * MODE VUE (view):
 * - Design professionnel, lecture seule
 * - Téléchargement PDF avec/sans marge
 *
 * MODE ÉDITION (edit):
 * - Slider marge interactif
 * - Champ prix de vente modifiable
 * - Prix client LinkMe (calculé) affiché
 */
export function SelectionProductDetailModal({
  open,
  onOpenChange,
  item,
  mode = 'edit',
  onSave,
  isSaving = false,
}: SelectionProductDetailModalProps) {
  // États locaux pour l'édition
  const [localMarginRate, setLocalMarginRate] = useState<number>(0);
  const [localCustomPriceHT, setLocalCustomPriceHT] = useState<number>(0);
  const [hasChanges, setHasChanges] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  // Ref pour le contenu PDF
  const pdfContentRef = useRef<HTMLDivElement>(null);

  // Sync états locaux avec item
  useEffect(() => {
    if (item) {
      // margin_rate est stocké en % (ex: 11 = 11%), on convertit en décimal (0.11)
      setLocalMarginRate(item.margin_rate / 100);
      setLocalCustomPriceHT(item.base_price_ht || 0);
      setHasChanges(false);
    }
  }, [item]);

  // Calcul des marges pour le slider
  // FORMULE CORRECTE: basePriceHT = prix de vente catalogue (PAS cost_price!)
  const marginResult = item
    ? item.public_price_ht && item.public_price_ht > 0
      ? calculateLinkMeMargins({
          basePriceHT: item.base_price_ht || 0,
          publicPriceHT: item.public_price_ht,
          platformFeeRate: (item.commission_rate || 5) / 100,
          bufferRate: item.buffer_rate || 0.05,
        })
      : item.min_margin_rate !== null && item.max_margin_rate !== null
        ? {
            minRate: (item.min_margin_rate ?? 1) / 100,
            maxRate: (item.max_margin_rate ?? 100) / 100,
            suggestedRate:
              (item.suggested_margin_rate ?? (item.max_margin_rate ?? 30) / 3) /
              100,
            isProductSellable: true,
            greenZoneEnd:
              (item.suggested_margin_rate ?? (item.max_margin_rate ?? 30) / 3) /
              100,
            orangeZoneEnd:
              ((item.suggested_margin_rate ??
                (item.max_margin_rate ?? 30) / 3) *
                2) /
              100,
          }
        : null
    : null;

  // Calcul des prix
  const basePrice =
    mode === 'edit' ? localCustomPriceHT : item?.base_price_ht || 0;
  const commissionRate = (item?.commission_rate || 0) / 100; // Conversion % → décimal (5.00 → 0.05)

  // Prix de vente avec marge locale
  // Note: sellingPriceWithMargin = ce que l'affilié gagne (basePrice + sa marge)
  const sellingPriceWithMargin = basePrice * (1 + localMarginRate);

  // FORMULE CORRECTE: P_vente = basePrice × (1 + commission + marge)
  // La commission LinkMe et la marge affilié s'ADDITIONNENT (pas multiplication!)
  const finalPriceWithCommission =
    basePrice * (1 + commissionRate + localMarginRate);

  // Prix client LinkMe (calculé) = base × (1 + commission)
  const prixClientLinkMe = basePrice * (1 + commissionRate);

  // Prix client LinkMe catalogue (pour comparaison)
  const catalogCommRate = (item?.commission_rate || 0) / 100; // Conversion % → décimal
  const prixClientLinkMeCatalogue = item?.catalog_price_ht
    ? item.catalog_price_ht * (1 + catalogCommRate)
    : null;

  // Handler changement marge (décimal)
  const handleMarginChange = useCallback((newRate: number) => {
    setLocalMarginRate(newRate);
    setHasChanges(true);
  }, []);

  // Handler changement prix de vente
  const handlePriceChange = useCallback((newPrice: number) => {
    setLocalCustomPriceHT(newPrice);
    setHasChanges(true);
  }, []);

  // Handler sauvegarde
  const handleSave = async () => {
    if (!item || !hasChanges || !onSave) return;

    // Validation: vérifier que le prix final ne dépasse pas le prix public
    if (item.public_price_ht && item.public_price_ht > 0) {
      const commissionRate = (item.commission_rate || 0) / 100;
      const marginRateDecimal = localMarginRate;
      const bufferRate = item.buffer_rate || 0.05;

      // Prix final = base × (1 + commission + marge)
      const finalPrice =
        localCustomPriceHT * (1 + commissionRate + marginRateDecimal);
      // Prix maximum autorisé = prix public × (1 - buffer)
      const maxAllowedPrice = item.public_price_ht * (1 - bufferRate);

      if (finalPrice > maxAllowedPrice) {
        alert(
          `Le prix de vente final (${finalPrice.toFixed(2)} €) dépasse le prix public autorisé (${maxAllowedPrice.toFixed(2)} €).\n\n` +
            `Veuillez réduire la marge ou le prix de vente HT.`
        );
        return;
      }
    }

    await onSave(item.id, {
      marginRate: localMarginRate * 100, // Reconvertir en %
      customPriceHT: localCustomPriceHT,
    });
    setHasChanges(false);
    onOpenChange(false);
  };

  // Handler annuler
  const handleCancel = () => {
    if (item) {
      setLocalMarginRate(item.margin_rate / 100);
      setLocalCustomPriceHT(item.base_price_ht || 0);
      setHasChanges(false);
    }
    onOpenChange(false);
  };

  // Téléchargement PDF
  const handleDownloadPdf = async (showMargin: boolean) => {
    if (!item || !pdfContentRef.current) return;

    setIsGeneratingPdf(true);

    try {
      // Import dynamique pour éviter le SSR
      const html2canvas = (await import('html2canvas')).default;
      const jsPDF = (await import('jspdf')).default;

      // Masquer/afficher la section marge selon l'option
      const marginSection =
        pdfContentRef.current.querySelector('.margin-section');
      if (marginSection && !showMargin) {
        (marginSection as HTMLElement).style.display = 'none';
      }

      const canvas = await html2canvas(pdfContentRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
      });

      // Restaurer la section marge
      if (marginSection && !showMargin) {
        (marginSection as HTMLElement).style.display = '';
      }

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const imgWidth = 190;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 10, 10, imgWidth, imgHeight);

      const filename = `fiche-produit-${item.product?.sku || item.id}${showMargin ? '' : '-sans-marge'}.pdf`;
      pdf.save(filename);
    } catch (error) {
      console.error('Erreur génération PDF:', error);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  if (!item) return null;

  const product = item.product;
  const sellingPoints = product?.selling_points || [];
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
                  alt={product?.name || 'Produit'}
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
                  {product?.name || 'Produit'}
                </h2>
                <Badge variant="outline" className="font-mono text-xs shrink-0">
                  {product?.sku || 'N/A'}
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

          {/* === SECTION TARIFICATION === */}
          <div className="rounded-xl border bg-gradient-to-br from-slate-50 to-slate-100/50 p-5 space-y-4">
            <h3 className="font-semibold flex items-center gap-2 text-lg">
              <Euro className="h-5 w-5 text-primary" />
              Tarification
            </h3>

            {/* Mode ÉDITION: Champs éditables */}
            {!isViewMode && (
              <div className="grid grid-cols-2 gap-6">
                {/* Prix de vente HT (éditable) */}
                <div className="space-y-2">
                  <Label htmlFor="custom_price" className="text-sm font-medium">
                    Prix de vente HT
                  </Label>
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
                </div>

                {/* Prix client LinkMe (calculé) */}
                <div className="space-y-2">
                  <p className="text-sm font-medium text-blue-600">
                    Prix client LinkMe (calculé)
                  </p>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold text-blue-600">
                      {prixClientLinkMe.toFixed(2)} €
                    </span>
                    <span className="text-xs text-muted-foreground">
                      (× {((1 + commissionRate) * 100).toFixed(0)}%)
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Mode VUE: Affichage lecture seule */}
            {isViewMode && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">
                    Prix de base HT
                  </p>
                  <p className="text-xl font-semibold">
                    {basePrice.toFixed(2)} €
                  </p>
                </div>
                {prixClientLinkMeCatalogue && (
                  <div>
                    <p className="text-xs text-blue-600">
                      Prix catalogue LinkMe
                    </p>
                    <p className="text-xl font-semibold text-blue-600">
                      {prixClientLinkMeCatalogue.toFixed(2)} €
                    </p>
                  </div>
                )}
              </div>
            )}

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

              {marginResult && marginResult.isProductSellable ? (
                // Utiliser MarginSlider unifié pour VIEW et EDIT
                // readOnly désactive le slider mais garde tous les labels
                <MarginSlider
                  marginResult={marginResult}
                  value={localMarginRate}
                  onChange={isViewMode ? undefined : handleMarginChange}
                  readOnly={isViewMode}
                />
              ) : (
                <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
                  Données de marge insuffisantes pour ce produit.
                </div>
              )}
            </div>

            <Separator />

            {/* Prix de vente final */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Prix de vente final HT</p>
                <p className="text-xs text-muted-foreground">
                  (base × marge × commission)
                </p>
              </div>
              <p className="text-3xl font-bold text-primary">
                {finalPriceWithCommission.toFixed(2)} €
              </p>
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

        {/* === ACTIONS === */}
        <div className="flex items-center justify-between gap-3">
          {/* Boutons PDF (Mode Vue) */}
          {isViewMode && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDownloadPdf(true)}
                disabled={isGeneratingPdf}
              >
                {isGeneratingPdf ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <FileDown className="h-4 w-4 mr-2" />
                )}
                PDF avec marge
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDownloadPdf(false)}
                disabled={isGeneratingPdf}
              >
                {isGeneratingPdf ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <FileDown className="h-4 w-4 mr-2" />
                )}
                PDF sans marge
              </Button>
            </div>
          )}

          {/* Spacer si mode édition */}
          {!isViewMode && <div />}

          {/* Boutons Annuler/Enregistrer */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={handleCancel}
              disabled={isSaving}
            >
              <X className="h-4 w-4 mr-2" />
              {isViewMode ? 'Fermer' : 'Annuler'}
            </Button>
            {!isViewMode && (
              <Button
                onClick={handleSave}
                disabled={!hasChanges || isSaving}
                className={cn(hasChanges && 'bg-primary hover:bg-primary/90')}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Enregistrement...
                  </>
                ) : (
                  'Enregistrer modifications'
                )}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

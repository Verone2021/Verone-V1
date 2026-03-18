'use client';

/**
 * Modal: Modifier la marge d'un produit dans une sélection
 *
 * Design aligné avec AddToSelectionModal :
 * - 4 indicateurs de pourcentage aux jonctions (min, greenEnd, orangeEnd, max)
 * - Légende des zones avec pastilles
 * - Légende complète texte
 * - Message contextuel coloré selon la zone
 * - Cards Prix/Gain avec backgrounds colorés
 *
 * @module EditMarginModal
 * @since 2025-12-06
 * @updated 2025-12-06 - Refonte complète alignée avec AddToSelectionModal
 */

import { useState, useMemo } from 'react';
import Image from 'next/image';

import {
  calculateMargin,
  LINKME_CONSTANTS,
  PUBLIC_PRICE_ESTIMATION_FACTOR,
} from '@verone/utils';
import {
  X,
  Loader2,
  Package,
  Check,
  TrendingUp,
  AlertTriangle,
  AlertCircle,
  Info as _Info,
} from 'lucide-react';
import { toast } from 'sonner';

import {
  useUpdateItemMargin,
  useUserAffiliate,
  type SelectionItem,
} from '../../lib/hooks/use-user-selection';

interface EditMarginModalProps {
  item: SelectionItem;
  selectionId: string;
  onClose: () => void;
  /** Produit affilié = marge 0% non modifiable, commission Vérone déduite */
  isAffiliateProduct?: boolean;
}

// Constantes centralisées (SSOT)
const { MIN_MARGIN, BUFFER_RATE, PLATFORM_COMMISSION_RATE } = LINKME_CONSTANTS;

export function EditMarginModal({
  item,
  selectionId,
  onClose,
  isAffiliateProduct = false,
}: EditMarginModalProps) {
  const { data: affiliate } = useUserAffiliate();
  const updateMargin = useUpdateItemMargin();

  // State marge locale
  const [marginRate, setMarginRate] = useState(item.margin_rate);

  // Calculer les limites de marge (formule identique à AddToSelectionModal)
  const marginLimits = useMemo(() => {
    const basePriceHt = item.base_price_ht;
    // Prix public estimé quand non renseigné en DB
    const publicPriceHt = basePriceHt * PUBLIC_PRICE_ESTIMATION_FACTOR;
    const commissionRate =
      affiliate?.linkme_commission_rate ?? PLATFORM_COMMISSION_RATE;

    // Prix LinkMe = prix base × (1 + commission)
    const prixLinkMe = basePriceHt * (1 + commissionRate / 100);

    // FORMULE CORRECTE: Buffer en euros (pas en %)
    // Prix plafond sécurité = prix public × (1 - buffer)
    const prixPlafondSecurite = publicPriceHt * (1 - BUFFER_RATE / 100);

    // Marge max = (prix plafond - prix LinkMe) / prix LinkMe
    const maxMargin = Math.max(
      MIN_MARGIN,
      ((prixPlafondSecurite - prixLinkMe) / prixLinkMe) * 100
    );

    // Zones couleurs (division par 3)
    const greenEnd = maxMargin / 3;
    const orangeEnd = Math.min(greenEnd * 2, maxMargin);

    return {
      min: MIN_MARGIN,
      max: Math.round(maxMargin * 10) / 10,
      greenEnd: Math.round(greenEnd * 10) / 10,
      orangeEnd: Math.round(orangeEnd * 10) / 10,
    };
  }, [item.base_price_ht, affiliate]);

  // Calculer prix vente et gain avec la SSOT (taux de marque)
  const calculations = useMemo(() => {
    const basePriceHt = item.base_price_ht;
    const commissionRate =
      affiliate?.linkme_commission_rate ?? PLATFORM_COMMISSION_RATE;

    // Produit affilié : prix client = selling_price tel quel
    // Commission Vérone DÉDUITE du revenu (pas ajoutée au prix)
    if (isAffiliateProduct) {
      const affiliateCommissionRate = item.affiliate_commission_rate ?? 0;
      const commissionDeducted = basePriceHt * (affiliateCommissionRate / 100);
      return {
        sellingPrice: Math.round(basePriceHt * 100) / 100,
        gain: 0,
        commissionDeducted: Math.round(commissionDeducted * 100) / 100,
        affiliateCommissionRate,
      };
    }

    // Produit catalogue : formule TAUX DE MARGE ADDITIF
    // selling_price = base_price * (1 + margin_rate/100)
    const { sellingPriceHt, gainEuros } = calculateMargin({
      basePriceHt,
      marginRate,
    });

    // Prix final incluant la commission plateforme
    const finalPrice = sellingPriceHt * (1 + commissionRate / 100);

    return {
      sellingPrice: Math.round(finalPrice * 100) / 100,
      gain: gainEuros,
      commissionDeducted: 0,
      affiliateCommissionRate: 0,
    };
  }, [
    item.base_price_ht,
    marginRate,
    affiliate,
    isAffiliateProduct,
    item.affiliate_commission_rate,
  ]);

  // Déterminer la zone actuelle
  const getMarginZone = (rate: number): 'green' | 'orange' | 'red' => {
    if (rate <= marginLimits.greenEnd) return 'green';
    if (rate <= marginLimits.orangeEnd) return 'orange';
    return 'red';
  };

  const currentZone = getMarginZone(marginRate);

  // Sauvegarder
  const handleSave = async () => {
    try {
      await updateMargin.mutateAsync({
        itemId: item.id,
        selectionId,
        marginRate,
      });
      toast.success('Marge mise à jour avec succès');
      onClose();
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Erreur lors de la mise à jour';
      toast.error(errorMessage);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal - max-w-md pour taille correcte */}
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b bg-gradient-to-r from-blue-50 to-white">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Modifier la marge
            </h2>
            <p className="text-sm text-gray-500">
              Ajustez votre marge commerciale
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Produit - Image plus grande */}
        <div className="px-6 py-4 bg-gray-50 border-b flex items-center gap-4">
          <div className="w-16 h-16 bg-white rounded-xl overflow-hidden flex-shrink-0 border shadow-sm relative">
            {item.product_image_url ? (
              <Image
                src={item.product_image_url}
                alt={item.product_name}
                fill
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-300">
                <Package className="h-8 w-8" />
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-gray-900 truncate">
              {item.product_name}
            </p>
            <p className="text-sm text-gray-500 font-mono">
              {item.product_reference}
            </p>
            <p className="text-sm text-gray-400 mt-1">
              Prix base: {item.base_price_ht.toFixed(2)} € HT
            </p>
          </div>
        </div>

        {/* Contenu - Configuration marge */}
        <div className="px-6 py-5 space-y-5 overflow-y-auto">
          {isAffiliateProduct ? (
            /* ========================================
             * MODE PRODUIT AFFILIÉ (lecture seule)
             * Marge = 0%, commission Vérone déduite
             * ======================================== */
            <>
              {/* Message explicatif */}
              <div className="flex items-start gap-3 p-4 rounded-xl bg-blue-50 border border-blue-200">
                <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-sm text-blue-800">
                    Produit affilié
                  </p>
                  <p className="text-xs mt-0.5 text-blue-600">
                    Le prix de vente est fixé par vous. Vérone prélève une
                    commission de {calculations.affiliateCommissionRate}% sur
                    chaque vente.
                  </p>
                </div>
              </div>

              {/* Cards Prix / Commission déduite */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                  <p className="text-xs text-gray-500 mb-1">Prix de vente</p>
                  <p className="text-xl font-bold text-gray-900">
                    {calculations.sellingPrice.toFixed(2)} €
                  </p>
                  <p className="text-xs text-gray-400">HT</p>
                </div>
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                  <p className="text-xs text-amber-600 mb-1">
                    Commission Vérone
                  </p>
                  <p className="text-xl font-bold text-amber-600">
                    -{calculations.commissionDeducted.toFixed(2)} €
                  </p>
                  <p className="text-xs text-amber-500">
                    {calculations.affiliateCommissionRate}% par vente
                  </p>
                </div>
              </div>

              {/* Net affilié */}
              <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
                <p className="text-xs text-green-600 mb-1">
                  Votre revenu net par vente
                </p>
                <p className="text-2xl font-bold text-green-600">
                  {(
                    calculations.sellingPrice - calculations.commissionDeducted
                  ).toFixed(2)}{' '}
                  € HT
                </p>
              </div>
            </>
          ) : (
            /* ========================================
             * MODE PRODUIT CATALOGUE (marge modifiable)
             * ======================================== */
            <>
              {/* Section Marge */}
              <div className="space-y-4">
                {/* Légende des zones avec pastilles */}
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5">
                    <TrendingUp className="h-3.5 w-3.5 text-green-600" />
                    <span className="text-gray-600">Compétitif</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <AlertTriangle className="h-3.5 w-3.5 text-orange-500" />
                    <span className="text-gray-600">Correct</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <AlertCircle className="h-3.5 w-3.5 text-red-500" />
                    <span className="text-gray-600">Proche public</span>
                  </div>
                </div>

                {/* Barre tricolore h-3 */}
                <div className="relative">
                  <div className="flex h-3 w-full overflow-hidden rounded-full border border-gray-200">
                    <div className="w-1/3 bg-green-400" />
                    <div className="w-1/3 bg-orange-400" />
                    <div className="w-1/3 bg-red-400" />
                  </div>

                  {/* Marqueurs de jonction */}
                  <div
                    className="absolute top-0 h-3 border-l-2 border-dashed border-green-700/50"
                    style={{ left: '33.33%' }}
                  />
                  <div
                    className="absolute top-0 h-3 border-l-2 border-dashed border-orange-700/50"
                    style={{ left: '66.66%' }}
                  />
                </div>

                {/* LES 4 INDICATEURS DE POURCENTAGE */}
                <div className="flex justify-between text-xs font-medium">
                  <span className="text-gray-500">{marginLimits.min}%</span>
                  <span className="text-green-600">
                    {marginLimits.greenEnd.toFixed(1)}%
                  </span>
                  <span className="text-orange-500">
                    {marginLimits.orangeEnd.toFixed(1)}%
                  </span>
                  <span className="text-gray-500">
                    {marginLimits.max.toFixed(1)}%
                  </span>
                </div>

                {/* Slider + Input */}
                <div className="pt-2">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">Votre marge</span>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min={marginLimits.min}
                        max={marginLimits.max}
                        step={0.01}
                        value={marginRate.toFixed(2)}
                        onChange={e => {
                          const val = parseFloat(e.target.value);
                          if (
                            !isNaN(val) &&
                            val >= marginLimits.min &&
                            val <= marginLimits.max
                          ) {
                            setMarginRate(Math.round(val * 100) / 100);
                          }
                        }}
                        className="w-20 text-right text-lg font-bold text-gray-900 border border-gray-300 rounded-md px-2 py-0.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                      <span className="text-lg font-bold text-gray-900">%</span>
                    </div>
                  </div>
                  <input
                    type="range"
                    min={marginLimits.min}
                    max={marginLimits.max}
                    step={0.01}
                    value={marginRate}
                    onChange={e =>
                      setMarginRate(
                        Math.round(parseFloat(e.target.value) * 100) / 100
                      )
                    }
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  />
                </div>
              </div>

              {/* Cards Prix/Gain avec backgrounds colorés */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                  <p className="text-xs text-gray-500 mb-1">Prix de vente</p>
                  <p className="text-xl font-bold text-gray-900">
                    {calculations.sellingPrice.toFixed(2)} €
                  </p>
                  <p className="text-xs text-gray-400">HT</p>
                </div>
                <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                  <p className="text-xs text-green-600 mb-1">Votre gain</p>
                  <p className="text-xl font-bold text-green-600">
                    +{calculations.gain.toFixed(2)} €
                  </p>
                  <p className="text-xs text-green-500">par vente</p>
                </div>
              </div>

              {/* MESSAGE CONTEXTUEL SELON ZONE */}
              <div
                className={`flex items-start gap-3 p-4 rounded-xl ${
                  currentZone === 'green'
                    ? 'bg-green-50 border border-green-200'
                    : currentZone === 'orange'
                      ? 'bg-orange-50 border border-orange-200'
                      : 'bg-red-50 border border-red-200'
                }`}
              >
                {currentZone === 'green' && (
                  <TrendingUp className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                )}
                {currentZone === 'orange' && (
                  <AlertTriangle className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
                )}
                {currentZone === 'red' && (
                  <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                )}
                <div>
                  <p
                    className={`font-medium text-sm ${
                      currentZone === 'green'
                        ? 'text-green-800'
                        : currentZone === 'orange'
                          ? 'text-orange-800'
                          : 'text-red-800'
                    }`}
                  >
                    {currentZone === 'green' && 'Prix très compétitif'}
                    {currentZone === 'orange' && 'Prix correct'}
                    {currentZone === 'red' && 'Prix proche du public'}
                  </p>
                  <p
                    className={`text-xs mt-0.5 ${
                      currentZone === 'green'
                        ? 'text-green-600'
                        : currentZone === 'orange'
                          ? 'text-orange-600'
                          : 'text-red-600'
                    }`}
                  >
                    {currentZone === 'green' &&
                      'Cette marge favorise les ventes et la satisfaction client'}
                    {currentZone === 'orange' &&
                      'Bon équilibre entre marge et compétitivité'}
                    {currentZone === 'red' &&
                      'Marge élevée, proche du tarif public officiel'}
                  </p>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Actions */}
        <div className="px-6 py-4 border-t bg-gray-50 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors font-medium"
            disabled={updateMargin.isPending}
          >
            Annuler
          </button>
          <button
            onClick={() => {
              void handleSave().catch(error => {
                console.error('[EditMarginModal] Save failed:', error);
              });
            }}
            disabled={
              isAffiliateProduct ||
              updateMargin.isPending ||
              marginRate === item.margin_rate
            }
            className="flex items-center gap-2 px-5 py-2.5 text-sm bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
          >
            {updateMargin.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Check className="h-4 w-4" />
            )}
            Enregistrer
          </button>
        </div>
      </div>
    </div>
  );
}

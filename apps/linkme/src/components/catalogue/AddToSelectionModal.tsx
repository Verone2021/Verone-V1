'use client';

/**
 * Modal: Ajouter un produit à une sélection avec configuration de marge
 *
 * Permet à l'utilisateur de :
 * - Choisir une sélection existante ou en créer une nouvelle
 * - Configurer la marge avec une jauge tricolore interactive
 * - Voir le gain et le prix final en temps réel
 *
 * @module AddToSelectionModal
 * @since 2025-12-04
 * @updated 2025-12-05 - Ajout jauge marge interactive
 */

import { useState, useMemo, useEffect } from 'react';

import {
  X,
  Plus,
  Check,
  Loader2,
  Package,
  Star,
  AlertCircle,
  TrendingUp,
  Info,
} from 'lucide-react';

import type { LinkMeCatalogProduct } from '../../lib/hooks/use-linkme-catalog';
import { useCatalogProduct } from '../../lib/hooks/use-linkme-catalog';
import {
  useUserSelections,
  useCreateSelection,
  useAddToSelectionWithMargin,
  useUserAffiliate,
} from '../../lib/hooks/use-user-selection';

interface AddToSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: LinkMeCatalogProduct | null;
}

// Constantes pour calculs marge
const MIN_MARGIN = 1; // 1% minimum
const BUFFER_RATE = 5; // 5% buffer
const LINKME_COMMISSION = 5; // 5% commission LinkMe par défaut

export function AddToSelectionModal({
  isOpen,
  onClose,
  product,
}: AddToSelectionModalProps) {
  const { data: affiliate, isLoading: affiliateLoading } = useUserAffiliate();
  const { data: selections, isLoading: selectionsLoading } =
    useUserSelections();
  const createSelection = useCreateSelection();
  const addToSelection = useAddToSelectionWithMargin();

  // Récupérer les détails du produit avec les taux de marge
  const { data: productDetails, isLoading: productLoading } = useCatalogProduct(
    product?.id || null
  );

  const [selectedSelectionId, setSelectedSelectionId] = useState<string | null>(
    null
  );
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [newSelectionName, setNewSelectionName] = useState('');
  const [error, setError] = useState<string | null>(null);

  // State pour la marge configurable
  const [marginRate, setMarginRate] = useState<number>(15);

  // Calculer les limites de marge
  const marginLimits = useMemo(() => {
    if (!product)
      return {
        min: MIN_MARGIN,
        max: 50,
        suggested: 15,
        greenEnd: 15,
        orangeEnd: 30,
      };

    const basePriceHt = product.selling_price_ht;
    const publicPriceHt = product.public_price_ht || basePriceHt * 1.5;
    const commissionRate =
      affiliate?.linkme_commission_rate || LINKME_COMMISSION;

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

    // Zones couleurs (max / 3)
    const suggestedMargin = Math.max(MIN_MARGIN, maxMargin / 3);
    const greenEnd = suggestedMargin;
    const orangeEnd = Math.min(suggestedMargin * 2, maxMargin);

    // Utiliser les valeurs du channel_pricing si disponibles
    const min = productDetails?.min_margin_rate ?? MIN_MARGIN;
    const max =
      productDetails?.max_margin_rate ?? Math.round(maxMargin * 10) / 10;
    const suggested =
      productDetails?.suggested_margin_rate ??
      Math.round(suggestedMargin * 10) / 10;

    return {
      min,
      max,
      suggested,
      greenEnd: Math.round(greenEnd * 10) / 10,
      orangeEnd: Math.round(orangeEnd * 10) / 10,
    };
  }, [product, productDetails, affiliate]);

  // Initialiser la marge avec la valeur suggérée ou par défaut de l'affilié
  useEffect(() => {
    if (marginLimits.suggested) {
      setMarginRate(affiliate?.default_margin_rate || marginLimits.suggested);
    }
  }, [marginLimits.suggested, affiliate]);

  // Calculer le gain et le prix final
  const calculations = useMemo(() => {
    if (!product) return { gain: 0, finalPrice: 0, prixLinkMe: 0 };

    const basePriceHt = product.selling_price_ht;
    const commissionRate =
      affiliate?.linkme_commission_rate || LINKME_COMMISSION;

    // Prix LinkMe = prix base × (1 + commission LinkMe)
    const prixLinkMe = basePriceHt * (1 + commissionRate / 100);

    // Prix final = prix base × (1 + commission + marge affilié)
    const finalPrice =
      basePriceHt * (1 + commissionRate / 100 + marginRate / 100);

    // Gain affilié = prix base × marge affilié
    const gain = basePriceHt * (marginRate / 100);

    return {
      gain: Math.round(gain * 100) / 100,
      finalPrice: Math.round(finalPrice * 100) / 100,
      prixLinkMe: Math.round(prixLinkMe * 100) / 100,
    };
  }, [product, marginRate, affiliate]);

  // Déterminer la couleur de la zone actuelle
  const getMarginZone = (rate: number): 'green' | 'orange' | 'red' => {
    if (rate <= marginLimits.greenEnd) return 'green';
    if (rate <= marginLimits.orangeEnd) return 'orange';
    return 'red';
  };

  const currentZone = getMarginZone(marginRate);

  // Calculer les largeurs des zones sur la barre
  // IMPORTANT: Ces hooks doivent être AVANT le return null pour respecter les règles des hooks React
  // Les zones sont TOUJOURS égales (33.33% chacune) pour une représentation visuelle cohérente
  // indépendamment des valeurs de seuils du backend
  const zoneWidths = useMemo(() => {
    // Zones fixes et égales : 33.33% chacune
    return { greenWidth: 33.33, orangeWidth: 33.33 };
  }, []);

  // Early return APRÈS tous les hooks
  if (!isOpen || !product) return null;

  const isLoading = affiliateLoading || selectionsLoading || productLoading;
  const hasNoAffiliate = !affiliateLoading && !affiliate;
  const hasNoSelections =
    !selectionsLoading && (!selections || selections.length === 0);

  const handleCreateSelection = async () => {
    if (!newSelectionName.trim()) {
      setError('Veuillez entrer un nom pour la sélection');
      return;
    }

    setError(null);

    try {
      const newSelection = await createSelection.mutateAsync({
        name: newSelectionName.trim(),
      });

      // Sélectionner automatiquement la nouvelle sélection
      setSelectedSelectionId(newSelection.id);
      setIsCreatingNew(false);
      setNewSelectionName('');
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Erreur lors de la création';
      setError(message);
    }
  };

  const handleAddToSelection = async () => {
    if (!selectedSelectionId) {
      setError('Veuillez sélectionner une sélection');
      return;
    }

    // Valider la marge
    if (marginRate < marginLimits.min || marginRate > marginLimits.max) {
      setError(
        `La marge doit être entre ${marginLimits.min}% et ${marginLimits.max}%`
      );
      return;
    }

    setError(null);

    try {
      await addToSelection.mutateAsync({
        selectionId: selectedSelectionId,
        productId: product.product_id,
        catalogProductId: product.id,
        marginRate: marginRate, // Passer la marge configurée
      });

      // Fermer le modal après succès
      handleClose();
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Erreur lors de l'ajout";
      setError(message);
    }
  };

  const handleClose = () => {
    setSelectedSelectionId(null);
    setIsCreatingNew(false);
    setNewSelectionName('');
    setError(null);
    setMarginRate(affiliate?.default_margin_rate || 15);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-xl max-w-lg w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900">
            Ajouter à ma sélection
          </h2>
          <button
            onClick={handleClose}
            className="p-1 text-gray-400 hover:text-gray-600 rounded"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Produit sélectionné */}
        <div className="px-6 py-4 bg-gray-50 border-b">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white rounded-lg overflow-hidden flex-shrink-0 border">
              {product.image_url ? (
                <img
                  src={product.image_url}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-300">
                  <Package className="h-8 w-8" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900 truncate">
                {product.custom_title || product.name}
              </p>
              <p className="text-sm text-gray-500 font-mono">
                {product.reference}
              </p>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-sm font-semibold text-gray-900">
                  {product.selling_price_ht.toFixed(2)} € HT
                </span>
                {product.public_price_ht && (
                  <span className="text-xs text-gray-400 line-through">
                    {product.public_price_ht.toFixed(2)} €
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Contenu */}
        <div className="px-6 py-4 overflow-y-auto max-h-[50vh]">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
            </div>
          ) : hasNoAffiliate ? (
            <div className="text-center py-8">
              <AlertCircle className="h-12 w-12 text-orange-500 mx-auto mb-3" />
              <p className="text-gray-600 font-medium">
                Compte affilié non configuré
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Contactez l&apos;administrateur pour activer votre compte.
              </p>
            </div>
          ) : (
            <>
              {/* Configuration de la marge - NOUVEAU */}
              {selectedSelectionId && !isCreatingNew && (
                <div className="mb-6 p-4 bg-blue-50 border border-blue-100 rounded-lg">
                  <div className="flex items-center gap-2 mb-4">
                    <TrendingUp className="h-5 w-5 text-blue-600" />
                    <h3 className="font-medium text-gray-900">Votre marge</h3>
                  </div>

                  {/* Slider avec jauge tricolore */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-600">
                        {marginLimits.min}%
                      </span>
                      <span className="text-lg font-bold text-gray-900">
                        {marginRate.toFixed(1)}%
                      </span>
                      <span className="text-sm text-gray-600">
                        {marginLimits.max.toFixed(0)}%
                      </span>
                    </div>

                    {/* Barre de progression tricolore (zones proportionnelles 1/3 chacune) */}
                    <div className="flex h-3 w-full overflow-hidden rounded-full">
                      {/* Zone verte (≈33%) */}
                      <div
                        className="bg-green-400 transition-all"
                        style={{ width: `${zoneWidths.greenWidth}%` }}
                      />
                      {/* Zone orange (≈33%) */}
                      <div
                        className="bg-orange-400 transition-all"
                        style={{ width: `${zoneWidths.orangeWidth}%` }}
                      />
                      {/* Zone rouge (le reste ≈33%) */}
                      <div className="flex-1 bg-red-400 transition-all" />
                    </div>

                    {/* Input range */}
                    <input
                      type="range"
                      min={marginLimits.min}
                      max={marginLimits.max}
                      step={0.5}
                      value={marginRate}
                      onChange={e => setMarginRate(parseFloat(e.target.value))}
                      className="w-full mt-2 appearance-none h-2 bg-transparent cursor-pointer
                        [&::-webkit-slider-thumb]:appearance-none
                        [&::-webkit-slider-thumb]:w-5
                        [&::-webkit-slider-thumb]:h-5
                        [&::-webkit-slider-thumb]:rounded-full
                        [&::-webkit-slider-thumb]:bg-white
                        [&::-webkit-slider-thumb]:border-2
                        [&::-webkit-slider-thumb]:border-blue-600
                        [&::-webkit-slider-thumb]:shadow-md
                        [&::-webkit-slider-thumb]:cursor-pointer
                        [&::-moz-range-thumb]:w-5
                        [&::-moz-range-thumb]:h-5
                        [&::-moz-range-thumb]:rounded-full
                        [&::-moz-range-thumb]:bg-white
                        [&::-moz-range-thumb]:border-2
                        [&::-moz-range-thumb]:border-blue-600
                        [&::-moz-range-thumb]:shadow-md
                        [&::-moz-range-thumb]:cursor-pointer"
                    />

                    {/* Légende des zones avec icônes */}
                    <div className="flex justify-between mt-2 text-xs">
                      <div className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-green-400" />
                        <span className="text-gray-500">Compétitif</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-orange-400" />
                        <span className="text-gray-500">Correct</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-red-400" />
                        <span className="text-gray-500">Proche public</span>
                      </div>
                    </div>

                    {/* Pourcentages aux jonctions des zones */}
                    <div className="flex justify-between mt-2 text-xs font-medium">
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

                    {/* Légende complète des plages */}
                    <div className="mt-1 text-center text-xs text-gray-400">
                      Vert: 0-{marginLimits.greenEnd.toFixed(1)}% | Orange:{' '}
                      {marginLimits.greenEnd.toFixed(1)}-
                      {marginLimits.orangeEnd.toFixed(1)}% | Rouge:{' '}
                      {marginLimits.orangeEnd.toFixed(1)}-
                      {marginLimits.max.toFixed(1)}%
                    </div>
                  </div>

                  {/* Résumé des calculs */}
                  <div className="grid grid-cols-2 gap-4 pt-3 border-t border-blue-100">
                    <div>
                      <p className="text-xs text-gray-500">Votre gain</p>
                      <p className="text-lg font-bold text-green-600">
                        +{calculations.gain.toFixed(2)} €
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">
                        Prix de vente final
                      </p>
                      <p className="text-lg font-bold text-gray-900">
                        {calculations.finalPrice.toFixed(2)} € HT
                      </p>
                    </div>
                  </div>

                  {/* Info zone actuelle */}
                  <div
                    className={`mt-3 p-2 rounded-lg text-sm ${
                      currentZone === 'green'
                        ? 'bg-green-100 text-green-800'
                        : currentZone === 'orange'
                          ? 'bg-orange-100 text-orange-800'
                          : 'bg-red-100 text-red-800'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Info className="h-4 w-4 flex-shrink-0" />
                      <span>
                        {currentZone === 'green' &&
                          'Prix très compétitif, favorise les ventes'}
                        {currentZone === 'orange' &&
                          'Prix correct, bon équilibre marge/compétitivité'}
                        {currentZone === 'red' &&
                          'Prix proche du tarif public, marge élevée'}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Liste des sélections existantes */}
              {!isCreatingNew && (
                <>
                  {hasNoSelections ? (
                    <div className="text-center py-6">
                      <Star className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                      <p className="text-gray-600">
                        Vous n&apos;avez pas encore de sélection
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        Créez votre première sélection
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-gray-700 mb-3">
                        Choisir une sélection :
                      </p>
                      {selections?.map(selection => (
                        <button
                          key={selection.id}
                          onClick={() => setSelectedSelectionId(selection.id)}
                          className={`w-full flex items-center justify-between p-3 rounded-lg border transition-colors ${
                            selectedSelectionId === selection.id
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <Star
                              className={`h-5 w-5 ${
                                selectedSelectionId === selection.id
                                  ? 'text-blue-600'
                                  : 'text-gray-400'
                              }`}
                            />
                            <div className="text-left">
                              <p className="font-medium text-gray-900">
                                {selection.name}
                              </p>
                              <p className="text-xs text-gray-500">
                                {selection.products_count} produit
                                {selection.products_count > 1 ? 's' : ''}
                              </p>
                            </div>
                          </div>
                          {selectedSelectionId === selection.id && (
                            <Check className="h-5 w-5 text-blue-600" />
                          )}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Bouton créer nouvelle */}
                  <button
                    onClick={() => setIsCreatingNew(true)}
                    className="w-full mt-4 flex items-center justify-center gap-2 p-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-400 hover:text-blue-600 transition-colors"
                  >
                    <Plus className="h-5 w-5" />
                    Créer une nouvelle sélection
                  </button>
                </>
              )}

              {/* Formulaire nouvelle sélection */}
              {isCreatingNew && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nom de la sélection
                    </label>
                    <input
                      type="text"
                      value={newSelectionName}
                      onChange={e => setNewSelectionName(e.target.value)}
                      placeholder="Ma sélection printemps 2025"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      autoFocus
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setIsCreatingNew(false);
                        setNewSelectionName('');
                      }}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                    >
                      Annuler
                    </button>
                    <button
                      onClick={handleCreateSelection}
                      disabled={
                        !newSelectionName.trim() || createSelection.isPending
                      }
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {createSelection.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Plus className="h-4 w-4" />
                      )}
                      Créer
                    </button>
                  </div>
                </div>
              )}

              {/* Message d'erreur */}
              {error && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {error}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        {!isLoading && !hasNoAffiliate && !isCreatingNew && (
          <div className="px-6 py-4 border-t bg-gray-50">
            <button
              onClick={handleAddToSelection}
              disabled={!selectedSelectionId || addToSelection.isPending}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {addToSelection.isPending ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Plus className="h-5 w-5" />
              )}
              Ajouter à la sélection
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

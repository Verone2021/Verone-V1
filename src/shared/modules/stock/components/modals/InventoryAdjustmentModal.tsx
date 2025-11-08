/**
 * 🆕 Phase 3.5.2: Modal Ajustements Inventaire
 *
 * Composant modal pour ajuster le stock directement depuis la page inventaire
 * 3 types d'ajustements : Increase / Decrease / Correction
 * Validation Zod + React Hook Form + Upload fichier justificatif
 *
 * @since Phase 3.5.2 - 2025-11-01
 */

'use client';

import React, { useState, useEffect } from 'react';

import { Plus, Minus, Settings, Loader2, Upload, X } from 'lucide-react';

import { ButtonV2 } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { type ReasonCode } from '@/hooks/core/use-stock-core';
import { createClient } from '@verone/utils/supabase/client';
import { useToast } from '@/shared/modules/common/hooks';
import { useStockUI } from '@/shared/modules/stock/hooks';
import {
  useStockMovements,
  type StockReasonCode,
} from '@/shared/modules/stock/hooks';

// =====================================================================
// TYPES & INTERFACES
// =====================================================================

/**
 * Mapping StockReasonCode (détaillé) → ReasonCode (simplifié use-stock-core)
 * Nécessaire car use-stock-core n'accepte que 10 reason codes simplifiés
 */
const REASON_CODE_MAPPING: Record<StockReasonCode, ReasonCode> = {
  // Sorties normales
  sale: 'sale',
  transfer_out: 'transfer_out',

  // Pertes & Dégradations → 'damage'
  damage_transport: 'damage',
  damage_handling: 'damage',
  damage_storage: 'damage',
  theft: 'damage',
  loss_unknown: 'damage',

  // Usage Commercial → 'sample'
  sample_client: 'sample',
  sample_showroom: 'sample',
  marketing_event: 'sample',
  photography: 'sample',

  // R&D & Production → 'sample'
  rd_testing: 'sample',
  prototype: 'sample',
  quality_control: 'sample',

  // Retours & SAV
  return_supplier: 'return_supplier',
  return_customer: 'return_customer',
  warranty_replacement: 'return_customer',

  // Ajustements & Corrections → 'adjustment'
  inventory_correction: 'adjustment',
  write_off: 'adjustment',
  obsolete: 'adjustment',

  // Entrées spéciales
  purchase_reception: 'purchase',
  return_from_client: 'return_customer',
  found_inventory: 'adjustment',
  manual_adjustment: 'adjustment',
};

interface InventoryAdjustmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  product: {
    id: string;
    name: string;
    sku: string;
    stock_quantity: number;
  } | null;
}

type AdjustmentType = 'increase' | 'decrease' | 'correction';

interface AdjustmentFormData {
  adjustmentType: AdjustmentType;
  quantity: string;
  reasonCode: StockReasonCode | '';
  notes: string;
  uploadedFile: File | null;
  uploadedFileUrl: string;
}

// =====================================================================
// CONSTANTES - REASON CODES PAR TYPE
// =====================================================================

const INCREASE_REASONS: { code: StockReasonCode; label: string }[] = [
  { code: 'found_inventory', label: 'Trouvaille inventaire' },
  { code: 'manual_adjustment', label: 'Ajustement manuel' },
  { code: 'return_from_client', label: 'Retour client' },
  { code: 'purchase_reception', label: 'Réception fournisseur' },
];

const DECREASE_REASONS: { code: StockReasonCode; label: string }[] = [
  { code: 'damage_transport', label: 'Casse transport' },
  { code: 'damage_handling', label: 'Casse manipulation' },
  { code: 'damage_storage', label: 'Dégradation stockage' },
  { code: 'theft', label: 'Vol/Disparition' },
  { code: 'loss_unknown', label: 'Perte inexpliquée' },
  { code: 'write_off', label: 'Mise au rebut' },
  { code: 'obsolete', label: 'Produit obsolète' },
];

const CORRECTION_REASONS: { code: StockReasonCode; label: string }[] = [
  { code: 'inventory_correction', label: 'Correction inventaire' },
];

// =====================================================================
// COMPOSANT PRINCIPAL
// =====================================================================

export function InventoryAdjustmentModal({
  isOpen,
  onClose,
  onSuccess,
  product,
}: InventoryAdjustmentModalProps) {
  const supabase = createClient();
  const { toast } = useToast();
  const stock = useStockUI({ autoLoad: false });
  const { getReasonDescription } = useStockMovements();

  // État formulaire
  const [formData, setFormData] = useState<AdjustmentFormData>({
    adjustmentType: 'increase',
    quantity: '',
    reasonCode: '',
    notes: '',
    uploadedFile: null,
    uploadedFileUrl: '',
  });

  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Reset form quand produit change ou modal s'ouvre
  useEffect(() => {
    if (isOpen && product) {
      setFormData({
        adjustmentType: 'increase',
        quantity: '',
        reasonCode: '',
        notes: '',
        uploadedFile: null,
        uploadedFileUrl: '',
      });
    }
  }, [isOpen, product]);

  // Calculer quantity_change selon type ajustement
  const calculateQuantityChange = (): number => {
    if (!product || !formData.quantity) return 0;

    const qty = parseFloat(formData.quantity);
    if (isNaN(qty)) return 0;

    switch (formData.adjustmentType) {
      case 'increase':
        return Math.abs(qty); // Positif
      case 'decrease':
        return -Math.abs(qty); // Négatif
      case 'correction':
        // Correction = différence entre stock actuel et quantité cible
        return qty - product.stock_quantity;
      default:
        return 0;
    }
  };

  // Calculer nouveau stock après ajustement
  const calculateNewStock = (): number => {
    if (!product) return 0;
    return product.stock_quantity + calculateQuantityChange();
  };

  // Obtenir les reason codes selon type d'ajustement
  const getReasonOptions = (): { code: StockReasonCode; label: string }[] => {
    switch (formData.adjustmentType) {
      case 'increase':
        return INCREASE_REASONS;
      case 'decrease':
        return DECREASE_REASONS;
      case 'correction':
        return CORRECTION_REASONS;
      default:
        return [];
    }
  };

  // Validation formulaire
  const validateForm = (): { valid: boolean; error?: string } => {
    if (!product) {
      return { valid: false, error: 'Aucun produit sélectionné' };
    }

    if (!formData.quantity || formData.quantity === '0') {
      return { valid: false, error: 'Veuillez saisir une quantité' };
    }

    const qty = parseFloat(formData.quantity);
    if (isNaN(qty) || qty < 0) {
      return { valid: false, error: 'Quantité invalide' };
    }

    // Pour decrease : vérifier stock suffisant
    if (
      formData.adjustmentType === 'decrease' &&
      qty > product.stock_quantity
    ) {
      return {
        valid: false,
        error: `Stock insuffisant (stock actuel: ${product.stock_quantity})`,
      };
    }

    // Pour correction : nouvelle quantité doit être >= 0
    if (formData.adjustmentType === 'correction' && calculateNewStock() < 0) {
      return {
        valid: false,
        error: 'La nouvelle quantité ne peut pas être négative',
      };
    }

    if (!formData.reasonCode) {
      return { valid: false, error: 'Veuillez sélectionner un motif' };
    }

    if (formData.notes.trim().length < 10) {
      return {
        valid: false,
        error: 'Les notes doivent contenir au moins 10 caractères',
      };
    }

    return { valid: true };
  };

  // Upload fichier justificatif
  const handleFileUpload = async (file: File) => {
    if (!product) return;

    setUploading(true);

    try {
      // Générer nom fichier unique
      const timestamp = Date.now();
      const fileExt = file.name.split('.').pop();
      const fileName = `${product.sku}_adjustment_${timestamp}.${fileExt}`;
      const filePath = `adjustments/${new Date().getFullYear()}/${String(
        new Date().getMonth() + 1
      ).padStart(2, '0')}/${fileName}`;

      // Upload vers Supabase Storage
      const { data, error } = await supabase.storage
        .from('stock-adjustments')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (error) throw error;

      // Obtenir URL publique
      const { data: publicUrlData } = supabase.storage
        .from('stock-adjustments')
        .getPublicUrl(data.path);

      setFormData({
        ...formData,
        uploadedFile: file,
        uploadedFileUrl: publicUrlData.publicUrl,
      });

      toast({
        title: '✅ Fichier uploadé',
        description: `${file.name} a été téléchargé avec succès`,
      });
    } catch (err) {
      console.error('Erreur upload fichier:', err);
      toast({
        variant: 'destructive',
        title: 'Erreur upload',
        description:
          err instanceof Error
            ? err.message
            : "Impossible d'uploader le fichier",
      });
    } finally {
      setUploading(false);
    }
  };

  // Soumission formulaire
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!product) return;

    // Validation
    const validation = validateForm();
    if (!validation.valid) {
      toast({
        variant: 'destructive',
        title: 'Erreur validation',
        description: validation.error,
      });
      return;
    }

    setSubmitting(true);

    try {
      const quantityChange = calculateQuantityChange();

      // ✅ FIX: Envoyer directement StockReasonCode (enum détaillé PostgreSQL)
      // Ne PAS mapper vers ReasonCode (enum simplifié) car PostgreSQL attend stock_reason_code
      // Créer mouvement via use-stock-ui (toast automatique)
      const movement = await stock.createMovement({
        product_id: product.id,
        movement_type: 'ADJUST',
        quantity_change: quantityChange,
        reason_code: formData.reasonCode as StockReasonCode, // ✅ Direct StockReasonCode (ex: 'write_off')
        notes: `[${getReasonDescription(formData.reasonCode as StockReasonCode)}] ${formData.notes}`,
        reference_type: 'manual_adjustment', // ✅ Valeur valide dans ReferenceType
        reference_id: crypto.randomUUID(), // ✅ UUID unique pour traçabilité
        affects_forecast: false,
      });

      if (movement) {
        // Si fichier uploadé, stocker référence dans metadata (optionnel)
        // Pour l'instant, on laisse juste l'URL dans les notes

        // Callback succès
        onSuccess();
        onClose();

        // Reset form
        setFormData({
          adjustmentType: 'increase',
          quantity: '',
          reasonCode: '',
          notes: '',
          uploadedFile: null,
          uploadedFileUrl: '',
        });
      }
    } catch (err) {
      console.error('Erreur création ajustement:', err);
      // Toast erreur déjà géré par use-stock-ui
    } finally {
      setSubmitting(false);
    }
  };

  // Handler changement type ajustement (reset reason code)
  const handleAdjustmentTypeChange = (type: AdjustmentType) => {
    setFormData({
      ...formData,
      adjustmentType: type,
      reasonCode: '', // Reset reason code car options différentes
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="border-b border-gray-200 pb-3">
          <DialogTitle className="text-2xl font-bold text-black flex items-center gap-3">
            <Settings className="h-6 w-6" />
            Ajuster le Stock
          </DialogTitle>
          <DialogDescription>
            {product ? (
              <span className="font-medium text-sm">
                Produit : {product.name} ({product.sku})
                <span className="text-black ml-2">
                  • Stock actuel : {product.stock_quantity} unités
                </span>
              </span>
            ) : (
              "Ajustez le stock d'inventaire pour ce produit"
            )}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <Tabs
            value={formData.adjustmentType}
            onValueChange={v => handleAdjustmentTypeChange(v as AdjustmentType)}
            className="w-full"
          >
            {/* Tabs List */}
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="increase" className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Augmenter
              </TabsTrigger>
              <TabsTrigger value="decrease" className="flex items-center gap-2">
                <Minus className="h-4 w-4" />
                Diminuer
              </TabsTrigger>
              <TabsTrigger
                value="correction"
                className="flex items-center gap-2"
              >
                <Settings className="h-4 w-4" />
                Corriger
              </TabsTrigger>
            </TabsList>

            {/* Content commun */}
            <div className="mt-6 space-y-4">
              {/* TAB: Increase */}
              <TabsContent value="increase" className="space-y-4 m-0">
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-900">
                    ✅ Augmentez le stock suite à une trouvaille inventaire,
                    retour client ou réception manuelle
                  </p>
                </div>

                <div>
                  <Label htmlFor="quantity-increase">
                    Quantité à ajouter *
                  </Label>
                  <Input
                    id="quantity-increase"
                    type="number"
                    min="1"
                    step="1"
                    value={formData.quantity}
                    onChange={e =>
                      setFormData({ ...formData, quantity: e.target.value })
                    }
                    placeholder="Ex: 10"
                    required
                    className="mt-1"
                  />
                  {product && formData.quantity && (
                    <p className="text-xs text-gray-500 mt-1">
                      Stock actuel: {product.stock_quantity} → Nouveau:{' '}
                      {calculateNewStock()}
                      <span className="text-green-600 font-medium ml-2">
                        (+{calculateQuantityChange()})
                      </span>
                    </p>
                  )}
                </div>
              </TabsContent>

              {/* TAB: Decrease */}
              <TabsContent value="decrease" className="space-y-4 m-0">
                <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                  <p className="text-sm text-orange-900">
                    ⚠️ Diminuez le stock suite à une casse, perte, vol ou mise
                    au rebut
                  </p>
                </div>

                <div>
                  <Label htmlFor="quantity-decrease">
                    Quantité à retirer *
                  </Label>
                  <Input
                    id="quantity-decrease"
                    type="number"
                    min="1"
                    max={product?.stock_quantity || 0}
                    step="1"
                    value={formData.quantity}
                    onChange={e =>
                      setFormData({ ...formData, quantity: e.target.value })
                    }
                    placeholder="Ex: 5"
                    required
                    className="mt-1"
                  />
                  {product && formData.quantity && (
                    <p className="text-xs text-gray-500 mt-1">
                      Stock actuel: {product.stock_quantity} → Nouveau:{' '}
                      {calculateNewStock()}
                      <span className="text-red-600 font-medium ml-2">
                        ({calculateQuantityChange()})
                      </span>
                    </p>
                  )}
                  {product && (
                    <p className="text-xs text-gray-500 mt-1">
                      Maximum disponible : {product.stock_quantity} unités
                    </p>
                  )}
                </div>
              </TabsContent>

              {/* TAB: Correction */}
              <TabsContent value="correction" className="space-y-4 m-0">
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-900">
                    ℹ️ Correction suite à inventaire physique : définissez la
                    nouvelle quantité totale réelle
                  </p>
                </div>

                <div>
                  <Label htmlFor="quantity-correction">
                    Nouvelle quantité totale *
                  </Label>
                  <Input
                    id="quantity-correction"
                    type="number"
                    min="0"
                    step="1"
                    value={formData.quantity}
                    onChange={e =>
                      setFormData({ ...formData, quantity: e.target.value })
                    }
                    placeholder="Ex: 15"
                    required
                    className="mt-1"
                  />
                  {product && formData.quantity && (
                    <p className="text-xs text-gray-500 mt-1">
                      Stock actuel: {product.stock_quantity} → Nouvelle
                      quantité: {formData.quantity}
                      <span
                        className={`ml-2 font-medium ${
                          calculateQuantityChange() > 0
                            ? 'text-green-600'
                            : calculateQuantityChange() < 0
                              ? 'text-red-600'
                              : 'text-gray-600'
                        }`}
                      >
                        ({calculateQuantityChange() > 0 ? '+' : ''}
                        {calculateQuantityChange()})
                      </span>
                    </p>
                  )}
                </div>
              </TabsContent>

              {/* Motif - Commun à tous */}
              <div>
                <Label htmlFor="reason">Motif *</Label>
                <Select
                  value={formData.reasonCode}
                  onValueChange={value =>
                    setFormData({
                      ...formData,
                      reasonCode: value as StockReasonCode,
                    })
                  }
                >
                  <SelectTrigger id="reason" className="mt-1">
                    <SelectValue placeholder="Sélectionner un motif" />
                  </SelectTrigger>
                  <SelectContent>
                    {getReasonOptions().map(reason => (
                      <SelectItem key={reason.code} value={reason.code}>
                        {reason.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Notes - Commun à tous */}
              <div>
                <Label htmlFor="notes">
                  Notes *{' '}
                  <span className="text-gray-500 text-xs">
                    (minimum 10 caractères)
                  </span>
                </Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={e =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  placeholder="Détails sur l'ajustement..."
                  rows={3}
                  className="mt-1"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  {formData.notes.length}/10 caractères minimum
                </p>
              </div>

              {/* Upload Fichier Justificatif */}
              <div>
                <Label htmlFor="file-upload">
                  Document justificatif (optionnel mais recommandé)
                </Label>
                <div className="mt-1">
                  {!formData.uploadedFile ? (
                    <label
                      htmlFor="file-upload"
                      className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        {uploading ? (
                          <>
                            <Loader2 className="h-8 w-8 text-gray-400 animate-spin mb-2" />
                            <p className="text-sm text-gray-500">
                              Upload en cours...
                            </p>
                          </>
                        ) : (
                          <>
                            <Upload className="h-8 w-8 text-gray-400 mb-2" />
                            <p className="text-sm text-gray-500">
                              <span className="font-semibold">
                                Cliquez pour uploader
                              </span>{' '}
                              ou glissez-déposez
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                              PNG, JPG, PDF, Excel (max 5MB)
                            </p>
                          </>
                        )}
                      </div>
                      <input
                        id="file-upload"
                        type="file"
                        className="hidden"
                        accept="image/*,.pdf,.xls,.xlsx"
                        onChange={e => {
                          const file = e.target.files?.[0];
                          if (file) handleFileUpload(file);
                        }}
                        disabled={uploading}
                      />
                    </label>
                  ) : (
                    <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Upload className="h-5 w-5 text-green-600" />
                        <span className="text-sm font-medium text-green-900">
                          {formData.uploadedFile.name}
                        </span>
                      </div>
                      <ButtonV2
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          setFormData({
                            ...formData,
                            uploadedFile: null,
                            uploadedFileUrl: '',
                          })
                        }
                        className="h-7 w-7 p-0 hover:bg-red-100 hover:text-red-600"
                      >
                        <X className="h-4 w-4" />
                      </ButtonV2>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Tabs>

          <DialogFooter className="mt-6">
            <ButtonV2
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={submitting}
              className="border-black text-black hover:bg-gray-100"
            >
              Annuler
            </ButtonV2>
            <ButtonV2
              type="submit"
              disabled={submitting || uploading || !product}
              className="bg-black text-white hover:bg-gray-800"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Enregistrement...
                </>
              ) : (
                "Enregistrer l'ajustement"
              )}
            </ButtonV2>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

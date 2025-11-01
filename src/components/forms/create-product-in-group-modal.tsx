'use client';

import { useState } from 'react';
import { Plus, Sparkles, AlertCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { ButtonV2 } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import type { VariantGroup, VariantType } from '@/types/variant-groups';
import { DynamicColorSelector } from '@/components/business/DynamicColorSelector';
import { useGroupUsedColors } from '@/hooks/use-product-colors';
import { useToast } from '@/hooks/use-toast';

interface CreateProductInGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  variantGroup: VariantGroup;
  onProductCreated: () => void;
  onCreateProduct: (variantValue: string) => Promise<boolean>;
}

const variantTypeLabels: Record<
  VariantType,
  { singular: string; plural: string; placeholder: string; emoji: string }
> = {
  color: {
    singular: 'Couleur',
    plural: 'couleurs',
    placeholder: 'Rouge',
    emoji: '🎨',
  },
  material: {
    singular: 'Matériau',
    plural: 'matériaux',
    placeholder: 'Coton',
    emoji: '🧵',
  },
};

export function CreateProductInGroupModal({
  isOpen,
  onClose,
  variantGroup,
  onProductCreated,
  onCreateProduct,
}: CreateProductInGroupModalProps) {
  const [variantValue, setVariantValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const variantType = variantGroup.variant_type || 'color';
  const typeInfo = variantTypeLabels[variantType];

  // Récupérer les couleurs déjà utilisées dans ce groupe
  const { usedColors } = useGroupUsedColors(variantGroup.id, variantType);

  // Nom prévisualisé du produit
  const previewName = variantValue
    ? `${variantGroup.name} - ${variantValue}`
    : `${variantGroup.name} - ...`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!variantValue.trim()) return;

    // ✅ VALIDATION ANTI-DOUBLON
    const normalizedValue = variantValue.trim().toLowerCase();
    if (usedColors.includes(normalizedValue)) {
      const errorMsg =
        variantType === 'color'
          ? `Un produit avec la couleur "${variantValue}" existe déjà dans ce groupe. Chaque produit doit avoir une couleur unique.`
          : `Un produit avec le matériau "${variantValue}" existe déjà dans ce groupe. Chaque produit doit avoir un matériau unique.`;

      setError(errorMsg);
      toast({
        title: 'Doublon détecté',
        description: errorMsg,
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    const success = await onCreateProduct(variantValue.trim());

    if (success) {
      setVariantValue('');
      setError(null);
      onProductCreated();
      onClose();
    }

    setLoading(false);
  };

  const handleClose = () => {
    if (!loading) {
      setVariantValue('');
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-light">
            <Sparkles className="h-5 w-5 text-gray-700" />
            Créer un nouveau produit
          </DialogTitle>
          <DialogDescription>
            Groupe: <span className="font-medium">{variantGroup.name}</span>
          </DialogDescription>
          <Badge variant="outline" className="w-fit">
            {typeInfo.emoji} {typeInfo.singular}
          </Badge>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 pt-4">
          {/* Input variante */}
          <div className="space-y-3">
            {variantType === 'color' ? (
              // Sélecteur de couleurs dynamique avec filtrage
              <DynamicColorSelector
                value={variantValue}
                onChange={setVariantValue}
                required={true}
                excludeColors={usedColors}
                placeholder={`Rechercher ou créer une ${typeInfo.singular.toLowerCase()}...`}
              />
            ) : (
              // Input classique pour autres types (material, size, pattern)
              <>
                <Label htmlFor="variant_value" className="text-sm font-medium">
                  Valeur de la variante <span className="text-red-500">*</span>
                </Label>
                <p className="text-xs text-gray-600">
                  Indiquez la {typeInfo.singular.toLowerCase()} de ce produit.
                  Le nom sera généré automatiquement.
                </p>
                <Input
                  id="variant_value"
                  type="text"
                  placeholder={`Ex: ${typeInfo.placeholder}`}
                  value={variantValue}
                  onChange={e => setVariantValue(e.target.value)}
                  autoFocus
                  className="text-base"
                />
              </>
            )}
          </div>

          {/* Message d'erreur anti-doublon */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-red-800">{error}</div>
            </div>
          )}

          {/* Prévisualisation */}
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg space-y-2">
            <Label className="text-xs font-medium text-blue-900">
              ✨ Nom généré automatiquement
            </Label>
            <p className="font-medium text-blue-900">{previewName}</p>
            <p className="text-xs text-blue-700">
              Ce produit héritera automatiquement des dimensions et du poids
              définis dans le groupe.
            </p>
          </div>

          {/* Attributs communs */}
          {(variantGroup.common_dimensions || variantGroup.common_weight) && (
            <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
              <Label className="text-xs font-medium text-gray-700 mb-2 block">
                📦 Attributs hérités du groupe
              </Label>
              <div className="space-y-1 text-xs text-gray-600">
                {variantGroup.common_dimensions && (
                  <div>
                    <span className="font-medium">Dimensions:</span>{' '}
                    {variantGroup.common_dimensions.length || '-'} ×{' '}
                    {variantGroup.common_dimensions.width || '-'} ×{' '}
                    {variantGroup.common_dimensions.height || '-'}{' '}
                    {variantGroup.common_dimensions.unit}
                  </div>
                )}
                {variantGroup.common_weight && (
                  <div>
                    <span className="font-medium">Poids:</span>{' '}
                    {variantGroup.common_weight} kg
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Info */}
          <div className="p-3 bg-gray-50 border border-gray-300 rounded-lg">
            <p className="text-xs text-gray-900">
              ℹ️ Le produit sera créé en statut{' '}
              <strong>prêt à commander</strong>. Vous pourrez compléter les
              autres informations (prix, stock, images) directement dans sa
              fiche produit.
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t">
            <ButtonV2
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={loading}
            >
              Annuler
            </ButtonV2>
            <ButtonV2
              type="submit"
              disabled={!variantValue.trim() || loading}
              className="bg-black text-white hover:bg-gray-800"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Création...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Créer le produit
                </>
              )}
            </ButtonV2>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

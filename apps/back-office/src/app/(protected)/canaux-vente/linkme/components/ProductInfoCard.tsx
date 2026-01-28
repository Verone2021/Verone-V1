'use client';

import { useState, useEffect, useMemo } from 'react';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Textarea,
  Label,
  Button,
  Badge,
  Progress,
} from '@verone/ui';
import { cn } from '@verone/utils';
import {
  FileText,
  X,
  Plus,
  Save,
  Loader2,
  Copy,
  Check,
  AlertCircle,
} from 'lucide-react';

import type { LinkMeProductDetail, LinkMeMetadataUpdate } from '../types';
import { calculateCompleteness } from '../types';

interface ProductInfoCardProps {
  product: LinkMeProductDetail;
  onSave: (data: LinkMeMetadataUpdate) => Promise<void>;
  isSaving?: boolean;
}

export function ProductInfoCard({
  product,
  onSave,
  isSaving = false,
}: ProductInfoCardProps) {
  const [formData, setFormData] = useState<LinkMeMetadataUpdate>({
    custom_title: product.custom_title,
    custom_description: product.custom_description,
    custom_selling_points: product.custom_selling_points,
  });

  const [newPoint, setNewPoint] = useState('');
  const [isDirty, setIsDirty] = useState(false);

  // Reset form when product changes
  useEffect(() => {
    setFormData({
      custom_title: product.custom_title,
      custom_description: product.custom_description,
      custom_selling_points: product.custom_selling_points,
    });
    setIsDirty(false);
  }, [product]);

  // Calcul de la complétude
  const completeness = useMemo(() => {
    // Créer un objet temporaire avec les valeurs du formulaire pour calculer la complétude en temps réel
    const tempProduct = {
      ...product,
      custom_title: formData.custom_title ?? null,
      custom_description: formData.custom_description ?? null,
      custom_selling_points: formData.custom_selling_points ?? null,
    };
    return calculateCompleteness(tempProduct);
  }, [product, formData]);

  // Handlers
  const handleAddPoint = () => {
    if (!newPoint.trim()) return;
    const currentPoints = formData.custom_selling_points || [];
    setFormData(prev => ({
      ...prev,
      custom_selling_points: [...currentPoints, newPoint.trim()],
    }));
    setNewPoint('');
    setIsDirty(true);
  };

  const handleRemovePoint = (index: number) => {
    const currentPoints = formData.custom_selling_points || [];
    setFormData(prev => ({
      ...prev,
      custom_selling_points: currentPoints.filter((_, i) => i !== index),
    }));
    setIsDirty(true);
  };

  const handleSave = async () => {
    await onSave(formData);
    setIsDirty(false);
  };

  // Handler pour copier la valeur source
  const handleCopyTitle = () => {
    setFormData(prev => ({
      ...prev,
      custom_title: product.name,
    }));
    setIsDirty(true);
  };

  const handleCopyDescription = () => {
    if (product.source_description) {
      setFormData(prev => ({
        ...prev,
        custom_description: product.source_description,
      }));
      setIsDirty(true);
    }
  };

  const handleCopySellingPoints = () => {
    if (
      product.source_selling_points &&
      product.source_selling_points.length > 0
    ) {
      setFormData(prev => ({
        ...prev,
        custom_selling_points: [...product.source_selling_points!],
      }));
      setIsDirty(true);
    }
  };

  // Vérifier si une valeur est définie (validée)
  const isTitleValid = !!formData.custom_title;
  const isDescriptionValid = !!formData.custom_description;
  const isSellingPointsValid =
    formData.custom_selling_points && formData.custom_selling_points.length > 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Informations personnalisées
          </CardTitle>
          {/* Badge de complétude */}
          <Badge
            variant={completeness.percentage === 100 ? 'success' : 'secondary'}
            className="text-sm"
          >
            {completeness.percentage}% complet
          </Badge>
        </div>
        {/* Barre de progression */}
        <Progress value={completeness.percentage} className="h-2 mt-2" />
        <p className="text-xs text-muted-foreground mt-1">
          {completeness.completedCount}/{completeness.totalCount} champs validés
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Titre custom */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="custom-title" className="flex items-center gap-2">
              Titre
              {isTitleValid ? (
                <Check className="h-4 w-4 text-green-600" />
              ) : (
                <AlertCircle className="h-4 w-4 text-amber-500" />
              )}
            </Label>
            {!isTitleValid && product.name && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopyTitle}
                className="h-7 text-xs text-purple-600 hover:text-purple-700"
              >
                <Copy className="h-3 w-3 mr-1" />
                Copier depuis produit
              </Button>
            )}
          </div>
          <Input
            id="custom-title"
            value={formData.custom_title ?? ''}
            onChange={e => {
              setFormData(prev => ({
                ...prev,
                custom_title: e.target.value ?? null,
              }));
              setIsDirty(true);
            }}
            placeholder={product.name}
            className={cn(
              !isTitleValid && 'border-amber-300 focus:border-amber-500'
            )}
          />
          {!isTitleValid && (
            <p className="text-xs text-amber-600 flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              Non validé - Copiez ou saisissez un titre
            </p>
          )}
        </div>

        {/* Description custom */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label
              htmlFor="custom-description"
              className="flex items-center gap-2"
            >
              Description
              {isDescriptionValid ? (
                <Check className="h-4 w-4 text-green-600" />
              ) : (
                <AlertCircle className="h-4 w-4 text-amber-500" />
              )}
            </Label>
            {!isDescriptionValid && product.source_description && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopyDescription}
                className="h-7 text-xs text-purple-600 hover:text-purple-700"
              >
                <Copy className="h-3 w-3 mr-1" />
                Copier depuis produit
              </Button>
            )}
          </div>

          {/* Aperçu valeur source si disponible et non validée */}
          {!isDescriptionValid && product.source_description && (
            <div className="bg-gray-50 border border-dashed border-gray-300 rounded-lg p-3">
              <p className="text-xs text-gray-500 mb-1 font-medium">
                Valeur par défaut depuis le produit :
              </p>
              <p className="text-sm text-gray-700 line-clamp-3">
                {product.source_description}
              </p>
            </div>
          )}

          <Textarea
            id="custom-description"
            value={formData.custom_description ?? ''}
            onChange={e => {
              setFormData(prev => ({
                ...prev,
                custom_description: e.target.value ?? null,
              }));
              setIsDirty(true);
            }}
            placeholder="Description spécifique pour LinkMe..."
            rows={4}
            className={cn(
              !isDescriptionValid && 'border-amber-300 focus:border-amber-500'
            )}
          />
          {!isDescriptionValid && (
            <p className="text-xs text-amber-600 flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              Non validé - Copiez ou saisissez une description
            </p>
          )}
        </div>

        {/* Points de vente */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="flex items-center gap-2">
              Arguments de vente
              {isSellingPointsValid ? (
                <Check className="h-4 w-4 text-green-600" />
              ) : (
                <AlertCircle className="h-4 w-4 text-amber-500" />
              )}
            </Label>
            {!isSellingPointsValid &&
              product.source_selling_points &&
              product.source_selling_points.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCopySellingPoints}
                  className="h-7 text-xs text-purple-600 hover:text-purple-700"
                >
                  <Copy className="h-3 w-3 mr-1" />
                  Copier depuis produit ({product.source_selling_points.length})
                </Button>
              )}
          </div>

          {/* Aperçu valeurs sources si disponibles et non validées */}
          {!isSellingPointsValid &&
            product.source_selling_points &&
            product.source_selling_points.length > 0 && (
              <div className="bg-gray-50 border border-dashed border-gray-300 rounded-lg p-3">
                <p className="text-xs text-gray-500 mb-2 font-medium">
                  Arguments par défaut depuis le produit :
                </p>
                <ul className="space-y-1">
                  {product.source_selling_points.map((point, idx) => (
                    <li
                      key={idx}
                      className="text-sm text-gray-700 flex items-start gap-2"
                    >
                      <span className="text-gray-400">•</span>
                      <span className="line-clamp-1">{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

          <div className="space-y-2">
            {(formData.custom_selling_points || []).map((point, index) => (
              <div
                key={index}
                className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg px-3 py-2"
              >
                <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                <span className="flex-1 text-sm">{point}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => handleRemovePoint(index)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>

          {/* Ajouter un point */}
          <div className="flex gap-2">
            <Input
              value={newPoint}
              onChange={e => setNewPoint(e.target.value)}
              placeholder="Nouvel argument de vente..."
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddPoint();
                }
              }}
            />
            <Button
              variant="outline"
              size="icon"
              onClick={handleAddPoint}
              disabled={!newPoint.trim()}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {!isSellingPointsValid && (
            <p className="text-xs text-amber-600 flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              Non validé - Copiez ou ajoutez des arguments de vente
            </p>
          )}
        </div>

        {/* Bouton sauvegarde */}
        <Button
          onClick={() => {
            void handleSave().catch(error => {
              console.error('[ProductInfoCard] handleSave failed:', error);
            });
          }}
          disabled={!isDirty || isSaving}
          className="w-full"
        >
          {isSaving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Enregistrement...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Enregistrer les informations
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}

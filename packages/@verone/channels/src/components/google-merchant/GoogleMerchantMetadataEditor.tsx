'use client';

import { useState, useEffect } from 'react';

import { FileText, Eye, AlertCircle } from 'lucide-react';

import { Badge } from '@verone/ui';
import { ButtonV2 } from '@verone/ui';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@verone/ui';
import { Input } from '@verone/ui';
import { Label } from '@verone/ui';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@verone/ui';
import { Textarea } from '@verone/ui';
import { cn } from '@verone/utils';

/**
 * Props pour GoogleMerchantMetadataEditor
 */
export interface GoogleMerchantMetadataEditorProps {
  /** Produit à éditer */
  product: {
    id: string;
    name: string;
    sku: string;
    description?: string | null;
    custom_title?: string | null;
    custom_description?: string | null;
  };
  /** Callback lors de la sauvegarde */
  onSave: (
    productId: string,
    metadata: { title: string; description: string }
  ) => void;
  /** Callback lors de l'annulation */
  onCancel: () => void;
  /** État d'ouverture du modal */
  open: boolean;
}

/**
 * Composant: GoogleMerchantMetadataEditor
 *
 * Modal pour éditer les métadonnées (titre + description) d'un produit Google Merchant.
 * Features:
 * - Titre actuel vs custom
 * - Input titre (max 150 chars avec counter)
 * - Description actuelle vs custom
 * - Textarea description (max 5000 chars avec counter)
 * - Split view: Edit / Preview
 * - Real-time preview Google Shopping card
 *
 * Design System V2:
 * - Primary color: #3b86d1
 * - Subtle borders, rounded corners
 * - Character counters avec color feedback
 *
 * @example
 * <GoogleMerchantMetadataEditor
 *   product={product}
 *   onSave={(id, meta) => updateMetadata(id, meta)}
 *   onCancel={() => setEditing(false)}
 *   open={isEditing}
 * />
 */
export function GoogleMerchantMetadataEditor({
  product,
  onSave,
  onCancel,
  open,
}: GoogleMerchantMetadataEditorProps) {
  const MAX_TITLE_LENGTH = 150;
  const MAX_DESCRIPTION_LENGTH = 5000;

  // Titres/descriptions actuels
  const currentTitle = product.custom_title ?? product.name;
  const currentDescription =
    product.custom_description ?? product.description ?? '';

  // State pour nouveaux champs
  const [newTitle, setNewTitle] = useState<string>(currentTitle);
  const [newDescription, setNewDescription] =
    useState<string>(currentDescription);
  const [errors, setErrors] = useState<{
    title?: string;
    description?: string;
  }>({});

  // Reset state quand modal s'ouvre
  useEffect(() => {
    if (open) {
      setNewTitle(currentTitle);
      setNewDescription(currentDescription);
      setErrors({});
    }
  }, [open, currentTitle, currentDescription]);

  // Validation
  const validate = (): boolean => {
    const newErrors: { title?: string; description?: string } = {};

    if (newTitle.trim().length === 0) {
      newErrors.title = 'Le titre est requis';
    } else if (newTitle.length > MAX_TITLE_LENGTH) {
      newErrors.title = `Maximum ${MAX_TITLE_LENGTH} caractères`;
    }

    if (newDescription.length > MAX_DESCRIPTION_LENGTH) {
      newErrors.description = `Maximum ${MAX_DESCRIPTION_LENGTH} caractères`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handler sauvegarde
  const handleSave = () => {
    if (validate()) {
      onSave(product.id, {
        title: newTitle.trim(),
        description: newDescription.trim(),
      });
    }
  };

  // Char count helpers avec color
  const getTitleCountColor = () => {
    const remaining = MAX_TITLE_LENGTH - newTitle.length;
    if (remaining < 0) return 'text-[#ff4d6b]'; // Danger
    if (remaining < 20) return 'text-[#ff9b3e]'; // Warning
    return 'text-gray-500';
  };

  const getDescriptionCountColor = () => {
    const remaining = MAX_DESCRIPTION_LENGTH - newDescription.length;
    if (remaining < 0) return 'text-[#ff4d6b]'; // Danger
    if (remaining < 100) return 'text-[#ff9b3e]'; // Warning
    return 'text-gray-500';
  };

  return (
    <Dialog open={open} onOpenChange={isOpen => !isOpen && onCancel()}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-black">
            Modifier les métadonnées Google Merchant
          </DialogTitle>
          <DialogDescription className="text-gray-600">
            {product.name}
            <span className="block text-sm text-gray-500 font-mono mt-1">
              SKU: {product.sku}
            </span>
          </DialogDescription>
        </DialogHeader>

        <Tabs
          defaultValue="edit"
          className="flex-1 overflow-hidden flex flex-col"
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="edit" className="gap-2">
              <FileText className="h-4 w-4" />
              Édition
            </TabsTrigger>
            <TabsTrigger value="preview" className="gap-2">
              <Eye className="h-4 w-4" />
              Preview
            </TabsTrigger>
          </TabsList>

          {/* Tab Édition */}
          <TabsContent
            value="edit"
            className="flex-1 overflow-y-auto space-y-4 mt-4"
          >
            {/* Titre */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label
                  htmlFor="custom-title"
                  className="text-sm font-medium text-gray-700"
                >
                  Titre
                </Label>
                <span className={cn('text-xs font-mono', getTitleCountColor())}>
                  {newTitle.length}/{MAX_TITLE_LENGTH}
                </span>
              </div>

              <Input
                id="custom-title"
                type="text"
                value={newTitle}
                onChange={e => {
                  setNewTitle(e.target.value);
                  if (errors.title) setErrors({ ...errors, title: undefined });
                }}
                className={cn(
                  'border-2',
                  errors.title
                    ? 'border-red-300 focus:border-red-500'
                    : 'border-gray-200 focus:border-[#3b86d1]'
                )}
                placeholder="Titre du produit sur Google Shopping"
                aria-label="Titre custom"
                aria-invalid={!!errors.title}
                aria-describedby={errors.title ? 'title-error' : undefined}
              />

              {errors.title && (
                <div
                  id="title-error"
                  className="flex items-center gap-2 text-sm text-red-600"
                  role="alert"
                >
                  <AlertCircle className="h-4 w-4" />
                  <span>{errors.title}</span>
                </div>
              )}

              {/* Badge source */}
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <span>Source:</span>
                <Badge
                  variant="outline"
                  className={cn(
                    'border-2',
                    product.custom_title
                      ? 'border-[#3b86d1] text-[#3b86d1] bg-blue-50'
                      : 'border-gray-300 text-gray-600 bg-gray-100'
                  )}
                >
                  {product.custom_title ? 'Titre custom' : 'Nom produit'}
                </Badge>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label
                  htmlFor="custom-description"
                  className="text-sm font-medium text-gray-700"
                >
                  Description
                </Label>
                <span
                  className={cn(
                    'text-xs font-mono',
                    getDescriptionCountColor()
                  )}
                >
                  {newDescription.length}/{MAX_DESCRIPTION_LENGTH}
                </span>
              </div>

              <Textarea
                id="custom-description"
                value={newDescription}
                onChange={e => {
                  setNewDescription(e.target.value);
                  if (errors.description)
                    setErrors({ ...errors, description: undefined });
                }}
                className={cn(
                  'min-h-[200px] resize-y border-2',
                  errors.description
                    ? 'border-red-300 focus:border-red-500'
                    : 'border-gray-200 focus:border-[#3b86d1]'
                )}
                placeholder="Description détaillée du produit pour Google Shopping..."
                aria-label="Description custom"
                aria-invalid={!!errors.description}
                aria-describedby={
                  errors.description ? 'description-error' : undefined
                }
              />

              {errors.description && (
                <div
                  id="description-error"
                  className="flex items-center gap-2 text-sm text-red-600"
                  role="alert"
                >
                  <AlertCircle className="h-4 w-4" />
                  <span>{errors.description}</span>
                </div>
              )}

              {/* Badge source */}
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <span>Source:</span>
                <Badge
                  variant="outline"
                  className={cn(
                    'border-2',
                    product.custom_description
                      ? 'border-[#3b86d1] text-[#3b86d1] bg-blue-50'
                      : 'border-gray-300 text-gray-600 bg-gray-100'
                  )}
                >
                  {product.custom_description
                    ? 'Description custom'
                    : 'Description produit'}
                </Badge>
              </div>
            </div>
          </TabsContent>

          {/* Tab Preview */}
          <TabsContent value="preview" className="flex-1 overflow-y-auto mt-4">
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-6 border-2 border-[#3b86d1]">
              <div className="bg-white rounded-lg shadow-lg p-6 max-w-md mx-auto">
                <div className="space-y-4">
                  {/* Preview Google Shopping Card */}
                  <div className="aspect-square bg-gray-100 rounded-md flex items-center justify-center">
                    <span className="text-gray-400 text-sm">Image produit</span>
                  </div>

                  <div className="space-y-2">
                    <h3 className="font-semibold text-lg text-black line-clamp-2">
                      {newTitle || 'Titre du produit'}
                    </h3>

                    <p className="text-sm text-gray-600 line-clamp-3">
                      {newDescription || 'Description du produit...'}
                    </p>

                    <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                      <span className="text-xs text-gray-500">
                        SKU: {product.sku}
                      </span>
                      <Badge
                        variant="outline"
                        className="border-[#38ce3c] text-[#38ce3c]"
                      >
                        En stock
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>

              <p className="text-center text-sm text-gray-600 mt-4">
                Preview approximatif de votre produit sur Google Shopping
              </p>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter className="gap-2 mt-4">
          <ButtonV2
            type="button"
            variant="outline"
            onClick={onCancel}
            className="border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            Annuler
          </ButtonV2>
          <ButtonV2
            type="button"
            onClick={handleSave}
            disabled={Object.keys(errors).length > 0}
            className="bg-[#3b86d1] hover:bg-[#2a75c0] text-white"
          >
            Mettre à jour
          </ButtonV2>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

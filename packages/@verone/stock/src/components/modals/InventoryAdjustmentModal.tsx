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

import { Plus, Minus, Settings, Loader2, AlertCircle } from 'lucide-react';

import { Button } from '@verone/ui';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@verone/ui';
import { Tabs, TabsList, TabsTrigger } from '@verone/ui';

import type {
  AdjustmentType,
  InventoryAdjustmentModalProps,
} from './inventory-adjustment.types';
import { AdjustmentFileUpload } from './AdjustmentFileUpload';
import { AdjustmentTabsContent } from './AdjustmentTabsContent';
import { useInventoryAdjustment } from './use-inventory-adjustment';

export function InventoryAdjustmentModal({
  isOpen,
  onClose,
  onSuccess,
  product,
}: InventoryAdjustmentModalProps) {
  const {
    formData,
    setFormData,
    submitting,
    uploading,
    formError,
    calculateQuantityChange,
    calculateNewStock,
    getReasonOptions,
    handleFileUpload,
    handleSubmit,
    handleAdjustmentTypeChange,
    clearUploadedFile,
  } = useInventoryAdjustment(isOpen, product, onSuccess, onClose);

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

        <form
          onSubmit={e => {
            void handleSubmit(e).catch((err: unknown) => {
              console.error('[InventoryAdjustmentModal] Submit failed:', err);
            });
          }}
        >
          <Tabs
            value={formData.adjustmentType}
            onValueChange={v => handleAdjustmentTypeChange(v as AdjustmentType)}
            className="w-full"
          >
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

            <AdjustmentTabsContent
              formData={formData}
              setFormData={setFormData}
              product={product}
              calculateQuantityChange={calculateQuantityChange}
              calculateNewStock={calculateNewStock}
              getReasonOptions={getReasonOptions}
            />
          </Tabs>

          <div className="mt-4">
            <AdjustmentFileUpload
              uploadedFile={formData.uploadedFile}
              uploading={uploading}
              onFileChange={file => {
                void handleFileUpload(file).catch((err: unknown) => {
                  console.error(
                    '[InventoryAdjustmentModal] File upload failed:',
                    err
                  );
                });
              }}
              onClear={clearUploadedFile}
            />
          </div>

          {formError && (
            <div className="mt-4 flex items-start gap-2 p-3 rounded-md bg-red-50 border border-red-200">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-800">{formError}</p>
            </div>
          )}

          <DialogFooter className="mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={submitting}
              className="border-black text-black hover:bg-gray-100"
            >
              Annuler
            </Button>
            <Button
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
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

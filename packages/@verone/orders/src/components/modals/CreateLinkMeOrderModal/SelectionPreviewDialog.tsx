'use client';

import { CloudflareImage } from '@verone/ui';
import { X, Package, Loader2 } from 'lucide-react';

import type { SelectionDetail } from '../../../hooks/linkme/use-linkme-selections';

interface SelectionPreviewDialogProps {
  previewSelection: SelectionDetail | null | undefined;
  previewLoading: boolean;
  onClose: () => void;
}

export function SelectionPreviewDialog({
  previewSelection,
  previewLoading,
  onClose,
}: SelectionPreviewDialogProps) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold text-lg">
            Aperçu : {previewSelection?.name ?? 'Chargement...'}
          </h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Contenu */}
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
                const sellingPrice =
                  item.selling_price_ht ??
                  item.base_price_ht * (1 + (item.margin_rate ?? 0) / 100);
                return (
                  <div
                    key={item.id}
                    className="border rounded-lg p-2 bg-gray-50 hover:bg-gray-100 transition-colors"
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
                      {sellingPrice.toFixed(2)}€
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm transition-colors"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}

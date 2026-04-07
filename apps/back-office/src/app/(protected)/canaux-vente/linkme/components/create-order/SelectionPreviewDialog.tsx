'use client';

import Image from 'next/image';
import { X, Package, Loader2 } from 'lucide-react';

interface SelectionPreviewItem {
  id: string;
  product_id: string;
  product_image_url?: string | null;
  base_price_ht: number;
  product?: {
    name?: string;
    sku?: string;
  } | null;
}

interface SelectionPreviewDialogProps {
  selectionName: string | undefined;
  items: SelectionPreviewItem[] | undefined;
  isLoading: boolean;
  onClose: () => void;
}

export function SelectionPreviewDialog({
  selectionName,
  items,
  isLoading,
  onClose,
}: SelectionPreviewDialogProps) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden mx-4">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold text-lg">
            Aperçu : {selectionName ?? 'Chargement...'}
          </h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-4 overflow-y-auto max-h-[60vh]">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-purple-600" />
            </div>
          ) : !items?.length ? (
            <div className="text-center py-8 text-gray-500">
              Aucun produit dans cette sélection
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {items.map(item => (
                <div
                  key={item.id}
                  className="rounded-lg border border-gray-200 overflow-hidden"
                >
                  {item.product_image_url ? (
                    <Image
                      src={item.product_image_url}
                      alt={item.product?.name ?? ''}
                      width={200}
                      height={150}
                      className="w-full h-32 object-cover"
                    />
                  ) : (
                    <div className="w-full h-32 bg-gray-100 flex items-center justify-center">
                      <Package className="h-8 w-8 text-gray-300" />
                    </div>
                  )}
                  <div className="p-2">
                    <p className="text-sm font-medium truncate">
                      {item.product?.name ?? 'Produit'}
                    </p>
                    <p className="text-xs text-gray-500">
                      {item.base_price_ht.toFixed(2)}€ HT
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

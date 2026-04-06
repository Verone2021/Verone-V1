/* eslint-disable @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment */
'use client';

import { Badge, ButtonV2 } from '@verone/ui';
import { cn } from '@verone/utils';
import { Settings, Package } from 'lucide-react';

import { ProductImageGallery } from '../../images/ProductImageGallery';

interface ProductEditSidebarProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  product: any;
  completionPercentage: number;
  missingFields: string[];
  onShowImagesModal: () => void;
}

export function ProductEditSidebar({
  product,
  completionPercentage,
  missingFields,
  onShowImagesModal,
}: ProductEditSidebarProps) {
  return (
    <div className="xl:col-span-3 space-y-2">
      {/* Galerie d'images compacte */}
      <div className="bg-white border border-black">
        <ProductImageGallery
          productId={product.id}
          productName={product.name}
          productStatus={product.status}
          compact
        />
      </div>

      {/* Actions sous l'image */}
      <div className="bg-white border border-black p-2">
        <h3 className="font-medium mb-2 text-[10px]">Actions</h3>
        <div className="space-y-1">
          <ButtonV2
            variant="outline"
            size="sm"
            className="w-full justify-start text-[9px] h-5"
            onClick={onShowImagesModal}
          >
            <Settings className="h-2 w-2 mr-1" />
            Photos ({(product.images?.length as number | undefined) ?? 0})
          </ButtonV2>
        </div>
      </div>

      {/* Métadonnées système ultra-compact */}
      <div className="bg-white border border-black p-2">
        <h3 className="font-medium mb-2 flex items-center text-[10px]">
          <Package className="h-3 w-3 mr-1" />
          Métadonnées
        </h3>
        <div className="space-y-1 text-[9px]">
          <div className="flex justify-between">
            <span className="text-gray-600">ID:</span>
            <span className="font-mono">
              {String(product.id).slice(0, 6)}...
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Créé:</span>
            <span>
              {new Date(product.created_at as string).toLocaleDateString(
                'fr-FR',
                {
                  day: '2-digit',
                  month: '2-digit',
                }
              )}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">MAJ:</span>
            <span>
              {new Date(product.updated_at as string).toLocaleDateString(
                'fr-FR',
                {
                  day: '2-digit',
                  month: '2-digit',
                }
              )}
            </span>
          </div>
        </div>
      </div>

      {/* Status et progression compact */}
      <div className="bg-white border border-black p-2">
        <div className="space-y-2">
          <Badge
            className={cn(
              'text-[9px] px-1 py-0',
              product.status === 'active'
                ? 'bg-green-600 text-white'
                : product.status === 'draft'
                  ? 'bg-gray-100 text-white'
                  : 'bg-gray-600 text-white'
            )}
          >
            {product.status === 'active'
              ? 'Actif'
              : product.status === 'draft'
                ? 'Brouillon'
                : 'Archivé'}
          </Badge>
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[9px] text-gray-600">Complétude</span>
              <span className="text-[9px] font-medium">
                {completionPercentage}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-1">
              <div
                className="bg-black h-1 rounded-full transition-all"
                style={{ width: `${completionPercentage}%` }}
              />
            </div>
            {missingFields.length > 0 && (
              <p className="text-[8px] text-red-600 mt-1">
                Manque: {missingFields.slice(0, 2).join(', ')}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

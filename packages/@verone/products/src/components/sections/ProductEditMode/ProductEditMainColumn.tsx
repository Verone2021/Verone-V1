/* eslint-disable @typescript-eslint/no-unsafe-member-access */
'use client';

import {
  ButtonV2,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@verone/ui';
import { Settings, FileText, FolderTree, Truck } from 'lucide-react';

import type { ProductFormData, Supplier } from './types';

interface ProductEditMainColumnProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  product: any;
  formData: ProductFormData;
  suppliers: Supplier[];
  onFieldChange: (field: string, value: unknown) => void;
  onShowCategorizeModal: () => void;
  onShowDescriptionsModal: () => void;
  onShowCharacteristicsModal: () => void;
}

export function ProductEditMainColumn({
  product,
  formData,
  suppliers,
  onFieldChange,
  onShowCategorizeModal,
  onShowDescriptionsModal,
  onShowCharacteristicsModal,
}: ProductEditMainColumnProps) {
  return (
    <div className="xl:col-span-5 space-y-2">
      {/* Header produit */}
      <div className="bg-white border border-black p-2">
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1">
            <Label className="text-[9px] text-gray-600 mb-1 block">
              Nom du produit
            </Label>
            <Input
              value={formData.name}
              onChange={e => onFieldChange('name', e.target.value)}
              className="text-sm font-bold border-0 p-0 h-auto bg-transparent"
              placeholder="Nom du produit"
            />
            <div className="text-[9px] text-gray-600 mt-1">
              SKU: {String(product.sku ?? 'Auto-généré')}
            </div>
          </div>
          <ButtonV2 variant="outline" size="sm" className="h-5 text-[9px] px-1">
            <Settings className="h-2 w-2 mr-1" />
            Modifier
          </ButtonV2>
        </div>
      </div>

      {/* Informations générales */}
      <div className="bg-white border border-black p-2">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-medium flex items-center text-[10px]">
            <FileText className="h-3 w-3 mr-1" />
            Informations générales
          </h3>
          <ButtonV2 variant="outline" size="sm" className="h-5 text-[9px] px-1">
            <Settings className="h-2 w-2 mr-1" />
            Modifier
          </ButtonV2>
        </div>
        <div className="space-y-2">
          <div>
            <Label className="text-[9px] text-gray-600">Slug URL</Label>
            <Input
              value={formData.slug}
              onChange={e => onFieldChange('slug', e.target.value)}
              className="h-6 text-[10px]"
              placeholder="url-produit"
            />
          </div>
        </div>
      </div>

      {/* Catégorisation */}
      <div className="bg-white border border-black p-2">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-medium flex items-center text-[10px]">
            <FolderTree className="h-3 w-3 mr-1" />
            Catégorisation
          </h3>
          <ButtonV2
            variant="outline"
            size="sm"
            onClick={onShowCategorizeModal}
            className="h-5 text-[9px] px-1"
          >
            <Settings className="h-2 w-2 mr-1" />
            Modifier
          </ButtonV2>
        </div>

        {product.subcategory?.category?.family ||
        product.subcategory?.category ||
        product.subcategory ? (
          <div className="bg-gray-50 p-2 rounded border">
            <div className="flex items-center space-x-1 flex-wrap text-[9px]">
              {product.subcategory?.category?.family && (
                <>
                  <div className="flex items-center space-x-1 bg-green-100 px-1 py-0.5 rounded">
                    <span className="text-green-800 font-medium">
                      {product.subcategory.category.family.name}
                    </span>
                  </div>
                  <span className="text-gray-400">›</span>
                </>
              )}
              {product.subcategory?.category && (
                <>
                  <div className="flex items-center space-x-1 bg-blue-100 px-1 py-0.5 rounded">
                    <span className="text-blue-800 font-medium">
                      {product.subcategory.category.name}
                    </span>
                  </div>
                  <span className="text-gray-400">›</span>
                </>
              )}
              {product.subcategory && (
                <div className="flex items-center space-x-1 bg-purple-100 px-1 py-0.5 rounded">
                  <span className="text-purple-800 font-medium">
                    {product.subcategory.name}
                  </span>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-red-50 p-2 rounded border border-red-200">
            <p className="text-red-700 text-[9px]">
              Aucune catégorisation définie
            </p>
          </div>
        )}
      </div>

      {/* Fournisseur & Références */}
      <div className="bg-white border border-black p-2">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-medium flex items-center text-[10px]">
            <Truck className="h-3 w-3 mr-1" />
            Fournisseur & Références
          </h3>
          <ButtonV2 variant="outline" size="sm" className="h-5 text-[9px] px-1">
            <Settings className="h-2 w-2 mr-1" />
            Modifier
          </ButtonV2>
        </div>
        <div className="space-y-2">
          <div>
            <Label className="text-[9px] text-gray-600">Fournisseur</Label>
            <Select
              value={formData.supplier_id}
              onValueChange={value => onFieldChange('supplier_id', value)}
            >
              <SelectTrigger className="h-6 text-[10px]">
                <SelectValue placeholder="Sélectionner..." />
              </SelectTrigger>
              <SelectContent>
                {suppliers.map(supplier => (
                  <SelectItem
                    key={supplier.id}
                    value={supplier.id}
                    className="text-[10px]"
                  >
                    {supplier.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <div>
              <Label className="text-[9px] text-gray-600">
                Référence fournisseur
              </Label>
              <Input
                value={formData.supplier_reference}
                onChange={e =>
                  onFieldChange('supplier_reference', e.target.value)
                }
                className="h-6 text-[10px]"
                placeholder="REF-SUPP"
              />
            </div>
            <div>
              <Label className="text-[9px] text-gray-600">
                Page fournisseur
              </Label>
              <Input
                value={formData.supplier_page_url}
                onChange={e =>
                  onFieldChange('supplier_page_url', e.target.value)
                }
                className="h-6 text-[10px]"
                placeholder="https://..."
              />
            </div>
          </div>
        </div>
      </div>

      {/* Description */}
      <div className="bg-white border border-black p-2">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-medium text-[10px]">Description</h3>
          <ButtonV2
            variant="ghost"
            size="sm"
            onClick={onShowDescriptionsModal}
            className="h-5 text-[9px] px-1"
          >
            <Settings className="h-2 w-2 mr-1" />
            Modifier
          </ButtonV2>
        </div>
        <p className="text-[10px] text-gray-700 line-clamp-2">
          {String(product.description ?? 'Aucune description disponible')}
        </p>
      </div>

      {/* Caractéristiques */}
      <div className="bg-white border border-black p-2">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-medium text-[10px]">Caractéristiques</h3>
          <ButtonV2
            variant="ghost"
            size="sm"
            onClick={onShowCharacteristicsModal}
            className="h-5 text-[9px] px-1"
          >
            <Settings className="h-2 w-2 mr-1" />
            Modifier
          </ButtonV2>
        </div>
        <div className="space-y-1 text-[10px]">
          {product.color && (
            <div className="flex justify-between">
              <span className="text-gray-600">Couleur:</span>
              <span>{String(product.color)}</span>
            </div>
          )}
          {product.material && (
            <div className="flex justify-between">
              <span className="text-gray-600">Matière:</span>
              <span>{String(product.material)}</span>
            </div>
          )}
          {!product.color && !product.material && (
            <p className="text-gray-400 italic text-[9px]">
              Aucune caractéristique définie
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

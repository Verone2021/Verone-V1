'use client';

import { Badge, ButtonV2, CardTitle, Input, Label } from '@verone/ui';
import {
  AlertCircle,
  Building,
  Edit,
  ExternalLink,
  FileText,
  Link as LinkIcon,
  Package,
  Save,
  User,
  X,
} from 'lucide-react';

import type { InfoSectionData, SourcingProduct } from './types';

interface SourcingProductInfoSectionProps {
  product: SourcingProduct;
  isEditing: boolean;
  isSaving: boolean;
  editedData: InfoSectionData | null;
  error: string | null;
  hasChanges: boolean;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onUpdateData: (patch: Partial<InfoSectionData>) => void;
  onSave: () => Promise<void>;
}

export function SourcingProductInfoSection({
  product,
  isEditing,
  isSaving,
  editedData,
  error,
  hasChanges,
  onStartEdit,
  onCancelEdit,
  onUpdateData,
  onSave,
}: SourcingProductInfoSectionProps) {
  if (isEditing) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-gray-700 flex items-center">
            <FileText className="h-4 w-4 mr-2" />
            Informations Produit
          </h3>
          <div className="flex space-x-1">
            <ButtonV2
              variant="ghost"
              size="sm"
              onClick={onCancelEdit}
              disabled={isSaving}
            >
              <X className="h-4 w-4" />
            </ButtonV2>
            <ButtonV2
              variant="default"
              size="sm"
              onClick={() => void onSave()}
              disabled={isSaving || !hasChanges}
              className="bg-black hover:bg-gray-800 text-white"
            >
              {isSaving ? (
                <span className="animate-spin">⏳</span>
              ) : (
                <Save className="h-4 w-4" />
              )}
            </ButtonV2>
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <Label htmlFor="name" className="text-xs text-gray-600">
              Nom du produit *
            </Label>
            <Input
              id="name"
              value={editedData?.name ?? ''}
              onChange={e => onUpdateData({ name: e.target.value })}
              placeholder="Nom du produit"
              className="mt-1"
            />
          </div>
          <div>
            <Label
              htmlFor="supplier_page_url"
              className="text-xs text-gray-600"
            >
              URL page fournisseur
            </Label>
            <div className="relative mt-1">
              <LinkIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="supplier_page_url"
                type="url"
                value={editedData?.supplier_page_url ?? ''}
                onChange={e =>
                  onUpdateData({ supplier_page_url: e.target.value })
                }
                placeholder="https://fournisseur.com/produit/123"
                className="pl-10"
              />
            </div>
          </div>
          <div>
            <Label
              htmlFor="supplier_reference"
              className="text-xs text-gray-600"
            >
              Réf. fournisseur
            </Label>
            <Input
              id="supplier_reference"
              value={editedData?.supplier_reference ?? ''}
              onChange={e =>
                onUpdateData({ supplier_reference: e.target.value })
              }
              placeholder="ART-12345"
              className="mt-1"
            />
          </div>
        </div>

        {error && (
          <p className="text-sm text-red-600 flex items-center">
            <AlertCircle className="h-4 w-4 mr-1" />
            {error}
          </p>
        )}
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <CardTitle className="text-2xl text-black">{product.name}</CardTitle>
          <p className="text-gray-600 mt-1">
            <span className="font-medium">SKU:</span> {product.sku}
            {product.supplier_reference && (
              <span className="ml-3">
                <span className="font-medium">Réf:</span>{' '}
                {product.supplier_reference}
              </span>
            )}
          </p>
          {product.supplier_page_url && (
            <a
              href={product.supplier_page_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center text-blue-600 hover:underline text-sm mt-1"
            >
              <ExternalLink className="h-3 w-3 mr-1" />
              Page produit fournisseur
            </a>
          )}
        </div>
        <ButtonV2
          variant="ghost"
          size="sm"
          onClick={onStartEdit}
          className="text-gray-500 hover:text-black"
        >
          <Edit className="h-4 w-4" />
        </ButtonV2>
      </div>

      {/* Badges */}
      <div className="flex flex-wrap gap-2 mt-3">
        {product.sourcing_type === 'client' && (
          <Badge variant="outline" className="border-blue-300 text-blue-600">
            <User className="h-3 w-3 mr-1" />
            Sourcing Client
          </Badge>
        )}
        {product.sourcing_type === 'interne' && (
          <Badge variant="outline" className="border-black text-black">
            <Building className="h-3 w-3 mr-1" />
            Sourcing Interne
          </Badge>
        )}
        {product.requires_sample && (
          <Badge
            variant="outline"
            className="border-orange-300 text-orange-600"
          >
            <Package className="h-3 w-3 mr-1" />
            Échantillon requis
          </Badge>
        )}
      </div>
    </div>
  );
}

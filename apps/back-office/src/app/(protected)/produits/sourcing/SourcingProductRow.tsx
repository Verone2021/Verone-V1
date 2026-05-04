'use client';

import type { SourcingProduct } from '@verone/products';
import {
  CloudflareImage,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@verone/ui';
import { ButtonV2 } from '@verone/ui';
import {
  Archive,
  Building,
  CheckCircle,
  Edit,
  Eye,
  MoreHorizontal,
  Package,
  Trash2,
} from 'lucide-react';

import {
  formatDate,
  formatPrice,
  getPrimaryImage,
  getStatusBadge,
  getSourcingTypeBadge,
} from './sourcing-page.helpers';

interface SourcingProductRowProps {
  product: SourcingProduct;
  onView: () => void;
  onViewSupplier: (() => void) | undefined;
  onEdit: () => void;
  onValidate: () => void;
  onArchive: () => void;
  onDelete: () => void;
}

export function SourcingProductRow({
  product,
  onView,
  onViewSupplier,
  onEdit,
  onValidate,
  onArchive,
  onDelete,
}: SourcingProductRowProps) {
  const primaryImage = getPrimaryImage(product);
  const hasImage = primaryImage.cloudflareId ?? primaryImage.publicUrl;
  const canValidate = product.supplier_id && product.product_status === 'draft';
  const supplierName =
    product.supplier?.trade_name ??
    product.supplier?.legal_name ??
    product.supplier?.name;

  return (
    <tr className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors">
      {/* Photo + Nom */}
      <td className="p-3">
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0 w-10 h-10 rounded-lg overflow-hidden border border-gray-200 bg-gray-50">
            {hasImage ? (
              <CloudflareImage
                cloudflareId={primaryImage.cloudflareId}
                fallbackSrc={primaryImage.publicUrl}
                alt={product.name}
                width={40}
                height={40}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Package className="h-4 w-4 text-gray-300" />
              </div>
            )}
          </div>
          <div className="min-w-0">
            <button
              onClick={onView}
              className="text-sm font-medium text-gray-900 hover:text-blue-600 hover:underline truncate block max-w-[250px] text-left"
            >
              {product.name}
            </button>
            <p className="text-xs text-gray-400 font-mono">{product.sku}</p>
          </div>
        </div>
      </td>

      {/* Fournisseur */}
      <td className="p-3">
        {supplierName ? (
          <button
            onClick={onViewSupplier}
            className="text-sm text-gray-600 hover:text-blue-600 hover:underline truncate block max-w-[150px]"
          >
            {supplierName}
          </button>
        ) : (
          <span className="text-xs text-gray-400">—</span>
        )}
      </td>

      {/* Prix */}
      <td className="p-3 text-right">
        {product.cost_price != null ? (
          <span className="text-sm font-medium">
            {formatPrice(product.cost_price)}
          </span>
        ) : (
          <span className="text-xs text-gray-400">—</span>
        )}
      </td>

      {/* Statut */}
      <td className="p-3 text-center">
        {getStatusBadge(product.product_status)}
      </td>

      {/* Type */}
      <td className="p-3 text-center">
        {getSourcingTypeBadge(product.sourcing_type, product.requires_sample)}
      </td>

      {/* Date */}
      <td className="p-3 text-right">
        <span className="text-xs text-gray-500">
          {formatDate(product.created_at)}
        </span>
      </td>

      {/* Actions */}
      <td className="p-3 text-right">
        <div className="flex items-center justify-end gap-1">
          <ButtonV2 variant="outline" size="sm" onClick={onView}>
            <Eye className="h-3 w-3" />
          </ButtonV2>

          {canValidate && (
            <ButtonV2
              variant="outline"
              size="sm"
              onClick={onValidate}
              className="text-green-600 border-green-200 hover:bg-green-50"
            >
              <CheckCircle className="h-3 w-3" />
            </ButtonV2>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <ButtonV2 variant="outline" size="sm">
                <MoreHorizontal className="h-3 w-3" />
              </ButtonV2>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onEdit}>
                <Edit className="h-4 w-4 mr-2" />
                Modifier
              </DropdownMenuItem>
              {onViewSupplier && (
                <DropdownMenuItem onClick={onViewSupplier}>
                  <Building className="h-4 w-4 mr-2" />
                  Voir fournisseur
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              {!product.archived_at ? (
                <DropdownMenuItem onClick={onArchive}>
                  <Archive className="h-4 w-4 mr-2" />
                  Archiver
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem onClick={onDelete} className="text-red-600">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Supprimer
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </td>
    </tr>
  );
}

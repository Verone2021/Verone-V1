'use client';

import Image from 'next/image';

import type { SourcingProduct } from '@verone/products';
import { ButtonV2, IconButton } from '@verone/ui';
import { colors } from '@verone/ui/design-system';
import {
  Archive,
  Building,
  Calendar,
  CheckCircle,
  Edit,
  Euro,
  ExternalLink,
  Eye,
  ImageIcon,
  Package,
  Trash2,
  User,
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
  const imageUrl = getPrimaryImage(product);

  return (
    <div
      className="rounded-lg p-4 hover:bg-gray-50 transition-colors"
      style={{ border: `1px solid ${colors.border.DEFAULT}` }}
    >
      <div className="flex items-start gap-4">
        {/* Image produit */}
        <div
          className="flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden"
          style={{
            backgroundColor: colors.background.subtle,
            border: `1px solid ${colors.border.DEFAULT}`,
          }}
        >
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={product.name}
              width={64}
              height={64}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <ImageIcon
                className="h-6 w-6"
                style={{ color: colors.text.muted }}
              />
            </div>
          )}
        </div>

        {/* Infos produit */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-3 mb-2">
            <h3
              className="font-semibold truncate"
              style={{ color: colors.text.DEFAULT }}
            >
              {product.name}
            </h3>
            {getStatusBadge(product.product_status)}
            {getSourcingTypeBadge(
              product.sourcing_type,
              product.requires_sample
            )}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
            <div className="flex items-center space-x-2">
              <Package
                className="h-4 w-4"
                style={{ color: colors.text.muted }}
              />
              <span style={{ color: colors.text.subtle }}>
                SKU: {product.sku}
              </span>
            </div>

            {product.cost_price != null && (
              <div className="flex items-center space-x-2">
                <Euro
                  className="h-4 w-4"
                  style={{ color: colors.text.muted }}
                />
                <span style={{ color: colors.text.subtle }}>
                  {formatPrice(product.cost_price)}
                </span>
              </div>
            )}

            {product.supplier && (
              <div className="flex items-center space-x-2">
                <Building
                  className="h-4 w-4"
                  style={{ color: colors.text.muted }}
                />
                <span
                  className="truncate"
                  style={{ color: colors.text.subtle }}
                >
                  {product.supplier.name}
                </span>
              </div>
            )}

            {product.supplier_page_url && (
              <div className="flex items-center space-x-2">
                <a
                  href={product.supplier_page_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center hover:underline"
                  style={{ color: colors.primary[600] }}
                  onClick={e => e.stopPropagation()}
                >
                  <ExternalLink className="h-4 w-4 mr-1" />
                  <span className="text-sm">Site fournisseur</span>
                </a>
              </div>
            )}

            <div className="flex items-center space-x-2">
              <Calendar
                className="h-4 w-4"
                style={{ color: colors.text.muted }}
              />
              <span style={{ color: colors.text.subtle }}>
                {formatDate(product.created_at)}
              </span>
            </div>
          </div>

          {product.assigned_client && (
            <div
              className="mt-2 p-2 rounded text-sm"
              style={{ backgroundColor: colors.primary[50] }}
            >
              <div className="flex items-center space-x-2">
                <User
                  className="h-4 w-4"
                  style={{ color: colors.primary[600] }}
                />
                <span style={{ color: colors.primary[600] }}>
                  <strong>Client:</strong> {product.assigned_client.name}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5">
          <ButtonV2 variant="outline" size="sm" icon={Eye} onClick={onView}>
            Voir
          </ButtonV2>

          {onViewSupplier && (
            <IconButton
              variant="outline"
              size="sm"
              icon={Building}
              label="Voir le fournisseur"
              onClick={onViewSupplier}
            />
          )}

          <IconButton
            variant="outline"
            size="sm"
            icon={Edit}
            label="Modifier le produit"
            onClick={onEdit}
          />

          {product.supplier_id && product.product_status === 'draft' && (
            <IconButton
              variant="success"
              size="sm"
              icon={CheckCircle}
              label="Valider et ajouter au catalogue"
              onClick={onValidate}
            />
          )}

          {!product.archived_at && (
            <IconButton
              variant="outline"
              size="sm"
              icon={Archive}
              label="Archiver le produit"
              onClick={onArchive}
            />
          )}

          {product.archived_at && (
            <IconButton
              variant="danger"
              size="sm"
              icon={Trash2}
              label="Supprimer définitivement"
              onClick={onDelete}
            />
          )}
        </div>
      </div>
    </div>
  );
}

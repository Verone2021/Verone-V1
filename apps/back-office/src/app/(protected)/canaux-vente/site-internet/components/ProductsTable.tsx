'use client';

import Link from 'next/link';

import { ProductThumbnail } from '@verone/products';
import {
  Badge,
  ButtonV2,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@verone/ui';
import {
  Package,
  AlertCircle,
  CheckCircle,
  Edit,
  Eye,
  FileText,
  Trash2,
} from 'lucide-react';

import type { SiteInternetProduct } from '../types';

interface ProductsTableProps {
  products: SiteInternetProduct[];
  isPendingToggle: boolean;
  isPendingRemove: boolean;
  onTogglePublish: (productId: string, isPublished: boolean) => void;
  onEdit: (product: SiteInternetProduct) => void;
  onPreview: (product: SiteInternetProduct) => void;
  onRemove: (productId: string) => void;
}

export function ProductsTable({
  products,
  isPendingToggle,
  isPendingRemove,
  onTogglePublish,
  onEdit,
  onPreview,
  onRemove,
}: ProductsTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[80px]">Image</TableHead>
          <TableHead>Produit</TableHead>
          <TableHead className="hidden lg:table-cell">SKU</TableHead>
          <TableHead className="hidden xl:table-cell">Variantes</TableHead>
          <TableHead>Prix</TableHead>
          <TableHead>Statut</TableHead>
          <TableHead className="hidden xl:table-cell">Eligibilite</TableHead>
          <TableHead>Publie</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {products.length === 0 ? (
          <TableRow>
            <TableCell colSpan={9} className="h-24 text-center">
              <div className="flex flex-col items-center gap-2 text-muted-foreground">
                <Package className="h-8 w-8 opacity-50" />
                <p>Aucun produit trouve</p>
              </div>
            </TableCell>
          </TableRow>
        ) : (
          products.map(product => (
            <TableRow key={product.product_id}>
              <TableCell>
                <ProductThumbnail
                  src={product.primary_image_url}
                  alt={product.name}
                  size="sm"
                />
              </TableCell>
              <TableCell className="font-medium">{product.name}</TableCell>
              <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                {product.sku}
              </TableCell>
              <TableCell className="hidden xl:table-cell">
                {product.has_variants ? (
                  <Badge variant="outline">
                    {product.variants_count} variantes
                  </Badge>
                ) : (
                  <span className="text-sm text-muted-foreground">—</span>
                )}
              </TableCell>
              <TableCell>
                <div className="text-sm">
                  <div className="font-medium">
                    {product.price_ttc.toFixed(2)} € TTC
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {product.price_source === 'channel_pricing'
                      ? 'Prix canal'
                      : 'Prix base'}
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <Badge
                  variant={
                    product.status === 'active' ? 'default' : 'secondary'
                  }
                >
                  {product.status}
                </Badge>
              </TableCell>
              <TableCell className="hidden xl:table-cell">
                {product.is_eligible ? (
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle className="h-4 w-4" />
                    <span className="text-sm">Eligible</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-orange-600">
                    <AlertCircle className="h-4 w-4" />
                    <span className="text-sm">Non eligible</span>
                  </div>
                )}
              </TableCell>
              <TableCell>
                <Switch
                  checked={product.is_published}
                  onCheckedChange={() => {
                    onTogglePublish(product.product_id, product.is_published);
                  }}
                  disabled={isPendingToggle}
                />
              </TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-2">
                  <Link
                    href={`/canaux-vente/site-internet/produits/${product.product_id}`}
                  >
                    <ButtonV2 variant="ghost" size="sm" title="Voir details">
                      <FileText className="h-4 w-4" />
                    </ButtonV2>
                  </Link>
                  <ButtonV2
                    variant="ghost"
                    size="sm"
                    onClick={() => onEdit(product)}
                  >
                    <Edit className="h-4 w-4" />
                  </ButtonV2>
                  <ButtonV2
                    variant="ghost"
                    size="sm"
                    onClick={() => onPreview(product)}
                    title="Previsualiser"
                  >
                    <Eye className="h-4 w-4" />
                  </ButtonV2>
                  <ButtonV2
                    variant="ghost"
                    size="sm"
                    onClick={() => onRemove(product.product_id)}
                    disabled={isPendingRemove}
                  >
                    <Trash2 className="h-4 w-4" />
                  </ButtonV2>
                </div>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
}

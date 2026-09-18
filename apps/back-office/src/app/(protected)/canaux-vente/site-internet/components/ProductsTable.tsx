'use client';

import { useMemo } from 'react';

import Link from 'next/link';

import { useChannelPricesBatch } from '@verone/channels';
import { ProductThumbnail } from '@verone/products';
import {
  LandedCostValue,
  MarginValue,
  SitePriceValue,
} from '@verone/products/components/pricing';
import { useProductCostBasisBatch } from '@verone/products/hooks';
import { buildPricingView } from '@verone/products/utils';
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
  // Deux requetes groupees pour toute la page, jamais une par ligne.
  const productIds = useMemo(() => products.map(p => p.product_id), [products]);
  const { getPrices } = useChannelPricesBatch(productIds);
  const { getCostBasis } = useProductCostBasisBatch(productIds);

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[80px]">Image</TableHead>
          <TableHead>Produit</TableHead>
          <TableHead className="hidden lg:table-cell">SKU</TableHead>
          <TableHead className="hidden lg:table-cell">Variantes</TableHead>
          <TableHead className="w-[110px] text-right hidden lg:table-cell">
            Revient HT
          </TableHead>
          <TableHead className="w-[130px] text-right">Prix site HT</TableHead>
          <TableHead className="w-[120px] text-right hidden lg:table-cell">
            Marge
          </TableHead>
          <TableHead className="hidden xl:table-cell">Prix TTC</TableHead>
          <TableHead className="hidden 2xl:table-cell">Statut</TableHead>
          <TableHead className="hidden xl:table-cell">Eligibilite</TableHead>
          <TableHead>Publie</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {products.length === 0 ? (
          <TableRow>
            <TableCell colSpan={12} className="h-24 text-center">
              <div className="flex flex-col items-center gap-2 text-muted-foreground">
                <Package className="h-8 w-8 opacity-50" />
                <p>Aucun produit trouve</p>
              </div>
            </TableCell>
          </TableRow>
        ) : (
          products.map(product => {
            const cost = getCostBasis(product.product_id);
            const prices = getPrices(product.product_id);
            // Meme verdict que la liste du catalogue : une seule regle, deux ecrans.
            const view = buildPricingView({
              costPrice: cost.costPrice,
              costNetAvg: cost.costNetAvg,
              costNetManual: cost.costNetManual,
              ecoTaxHt: cost.ecoTaxHt,
              isPublishedOnline: cost.isPublishedOnline,
              hierarchy: cost.hierarchy,
              sitePriceHt: prices.sitePriceHt,
              sitePriceSource: prices.sitePriceSource,
              sitePriceValidatedAt: prices.sitePriceValidatedAt,
              linkmePriceHt: prices.linkmePriceHt,
            });

            return (
              <TableRow key={product.product_id}>
                <TableCell>
                  <ProductThumbnail
                    src={product.primary_image_url}
                    alt={product.name}
                    size="sm"
                  />
                </TableCell>
                <TableCell className="font-medium">{product.name}</TableCell>
                <TableCell className="text-sm text-muted-foreground hidden lg:table-cell">
                  {product.sku}
                </TableCell>
                <TableCell className="hidden lg:table-cell">
                  {product.has_variants ? (
                    <Badge variant="outline">
                      {product.variants_count} variantes
                    </Badge>
                  ) : (
                    <span className="text-sm text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell className="text-right hidden lg:table-cell">
                  <LandedCostValue view={view} />
                </TableCell>
                <TableCell className="text-right">
                  <SitePriceValue view={view} />
                </TableCell>
                <TableCell className="text-right hidden lg:table-cell">
                  <MarginValue view={view} />
                </TableCell>
                <TableCell className="hidden xl:table-cell">
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
                <TableCell className="hidden 2xl:table-cell">
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
            );
          })
        )}
      </TableBody>
    </Table>
  );
}

import { Package, AlertCircle, Percent } from 'lucide-react';

import { ProductThumbnail } from '@verone/products/components/images/ProductThumbnail';
import { Card, CardContent, CardHeader, CardTitle } from '@verone/ui';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@verone/ui';
import { cn } from '@verone/utils';

import type { LinkMeCatalogProduct } from '../../../hooks/use-linkme-catalog';

import { EditableCell } from './EditableCell';
import { MarginIndicator } from './MarginIndicator';

interface ProductsTableProps {
  filteredProducts: LinkMeCatalogProduct[];
  pendingChanges: Map<string, { newValue: number | null }>;
  getEffectiveValue: (
    product: LinkMeCatalogProduct,
    field:
      | 'public_price_ht'
      | 'custom_price_ht'
      | 'buffer_rate'
      | 'channel_commission_rate'
  ) => number | null;
  getEffectiveTtcValue: (product: LinkMeCatalogProduct) => number | null;
  calculateMargin: (product: LinkMeCatalogProduct) => number | null;
  hasChanges: (product: LinkMeCatalogProduct) => boolean;
  handleFieldChange: (
    product: LinkMeCatalogProduct,
    field:
      | 'public_price_ht'
      | 'custom_price_ht'
      | 'buffer_rate'
      | 'channel_commission_rate',
    newValue: number | null
  ) => void;
  handleTtcChange: (
    product: LinkMeCatalogProduct,
    ttcValue: number | null
  ) => void;
}

export function ProductsTable({
  filteredProducts,
  pendingChanges,
  getEffectiveValue,
  getEffectiveTtcValue,
  calculateMargin,
  hasChanges,
  handleFieldChange,
  handleTtcChange,
}: ProductsTableProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Percent className="h-4 w-4" />
          Configuration des prix par produit
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="w-[300px]">Produit</TableHead>
                <TableHead className="text-right hidden lg:table-cell">
                  Prix d&apos;achat HT
                </TableHead>
                <TableHead className="text-right">Prix public TTC</TableHead>
                <TableHead className="text-right hidden xl:table-cell">
                  Prix public HT
                </TableHead>
                <TableHead className="text-right">Prix de vente HT</TableHead>
                <TableHead className="text-right hidden xl:table-cell">
                  Buffer %
                </TableHead>
                <TableHead className="text-right hidden 2xl:table-cell">
                  Commission %
                </TableHead>
                <TableHead className="text-right">Marge</TableHead>
                <TableHead className="w-[50px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.map(product => {
                const margin = calculateMargin(product);
                const productHasChanges = hasChanges(product);

                return (
                  <TableRow
                    key={product.id}
                    className={cn(
                      'transition-colors',
                      productHasChanges && 'bg-amber-50'
                    )}
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <ProductThumbnail
                          src={product.product_image_url}
                          alt={product.product_name}
                          size="xs"
                        />
                        <div className="min-w-0">
                          <p className="font-medium text-sm truncate max-w-[200px]">
                            {product.product_name}
                          </p>
                          <p className="text-xs text-gray-500 font-mono">
                            {product.product_reference}
                          </p>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell className="text-right hidden lg:table-cell">
                      <EditableCell
                        value={product.product_price_ht}
                        onChange={() => {}}
                        type="price"
                        disabled
                      />
                    </TableCell>

                    <TableCell className="text-right">
                      <EditableCell
                        value={getEffectiveTtcValue(product)}
                        onChange={ttcValue =>
                          handleTtcChange(product, ttcValue)
                        }
                        type="price"
                        hasChange={pendingChanges.has(
                          `${product.id}-public_price_ht`
                        )}
                      />
                    </TableCell>

                    <TableCell className="text-right hidden xl:table-cell">
                      <EditableCell
                        value={getEffectiveValue(product, 'public_price_ht')}
                        onChange={htValue =>
                          handleFieldChange(product, 'public_price_ht', htValue)
                        }
                        type="price"
                        hasChange={pendingChanges.has(
                          `${product.id}-public_price_ht`
                        )}
                      />
                    </TableCell>

                    <TableCell className="text-right">
                      <EditableCell
                        value={getEffectiveValue(product, 'custom_price_ht')}
                        onChange={v =>
                          handleFieldChange(product, 'custom_price_ht', v)
                        }
                        type="price"
                        hasChange={pendingChanges.has(
                          `${product.id}-custom_price_ht`
                        )}
                      />
                    </TableCell>

                    <TableCell className="text-right hidden xl:table-cell">
                      <EditableCell
                        value={getEffectiveValue(product, 'buffer_rate')}
                        onChange={v =>
                          handleFieldChange(product, 'buffer_rate', v)
                        }
                        type="percent"
                        min={0}
                        max={0.2}
                        hasChange={pendingChanges.has(
                          `${product.id}-buffer_rate`
                        )}
                      />
                    </TableCell>

                    <TableCell className="text-right hidden 2xl:table-cell">
                      <EditableCell
                        value={getEffectiveValue(
                          product,
                          'channel_commission_rate'
                        )}
                        onChange={v =>
                          handleFieldChange(
                            product,
                            'channel_commission_rate',
                            v
                          )
                        }
                        type="percent"
                        min={0}
                        max={0.5}
                        hasChange={pendingChanges.has(
                          `${product.id}-channel_commission_rate`
                        )}
                      />
                    </TableCell>

                    <TableCell className="text-right">
                      <MarginIndicator margin={margin} />
                    </TableCell>

                    <TableCell>
                      {productHasChanges && (
                        <AlertCircle className="h-4 w-4 text-amber-500" />
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        {filteredProducts.length === 0 && (
          <div className="text-center py-12">
            <Package className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">Aucun produit trouvé</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

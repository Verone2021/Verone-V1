'use client';

import {
  Eye,
  EyeOff,
  Trash2,
  AlertTriangle,
  CheckCircle,
  Clock,
  XCircle,
  Package,
  RefreshCw,
} from 'lucide-react';
import Image from 'next/image';
import { toast } from 'sonner';

import { useToggleMetaVisibility, useRemoveFromMeta } from '@verone/channels';
import type { MetaCommerceProduct } from '@verone/channels/hooks/use-meta-commerce-products';
import { Badge } from '@verone/ui';
import { ButtonV2 } from '@verone/ui';
import { Card, CardContent } from '@verone/ui';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@verone/ui';

interface MetaProductsTableProps {
  products: MetaCommerceProduct[];
  loading: boolean;
}

function formatRelativeDate(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "a l'instant";
  if (minutes < 60) return `il y a ${minutes}min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `il y a ${hours}h`;
  const days = Math.floor(hours / 24);
  return `il y a ${days}j`;
}

function formatPrice(price: number | null): string {
  if (price == null) return '-';
  return `${Number(price).toFixed(2)} \u20AC`;
}

function StatusBadge({ status }: { status: string | null }) {
  switch (status) {
    case 'active':
      return (
        <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
          <CheckCircle className="h-3 w-3 mr-1" />
          Actif
        </Badge>
      );
    case 'pending':
      return (
        <Badge variant="secondary">
          <Clock className="h-3 w-3 mr-1" />
          En attente
        </Badge>
      );
    case 'rejected':
      return (
        <Badge variant="destructive">
          <XCircle className="h-3 w-3 mr-1" />
          Rejete
        </Badge>
      );
    default:
      return (
        <Badge variant="outline">
          <AlertTriangle className="h-3 w-3 mr-1" />
          Inconnu
        </Badge>
      );
  }
}

export function MetaProductsTable({
  products,
  loading,
}: MetaProductsTableProps) {
  const toggleVisibility = useToggleMetaVisibility();
  const removeFromMeta = useRemoveFromMeta();

  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">Image</TableHead>
              <TableHead>Produit</TableHead>
              <TableHead className="w-[100px]">SKU</TableHead>
              <TableHead className="w-[100px]">Prix Meta</TableHead>
              <TableHead className="w-[120px]">Statut Meta</TableHead>
              <TableHead className="w-[120px]">Derniere sync</TableHead>
              <TableHead className="w-[100px] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12">
                  <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Chargement des produits...
                  </p>
                </TableCell>
              </TableRow>
            ) : products.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12">
                  <Package className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Aucun produit ne correspond aux filtres
                  </p>
                </TableCell>
              </TableRow>
            ) : (
              products.map(p => (
                <TableRow key={p.id}>
                  <TableCell>
                    <div className="h-10 w-10 rounded overflow-hidden bg-muted flex-shrink-0">
                      {p.primary_image_url ? (
                        <Image
                          src={p.primary_image_url}
                          alt={p.product_name}
                          width={40}
                          height={40}
                          className="object-cover h-full w-full"
                        />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center">
                          <Package className="h-4 w-4 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{p.product_name}</p>
                      {p.custom_title && p.custom_title !== p.product_name && (
                        <p className="text-xs text-muted-foreground">
                          Meta: {p.custom_title}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-sm">{p.sku}</TableCell>
                  <TableCell>
                    {formatPrice(p.custom_price_ht ?? p.cost_price * 2.5)}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={p.meta_status} />
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {p.synced_at ? formatRelativeDate(p.synced_at) : '-'}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <ButtonV2
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          void toggleVisibility
                            .mutateAsync({
                              productId: p.product_id,
                              visible: p.sync_status === 'deleted',
                            })
                            .then(() => {
                              toast.success(
                                p.sync_status === 'deleted'
                                  ? 'Produit reactive'
                                  : 'Produit masque'
                              );
                            });
                        }}
                        title={
                          p.sync_status === 'deleted' ? 'Reactiver' : 'Masquer'
                        }
                      >
                        {p.sync_status === 'deleted' ? (
                          <Eye className="h-4 w-4" />
                        ) : (
                          <EyeOff className="h-4 w-4" />
                        )}
                      </ButtonV2>
                      <ButtonV2
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          void removeFromMeta
                            .mutateAsync(p.product_id)
                            .then(() => {
                              toast.success('Produit retire de Meta');
                            });
                        }}
                        title="Retirer"
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </ButtonV2>
                      {p.error_message && (
                        <ButtonV2
                          variant="ghost"
                          size="icon"
                          title={p.error_message}
                        >
                          <AlertTriangle className="h-4 w-4 text-amber-500" />
                        </ButtonV2>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

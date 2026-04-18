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

import {
  useToggleGoogleMerchantVisibility,
  useRemoveFromGoogleMerchant,
} from '@verone/channels';
import type { GoogleMerchantProduct } from '@verone/channels';
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

interface GmProductsTableProps {
  products: GoogleMerchantProduct[];
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

function StatusBadge({ status }: { status: string | null }) {
  switch (status) {
    case 'approved':
      return (
        <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
          <CheckCircle className="h-3 w-3 mr-1" />
          Approuve
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
          Non synchronise
        </Badge>
      );
  }
}

export function GmProductsTable({ products, loading }: GmProductsTableProps) {
  const toggleVisibility = useToggleGoogleMerchantVisibility();
  const removeProduct = useRemoveFromGoogleMerchant();

  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">Image</TableHead>
              <TableHead>Produit</TableHead>
              <TableHead className="w-[100px] hidden lg:table-cell">
                SKU
              </TableHead>
              <TableHead className="w-[120px]">Statut Google</TableHead>
              <TableHead className="w-[100px] hidden lg:table-cell">
                Impressions
              </TableHead>
              <TableHead className="w-[80px] hidden xl:table-cell">
                Clics
              </TableHead>
              <TableHead className="w-[120px] hidden xl:table-cell">
                Derniere sync
              </TableHead>
              <TableHead className="w-[100px] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-12">
                  <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Chargement des produits...
                  </p>
                </TableCell>
              </TableRow>
            ) : products.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-12">
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
                    <p className="font-medium">{p.product_name}</p>
                  </TableCell>
                  <TableCell className="font-mono text-sm hidden lg:table-cell">
                    {p.sku}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={p.google_status} />
                  </TableCell>
                  <TableCell className="text-sm hidden lg:table-cell">
                    {p.impressions.toLocaleString('fr-FR')}
                  </TableCell>
                  <TableCell className="text-sm hidden xl:table-cell">
                    {p.clicks}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground hidden xl:table-cell">
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
                              visible: p.sync_status === 'skipped',
                            })
                            .then(() => {
                              toast.success(
                                p.sync_status === 'skipped'
                                  ? 'Produit reactive'
                                  : 'Produit masque'
                              );
                            })
                            .catch((err: unknown) => {
                              console.error('[GM] Toggle failed:', err);
                            });
                        }}
                        title={
                          p.sync_status === 'skipped' ? 'Reactiver' : 'Masquer'
                        }
                      >
                        {p.sync_status === 'skipped' ? (
                          <Eye className="h-4 w-4" />
                        ) : (
                          <EyeOff className="h-4 w-4" />
                        )}
                      </ButtonV2>
                      <ButtonV2
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          void removeProduct
                            .mutateAsync({ productId: p.product_id })
                            .then(() => {
                              toast.success('Produit retire de Google');
                            })
                            .catch((err: unknown) => {
                              console.error('[GM] Remove failed:', err);
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

'use client';

import { useState } from 'react';

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
  ExternalLink,
  ImageOff,
  Pencil,
} from 'lucide-react';
import Image from 'next/image';
import { toast } from 'sonner';

import { useToggleMetaVisibility, useRemoveFromMeta } from '@verone/channels';
import type { MetaCommerceProduct } from '@verone/channels/hooks/use-meta-commerce-products';

import { MetaEditDialog } from './meta-edit-dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@verone/ui';
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@verone/ui';

const CATALOG_ID = '1223749196006844';
const BUSINESS_ID = '222452897164348';

interface MetaProductsTableProps {
  products: MetaCommerceProduct[];
  loading: boolean;
}

function formatRelativeDate(dateStr: string | null): string {
  if (!dateStr) return 'Jamais';
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "a l'instant";
  if (minutes < 60) return `il y a ${minutes}min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `il y a ${hours}h`;
  const days = Math.floor(hours / 24);
  return `il y a ${days}j`;
}

function formatPrice(price: number | null, costPrice: number): string {
  const effective = price ?? costPrice * 2.5;
  return `${Number(effective).toFixed(2)} \u20AC`;
}

function getCommerceManagerUrl(metaProductId: string | null): string | null {
  if (!metaProductId) return null;
  return `https://business.facebook.com/commerce/catalogs/${CATALOG_ID}/products/?business_id=${BUSINESS_ID}&product_id=${metaProductId}`;
}

function StatusBadge({
  metaStatus,
  syncStatus,
  statusDetail,
}: {
  metaStatus: string | null;
  syncStatus: string;
  statusDetail: Record<string, unknown> | null;
}) {
  if (syncStatus === 'error') {
    return (
      <Badge variant="destructive">
        <AlertTriangle className="h-3 w-3 mr-1" />
        Erreur sync
      </Badge>
    );
  }

  const badge = (() => {
    switch (metaStatus) {
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
            <Clock className="h-3 w-3 mr-1" />
            Non verifie
          </Badge>
        );
    }
  })();

  if (metaStatus === 'rejected' && statusDetail) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>{badge}</TooltipTrigger>
          <TooltipContent className="max-w-xs">
            <p className="text-xs">{JSON.stringify(statusDetail)}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return badge;
}

export function MetaProductsTable({
  products,
  loading,
}: MetaProductsTableProps) {
  const toggleVisibility = useToggleMetaVisibility();
  const removeFromMeta = useRemoveFromMeta();
  const [removeTarget, setRemoveTarget] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [editTarget, setEditTarget] = useState<MetaCommerceProduct | null>(
    null
  );

  function handleRemove() {
    if (!removeTarget) return;
    void removeFromMeta
      .mutateAsync(removeTarget.id)
      .then(() => {
        toast.success(`${removeTarget.name} retire de Meta`);
        setRemoveTarget(null);
      })
      .catch((err: unknown) => {
        console.error('[MetaProducts] Remove failed:', err);
        toast.error('Erreur lors du retrait');
      });
  }

  return (
    <>
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
                <TableHead className="w-[100px]">Derniere verif.</TableHead>
                <TableHead className="w-[100px]">Sync</TableHead>
                <TableHead className="w-[120px] text-right">Actions</TableHead>
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
                products.map(p => {
                  const cmUrl = getCommerceManagerUrl(p.meta_product_id);
                  return (
                    <TableRow
                      key={p.id}
                      className={
                        !p.is_channel_active ? 'opacity-50 bg-muted/30' : ''
                      }
                    >
                      <TableCell>
                        <div className="h-10 w-10 rounded overflow-hidden bg-muted flex-shrink-0 relative">
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
                          {p.image_count === 0 && (
                            <div className="absolute -top-1 -right-1">
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger>
                                    <ImageOff className="h-3.5 w-3.5 text-red-500" />
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p className="text-xs">
                                      Aucune image — produit absent du feed Meta
                                    </p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{p.product_name}</p>
                          {p.custom_title &&
                            p.custom_title !== p.product_name && (
                              <p className="text-xs text-muted-foreground">
                                Meta: {p.custom_title}
                              </p>
                            )}
                          {!p.is_channel_active && (
                            <p className="text-xs text-amber-600">Desactive</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {p.sku}
                      </TableCell>
                      <TableCell>
                        {formatPrice(p.custom_price_ht, p.cost_price)}
                      </TableCell>
                      <TableCell>
                        <StatusBadge
                          metaStatus={p.meta_status}
                          syncStatus={p.sync_status}
                          statusDetail={p.meta_status_detail}
                        />
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {formatRelativeDate(p.meta_status_checked_at)}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {p.synced_at ? formatRelativeDate(p.synced_at) : '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <ButtonV2
                            variant="ghost"
                            size="icon"
                            onClick={() => setEditTarget(p)}
                            title="Modifier titre, description, prix"
                          >
                            <Pencil className="h-4 w-4" />
                          </ButtonV2>
                          {cmUrl && (
                            <ButtonV2
                              variant="ghost"
                              size="icon"
                              onClick={() => window.open(cmUrl, '_blank')}
                              title="Voir dans Commerce Manager"
                            >
                              <ExternalLink className="h-4 w-4 text-blue-500" />
                            </ButtonV2>
                          )}
                          <ButtonV2
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              void toggleVisibility
                                .mutateAsync({
                                  productId: p.product_id,
                                  visible: !p.is_channel_active,
                                })
                                .then(() => {
                                  toast.success(
                                    p.is_channel_active
                                      ? 'Produit masque'
                                      : 'Produit reactive'
                                  );
                                })
                                .catch((err: unknown) => {
                                  console.error(
                                    '[MetaProducts] Toggle failed:',
                                    err
                                  );
                                });
                            }}
                            title={
                              p.is_channel_active ? 'Masquer' : 'Reactiver'
                            }
                          >
                            {p.is_channel_active ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </ButtonV2>
                          <ButtonV2
                            variant="ghost"
                            size="icon"
                            onClick={() =>
                              setRemoveTarget({
                                id: p.product_id,
                                name: p.product_name,
                              })
                            }
                            title="Retirer de Meta"
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </ButtonV2>
                          {p.error_message && (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger>
                                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                                </TooltipTrigger>
                                <TooltipContent className="max-w-xs">
                                  <p className="text-xs">{p.error_message}</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <AlertDialog
        open={!!removeTarget}
        onOpenChange={open => {
          if (!open) setRemoveTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Retirer de Meta Commerce ?</AlertDialogTitle>
            <AlertDialogDescription>
              Le produit <strong>{removeTarget?.name}</strong> sera retire du
              catalogue Meta. Il ne sera plus visible sur Facebook, Instagram et
              WhatsApp.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemove}
              className="bg-destructive text-destructive-foreground"
            >
              Retirer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <MetaEditDialog
        product={editTarget}
        onClose={() => setEditTarget(null)}
      />
    </>
  );
}

'use client';

import { Fragment, useState } from 'react';

import Image from 'next/image';
import Link from 'next/link';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Textarea,
} from '@verone/ui';
import {
  Package,
  Loader2,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Eye,
  Filter,
  User,
  ShoppingCart,
  Building2,
  ChevronDown,
  ChevronRight,
  Store,
  Trash2,
} from 'lucide-react';

import { createClient } from '@verone/utils/supabase/client';

import {
  getOrderMissingFields,
  type MissingFieldsResult,
} from '../../utils/order-missing-fields';
import {
  useAllLinkMeOrders,
  useApproveOrder,
  useRejectOrder,
  type PendingOrder,
  type OrderValidationStatus,
} from '../../hooks/use-linkme-order-actions';

// ============================================================================
// HELPERS
// ============================================================================

function formatRelativeDate(dateStr: string): {
  text: string;
  isUrgent: boolean;
} {
  const now = Date.now();
  const created = new Date(dateStr).getTime();
  const diffMs = now - created;
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);

  if (diffDays > 0) {
    return { text: `il y a ${diffDays}j`, isUrgent: diffDays >= 2 };
  }
  if (diffHours > 0) {
    return { text: `il y a ${diffHours}h`, isUrgent: false };
  }
  return { text: "il y a moins d'1h", isUrgent: false };
}

// ============================================================================
// STATUS FILTER OPTIONS
// ============================================================================

const ORDER_STATUS_OPTIONS: {
  value: OrderValidationStatus | 'all';
  label: string;
  icon: React.ElementType;
  color: string;
}[] = [
  { value: 'all', label: 'Tous', icon: ShoppingCart, color: 'text-gray-600' },
  {
    value: 'pending',
    label: 'En attente',
    icon: Clock,
    color: 'text-amber-600',
  },
  {
    value: 'approved',
    label: 'Approuves',
    icon: CheckCircle,
    color: 'text-green-600',
  },
  {
    value: 'rejected',
    label: 'Rejetes',
    icon: XCircle,
    color: 'text-red-600',
  },
];

// ============================================================================
// COMPONENT
// ============================================================================

export function CommandesTab() {
  const [selectedStatus, setSelectedStatus] = useState<
    OrderValidationStatus | 'all'
  >('pending');

  const {
    data: orders,
    isLoading,
    refetch,
  } = useAllLinkMeOrders(selectedStatus === 'all' ? undefined : selectedStatus);

  const approveOrder = useApproveOrder();
  const rejectOrder = useRejectOrder();

  const [selectedOrder, setSelectedOrder] = useState<PendingOrder | null>(null);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  // État pour la suppression
  const [deleteTarget, setDeleteTarget] = useState<PendingOrder | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async (order: PendingOrder) => {
    setIsDeleting(true);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('sales_orders')
        .delete()
        .eq('id', order.id);

      if (error) throw error;

      setDeleteTarget(null);
      void refetch().catch(err => {
        console.error('[Approbations] Refetch after delete failed:', err);
      });
    } catch (err) {
      console.error('[Approbations] Delete failed:', err);
      alert('Erreur lors de la suppression');
    } finally {
      setIsDeleting(false);
    }
  };

  // État pour les lignes expandues
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const toggleRow = (orderId: string) => {
    setExpandedRows(prev => {
      const next = new Set(prev);
      if (next.has(orderId)) {
        next.delete(orderId);
      } else {
        next.add(orderId);
      }
      return next;
    });
  };

  const handleApprove = async (order: PendingOrder, e: React.MouseEvent) => {
    e.stopPropagation(); // Éviter de toggle la ligne
    try {
      await approveOrder.mutateAsync({ orderId: order.id });
      void refetch().catch(error => {
        console.error('[Approbations] Refetch failed:', error);
      });
    } catch {
      alert("Erreur lors de l'approbation");
    }
  };

  const handleRejectClick = (order: PendingOrder, e: React.MouseEvent) => {
    e.stopPropagation(); // Éviter de toggle la ligne
    setSelectedOrder(order);
    setRejectReason('');
    setIsRejectDialogOpen(true);
  };

  const handleRejectConfirm = async () => {
    if (!selectedOrder || !rejectReason.trim()) return;

    try {
      await rejectOrder.mutateAsync({
        orderId: selectedOrder.id,
        reason: rejectReason.trim(),
      });
      setIsRejectDialogOpen(false);
      setSelectedOrder(null);
      void refetch().catch(error => {
        console.error('[Approbations] Refetch failed:', error);
      });
    } catch {
      alert('Erreur lors du rejet');
    }
  };

  const getOrderValidationStatus = (
    order: PendingOrder
  ): OrderValidationStatus => {
    if (order.status === 'cancelled') return 'rejected';
    if (order.status === 'pending_approval') return 'pending';
    return 'approved';
  };

  // Format du type de demandeur - Reserved
  const _formatRequesterType = (type: string | null | undefined) => {
    if (!type) return '-';
    const types: Record<string, string> = {
      responsable_enseigne: 'Responsable enseigne',
      architecte: 'Architecte',
      franchise: 'Franchise',
    };
    return types[type] ?? type;
  };

  return (
    <>
      {/* Status Filter */}
      <div className="flex items-center gap-2 mb-6">
        <Filter className="h-4 w-4 text-gray-400" />
        <div className="flex gap-1 p-1 bg-gray-100 rounded-lg">
          {ORDER_STATUS_OPTIONS.map(option => {
            const Icon = option.icon;
            const isActive = selectedStatus === option.value;
            return (
              <button
                key={option.value}
                onClick={() => setSelectedStatus(option.value)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-colors ${
                  isActive
                    ? 'bg-white shadow-sm font-medium'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Icon className={`h-4 w-4 ${option.color}`} />
                {option.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
        </div>
      )}

      {/* Empty State */}
      {!isLoading && (!orders || orders.length === 0) && (
        <div className="bg-white rounded-xl p-12 text-center border">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <ShoppingCart className="h-8 w-8 text-gray-400" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            Aucune commande
          </h2>
          <p className="text-gray-500">
            {selectedStatus === 'pending'
              ? 'Aucune commande en attente de validation'
              : 'Aucune commande trouvee avec ce filtre'}
          </p>
        </div>
      )}

      {/* Orders Table */}
      {!isLoading && orders && orders.length > 0 && (
        <div className="bg-white rounded-xl border overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-500 w-8" />
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">
                  Commande
                </th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">
                  Demandeur
                </th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">
                  Organisation
                </th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">
                  Montant
                </th>
                <th className="text-center px-6 py-4 text-sm font-medium text-gray-500">
                  Infos manquantes
                </th>
                <th className="text-right px-6 py-4 text-sm font-medium text-gray-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {orders.map(order => {
                const isExpanded = expandedRows.has(order.id);
                const details = order.linkme_details;
                const missingFields: MissingFieldsResult | null = details
                  ? getOrderMissingFields({
                      details: details as unknown as Parameters<
                        typeof getOrderMissingFields
                      >[0]['details'],
                      organisationSiret: order.organisation_siret ?? undefined,
                      organisationCountry:
                        order.organisation_country ?? undefined,
                      organisationVatNumber:
                        order.organisation_vat_number ?? undefined,
                      ownerType: details.owner_type,
                      ignoredFields:
                        (details.ignored_missing_fields as string[]) ?? [],
                    })
                  : null;

                return (
                  <Fragment key={order.id}>
                    {/* Ligne principale - cliquable */}
                    <tr
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() => toggleRow(order.id)}
                    >
                      <td className="px-3 py-4">
                        <button className="p-1 text-gray-400 hover:text-gray-600">
                          {isExpanded ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </button>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium text-gray-900">
                            {order.order_number}
                            {order.linkme_display_number && (
                              <span className="ml-1 text-xs font-normal text-gray-500">
                                ({order.linkme_display_number})
                              </span>
                            )}
                          </p>
                          <p className="text-sm text-gray-500">
                            {new Date(order.created_at).toLocaleDateString(
                              'fr-FR'
                            )}
                          </p>
                          {(() => {
                            const rel = formatRelativeDate(order.created_at);
                            return (
                              <p
                                className={`text-xs ${rel.isUrgent ? 'text-amber-600 font-medium' : 'text-gray-400'}`}
                              >
                                {rel.text}
                              </p>
                            );
                          })()}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-gray-900">
                            {order.requester_name ?? '-'}
                          </p>
                          <p className="text-sm text-gray-500">
                            {order.requester_email ?? '-'}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          <p className="text-gray-900">
                            {order.organisation_name ?? '-'}
                          </p>
                          <p className="text-sm text-gray-500">
                            {order.enseigne_name ?? '-'}
                          </p>
                          {/* Badges Organisation */}
                          <div className="flex flex-wrap gap-1 mt-0.5">
                            {/* Badge Owner Type (Propre/Franchisé) */}
                            {details?.owner_type && (
                              <span
                                className={`inline-flex items-center gap-1 w-fit px-2 py-0.5 rounded-full text-xs font-medium border ${
                                  details.owner_type === 'franchise'
                                    ? 'border-violet-300 text-violet-700 bg-violet-50'
                                    : 'border-blue-300 text-blue-700 bg-blue-50'
                                }`}
                              >
                                <Building2 className="h-3 w-3" />
                                {details.owner_type === 'franchise'
                                  ? 'Franchisé'
                                  : 'Propre'}
                              </span>
                            )}
                            {/* Badge Nouveau/Existant (seulement si explicitement renseigné) */}
                            {details?.is_new_restaurant === true && (
                              <span className="inline-flex items-center gap-1 w-fit px-2 py-0.5 rounded-full text-xs font-medium border border-orange-300 text-orange-700 bg-orange-50">
                                <Building2 className="h-3 w-3" />
                                Nouveau restaurant
                              </span>
                            )}
                            {details?.is_new_restaurant === false && (
                              <span className="inline-flex items-center gap-1 w-fit px-2 py-0.5 rounded-full text-xs font-medium border border-green-300 text-green-700 bg-green-50">
                                <Store className="h-3 w-3" />
                                Restaurant existant
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-semibold text-gray-900">
                            {order.total_ttc.toFixed(2)} EUR
                          </p>
                          <p className="text-xs text-gray-500">
                            {order.items.length} article
                            {order.items.length > 1 ? 's' : ''}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        {missingFields && !missingFields.isComplete ? (
                          <Link
                            href={`/canaux-vente/linkme/commandes/${order.id}`}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium border border-amber-300 text-amber-700 bg-amber-50 hover:bg-amber-100 transition-colors"
                            onClick={e => e.stopPropagation()}
                          >
                            <AlertTriangle className="h-3 w-3" />
                            {missingFields.totalCategories} à compléter
                          </Link>
                        ) : missingFields?.isComplete ? (
                          <span className="inline-flex items-center gap-1 text-xs text-green-600">
                            <CheckCircle className="h-3.5 w-3.5" />
                            Complet
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {(() => {
                          const validationStatus =
                            selectedStatus === 'all'
                              ? getOrderValidationStatus(order)
                              : selectedStatus;

                          return (
                            <div
                              className="flex items-center justify-end gap-2"
                              onClick={e => e.stopPropagation()}
                            >
                              <Link
                                href={`/canaux-vente/linkme/commandes/${order.id}`}
                                className="p-2 text-gray-500 hover:text-gray-700"
                              >
                                <Eye className="h-4 w-4" />
                              </Link>
                              {validationStatus === 'pending' && (
                                <>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={e => handleRejectClick(order, e)}
                                    className="text-red-600 border-red-200 hover:bg-red-50"
                                  >
                                    <XCircle className="h-4 w-4 mr-1" />
                                    Rejeter
                                  </Button>
                                  <Button
                                    size="sm"
                                    onClick={e => {
                                      void handleApprove(order, e).catch(
                                        error => {
                                          console.error(
                                            '[Approbations] Approve failed:',
                                            error
                                          );
                                        }
                                      );
                                    }}
                                    disabled={approveOrder.isPending}
                                    className="bg-green-600 hover:bg-green-700"
                                  >
                                    {approveOrder.isPending ? (
                                      <Loader2 className="h-4 w-4 animate-spin mr-1" />
                                    ) : (
                                      <CheckCircle className="h-4 w-4 mr-1" />
                                    )}
                                    Approuver
                                  </Button>
                                </>
                              )}
                              {validationStatus === 'rejected' && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={e => {
                                    e.stopPropagation();
                                    setDeleteTarget(order);
                                  }}
                                  className="text-red-600 border-red-200 hover:bg-red-50"
                                >
                                  <Trash2 className="h-4 w-4 mr-1" />
                                  Supprimer
                                </Button>
                              )}
                            </div>
                          );
                        })()}
                      </td>
                    </tr>

                    {/* Ligne expandue avec produits + contacts */}
                    {isExpanded && (
                      <tr
                        key={`${order.id}-expanded`}
                        className="bg-gray-50 hover:bg-gray-50"
                      >
                        <td colSpan={7} className="p-0">
                          {/* Contacts fusionnés */}
                          {details &&
                            (details.requester_name ??
                              details.billing_name) && (
                              <div className="px-6 pt-3 pb-1">
                                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                                  Contacts
                                </p>
                                <div className="flex flex-wrap gap-3">
                                  {(() => {
                                    type ContactRole =
                                      | 'demandeur'
                                      | 'responsable'
                                      | 'facturation';
                                    const contacts: {
                                      name: string;
                                      email: string | null;
                                      phone: string | null;
                                      roles: ContactRole[];
                                    }[] = [];
                                    const seen = new Map<string, number>();
                                    const addContact = (
                                      name: string | null,
                                      email: string | null,
                                      phone: string | null,
                                      role: ContactRole
                                    ) => {
                                      if (!name) return;
                                      const key = `${name}|${email ?? ''}`;
                                      if (seen.has(key)) {
                                        const existing =
                                          contacts[seen.get(key)!];
                                        if (
                                          existing &&
                                          !existing.roles.includes(role)
                                        ) {
                                          existing.roles.push(role);
                                        }
                                      } else {
                                        seen.set(key, contacts.length);
                                        contacts.push({
                                          name,
                                          email,
                                          phone,
                                          roles: [role],
                                        });
                                      }
                                    };
                                    addContact(
                                      details.requester_name,
                                      details.requester_email,
                                      details.requester_phone,
                                      'demandeur'
                                    );
                                    addContact(
                                      details.billing_name,
                                      details.billing_email,
                                      details.billing_phone,
                                      'facturation'
                                    );
                                    addContact(
                                      details.delivery_contact_name,
                                      details.delivery_contact_email,
                                      details.delivery_contact_phone,
                                      'responsable'
                                    );
                                    return contacts.map((c, i) => (
                                      <div
                                        key={i}
                                        className="flex items-center gap-2 bg-white border rounded-lg px-3 py-2 text-sm"
                                      >
                                        <User className="h-4 w-4 text-gray-400 flex-shrink-0" />
                                        <div className="min-w-0">
                                          <p className="font-medium text-gray-900 truncate">
                                            {c.name}
                                          </p>
                                          {c.email && (
                                            <p className="text-xs text-gray-500 truncate">
                                              {c.email}
                                            </p>
                                          )}
                                        </div>
                                        <div className="flex gap-1 flex-shrink-0">
                                          {c.roles.map(r => (
                                            <span
                                              key={r}
                                              className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-50 text-blue-700 border border-blue-200"
                                            >
                                              {r === 'demandeur'
                                                ? 'Dem.'
                                                : r === 'responsable'
                                                  ? 'Resp.'
                                                  : 'Fact.'}
                                            </span>
                                          ))}
                                        </div>
                                      </div>
                                    ));
                                  })()}
                                </div>
                              </div>
                            )}
                          {/* Produits */}
                          <div className="py-3 px-6 space-y-2">
                            {order.items.map(item => (
                              <div
                                key={item.id}
                                className="flex items-center gap-4 text-sm py-2"
                              >
                                {/* Thumbnail */}
                                <div className="w-10 h-10 bg-gray-100 rounded overflow-hidden flex-shrink-0 relative">
                                  {item.products?.primary_image_url ? (
                                    <Image
                                      src={item.products.primary_image_url}
                                      alt=""
                                      fill
                                      className="object-cover"
                                    />
                                  ) : (
                                    <Package className="w-full h-full p-2 text-gray-400" />
                                  )}
                                </div>
                                {/* Nom */}
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium truncate">
                                    {item.products?.name ?? 'Produit inconnu'}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    {item.products?.sku ?? '-'}
                                  </p>
                                </div>
                                {/* Quantite */}
                                <p className="text-gray-600 font-medium">
                                  x{item.quantity}
                                </p>
                                {/* Prix unitaire */}
                                <p className="text-gray-500 text-xs w-20 text-right">
                                  {item.unit_price_ht.toFixed(2)} EUR
                                </p>
                                {/* Total */}
                                <p className="font-semibold text-gray-900 w-24 text-right">
                                  {item.total_ht.toFixed(2)} EUR HT
                                </p>
                              </div>
                            ))}
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Reject Dialog */}
      <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-500" />
              Rejeter la commande
            </DialogTitle>
            <DialogDescription>
              Indiquez le motif du rejet. Le demandeur sera notifie.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Textarea
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              placeholder="Motif du rejet..."
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsRejectDialogOpen(false)}
            >
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                void handleRejectConfirm().catch(error => {
                  console.error('[Approbations] Reject failed:', error);
                });
              }}
              disabled={!rejectReason.trim() || rejectOrder.isPending}
            >
              {rejectOrder.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Confirmer le rejet
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={open => {
          if (!open) setDeleteTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-red-500" />
              Supprimer la commande
            </AlertDialogTitle>
            <AlertDialogDescription>
              Etes-vous sur de vouloir supprimer la commande{' '}
              <strong>
                {deleteTarget?.linkme_display_number ??
                  deleteTarget?.order_number}
              </strong>{' '}
              ? Cette action est irreversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              disabled={isDeleting}
              onClick={e => {
                e.preventDefault();
                if (deleteTarget) {
                  void handleDelete(deleteTarget).catch(err => {
                    console.error('[Approbations] Delete failed:', err);
                  });
                }
              }}
            >
              {isDeleting ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

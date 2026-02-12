'use client';

import { useEffect, useState } from 'react';

import { useInlineEdit } from '@verone/common/hooks';
import { Badge } from '@verone/ui';
import { ButtonV2 } from '@verone/ui';
import { Card, CardContent, CardHeader, CardTitle } from '@verone/ui';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@verone/ui';
import { Separator } from '@verone/ui';
import { Table, TableBody, TableHead, TableHeader, TableRow } from '@verone/ui';
import { formatCurrency } from '@verone/utils';
import { createClient } from '@verone/utils/supabase/client';
import {
  X,
  Package,
  Calendar,
  User,
  Loader2,
  ShoppingCart,
  TruckIcon,
  Edit,
  Save,
} from 'lucide-react';

import { AddProductToOrderModal } from '@verone/orders/components/modals/AddProductToOrderModal';
import { OrderHeaderEditSection } from '@verone/orders/components/sections/OrderHeaderEditSection';
import { EditableOrderItemRow } from '@verone/orders/components/tables/EditableOrderItemRow';
import { useOrderItems } from '@verone/orders/hooks';

interface UniversalOrderDetailsModalProps {
  orderId: string | null;
  orderType: 'sales' | 'purchase' | null;
  open: boolean;
  onClose: () => void;
  initialEditMode?: boolean; // Mode édition initial optionnel
  onUpdate?: () => void; // Callback après modification
}

interface OrderHeader {
  id: string;
  order_number: string;
  status: string;
  created_at: string;
  expected_delivery_date: string | null;
  total_ttc: number;
  customer_name?: string;
  supplier_name?: string;
  billing_address?: string | null;
  shipping_address?: string | null;
  delivery_address?: string | null;
  payment_terms?: string | null;
  tax_rate?: number;
  eco_tax_vat_rate?: number | null;
  // 🆕 Info créateur
  creator_name?: string;
  creator_email?: string;
  channel_name?: string;
}

const statusLabels: Record<string, string> = {
  draft: 'Brouillon',
  validated: 'Validée',
  sent: 'Envoyée',
  received: 'Reçue',
  partially_received: 'Partiellement reçue',
  cancelled: 'Annulée',
  partially_shipped: 'Partiellement expédiée',
  shipped: 'Expédiée',
};

const statusColors: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-800',
  validated: 'bg-blue-100 text-blue-800',
  sent: 'bg-purple-100 text-purple-800',
  received: 'bg-green-100 text-green-800',
  partially_received: 'bg-yellow-100 text-yellow-800',
  cancelled: 'bg-red-100 text-red-800',
  partially_shipped: 'bg-yellow-100 text-yellow-800',
  shipped: 'bg-green-100 text-green-800',
};

export function UniversalOrderDetailsModal({
  orderId,
  orderType,
  open,
  onClose,
  initialEditMode = false, // Mode édition initial optionnel
  onUpdate,
}: UniversalOrderDetailsModalProps) {
  const [orderHeader, setOrderHeader] = useState<OrderHeader | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 🎯 Mode édition géré en local (peut basculer view ↔ edit)
  const [isEditMode, setIsEditMode] = useState(initialEditMode);
  const [showAddProductModal, setShowAddProductModal] = useState(false);

  // 🎯 Hook réutilisable pour charger les items avec images et métriques complètes
  const {
    items,
    loading: itemsLoading,
    error: itemsError,
    addItem,
    updateItem,
    removeItem,
    refetch,
  } = useOrderItems({
    orderId: orderId || '',
    orderType: orderType || 'purchase',
  });

  // 🎯 Hook useInlineEdit pour édition header
  const inlineEdit = useInlineEdit({
    salesOrderId: orderType === 'sales' ? orderId || undefined : undefined,
    purchaseOrderId:
      orderType === 'purchase' ? orderId || undefined : undefined,
    onUpdate: updatedData => {
      console.log('✅ Order header updated:', updatedData);
      // Mettre à jour le state local
      setOrderHeader(prev => (prev ? { ...prev, ...updatedData } : null));
      onUpdate?.();
    },
    onError: error => {
      console.error('❌ Order header update error:', error);
      setError(error);
    },
  });

  // Basculer entre view et edit
  const toggleMode = () => {
    if (!isEditMode && orderHeader) {
      // Démarrer édition
      inlineEdit.startEdit('order_header', {
        billing_address: orderHeader.billing_address,
        shipping_address: orderHeader.shipping_address,
        delivery_address: orderHeader.delivery_address,
        expected_delivery_date: orderHeader.expected_delivery_date,
        payment_terms: orderHeader.payment_terms,
        tax_rate: orderHeader.tax_rate,
        eco_tax_vat_rate: orderHeader.eco_tax_vat_rate,
      });
    } else {
      // Annuler édition
      inlineEdit.cancelEdit('order_header');
    }
    setIsEditMode(prev => !prev);
  };

  // Handler sauvegarde header
  const handleSaveHeader = async () => {
    const success = await inlineEdit.saveChanges('order_header');
    if (success) {
      setIsEditMode(false);
    }
  };

  // Handler modification champ header
  const handleHeaderChange = (field: string, value: string | number | null) => {
    inlineEdit.updateEditedData('order_header', { [field]: value });
  };

  // Handler ajout produit
  const handleAddProduct = async (data: any) => {
    try {
      await addItem(data);
      setShowAddProductModal(false);
      onUpdate?.(); // Notifier le parent
    } catch (error) {
      console.error(
        '[UniversalOrderDetailsModal] Erreur ajout produit:',
        error
      );
    }
  };

  // Handler modification item
  const handleUpdateItem = async (itemId: string, data: any) => {
    try {
      await updateItem(itemId, data);
      onUpdate?.(); // Notifier le parent
    } catch (error) {
      console.error(
        '[UniversalOrderDetailsModal] Erreur modification item:',
        error
      );
    }
  };

  // Handler suppression item
  const handleRemoveItem = async (itemId: string) => {
    try {
      await removeItem(itemId);
      onUpdate?.(); // Notifier le parent
    } catch (error) {
      console.error(
        '[UniversalOrderDetailsModal] Erreur suppression item:',
        error
      );
    }
  };

  // Charger uniquement l'en-tête de commande (items gérés par useOrderItems)
  useEffect(() => {
    if (!orderId || !orderType || !open) {
      setOrderHeader(null);
      return;
    }

    const fetchOrderHeader = async () => {
      setLoading(true);
      setError(null);

      try {
        const supabase = createClient();

        if (orderType === 'sales') {
          // Récupérer Sales Order SANS items
          // ⚠️ Type cast needed: Supabase types might be stale, eco_tax_vat_rate exists in DB
          const { data: order, error: orderError } = (await supabase
            .from('sales_orders')
            .select(
              'id, order_number, status, created_at, expected_delivery_date, total_ttc, customer_id, customer_type, billing_address, shipping_address, payment_terms, tax_rate, eco_tax_vat_rate, created_by, channel_id, sales_channels!left(id, name, code)'
            )
            .eq('id', orderId)
            .single()) as any;

          if (orderError) throw orderError;

          // Récupérer nom client selon type (jointure manuelle polymorphe)
          let customerName = 'Client inconnu';

          if (order.customer_type === 'organization' && order.customer_id) {
            const { data: org } = await supabase
              .from('organisations')
              .select('legal_name, trade_name')
              .eq('id', order.customer_id)
              .single();
            customerName =
              org?.trade_name || org?.legal_name || 'Organisation inconnue';
          } else if (
            order.customer_type === 'individual' &&
            order.customer_id
          ) {
            const { data: individual } = await supabase
              .from('individual_customers')
              .select('first_name, last_name')
              .eq('id', order.customer_id)
              .single();
            customerName = individual
              ? `${individual.first_name} ${individual.last_name}`
              : 'Particulier inconnu';
          }

          // 🆕 Récupérer info créateur via RPC
          let creatorName = '';
          let creatorEmail = '';

          if (order.created_by) {
            const { data: creatorInfo } = await (supabase.rpc as any)(
              'get_user_info',
              { p_user_id: order.created_by }
            );

            if (creatorInfo && creatorInfo.length > 0) {
              const firstName = creatorInfo[0].first_name || 'Utilisateur';
              const lastName = creatorInfo[0].last_name || '';
              creatorName = `${firstName} ${lastName}`.trim();
              creatorEmail = creatorInfo[0].email || '';
            }
          }

          // 🆕 Récupérer canal de vente
          const channelName = order.sales_channels?.name || '';

          setOrderHeader({
            id: order.id,
            order_number: order.order_number,
            status: order.status,
            created_at: order.created_at,
            expected_delivery_date: order.expected_delivery_date,
            total_ttc: order.total_ttc,
            customer_name: customerName,
            billing_address: order.billing_address
              ? JSON.stringify(order.billing_address)
              : null,
            shipping_address: order.shipping_address
              ? JSON.stringify(order.shipping_address)
              : null,
            payment_terms: order.payment_terms,
            tax_rate: order.tax_rate,
            eco_tax_vat_rate: order.eco_tax_vat_rate,
            creator_name: creatorName,
            creator_email: creatorEmail,
            channel_name: channelName,
          });
        } else if (orderType === 'purchase') {
          // Récupérer Purchase Order SANS items
          // ⚠️ Type cast needed: Supabase types might be stale, eco_tax_vat_rate exists in DB
          const { data: order, error: orderError } = (await supabase
            .from('purchase_orders')
            .select(
              'id, po_number, status, created_at, expected_delivery_date, total_ttc, supplier_id, delivery_address, payment_terms, tax_rate, eco_tax_vat_rate'
            )
            .eq('id', orderId)
            .single()) as any;

          if (orderError) throw orderError;

          // Récupérer nom fournisseur (supplier_id → organisations)
          let supplierName = 'Fournisseur inconnu';

          if (order.supplier_id) {
            const { data: supplier } = await supabase
              .from('organisations')
              .select('legal_name, trade_name')
              .eq('id', order.supplier_id)
              .single();
            supplierName =
              supplier?.trade_name ||
              supplier?.legal_name ||
              'Fournisseur inconnu';
          }

          setOrderHeader({
            id: order.id,
            order_number: order.po_number,
            status: order.status,
            created_at: order.created_at,
            expected_delivery_date: order.expected_delivery_date,
            total_ttc: order.total_ttc,
            supplier_name: supplierName,
            delivery_address: order.delivery_address
              ? JSON.stringify(order.delivery_address)
              : null,
            payment_terms: order.payment_terms,
            tax_rate: order.tax_rate,
            eco_tax_vat_rate: order.eco_tax_vat_rate,
          });
        }
      } catch (err: any) {
        console.error(
          '[UniversalOrderDetailsModal] Erreur chargement en-tête commande:',
          {
            orderId,
            orderType,
            errorMessage: err?.message,
            errorCode: err?.code,
            errorDetails: err?.details,
            errorHint: err?.hint,
            fullError: err,
          }
        );

        const errorMessage =
          err?.message ||
          `Impossible de charger la commande ${orderType === 'sales' ? 'client' : 'fournisseur'}`;

        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchOrderHeader();
  }, [orderId, orderType, open]);

  const formatDate = (date: string | null) => {
    if (!date) return 'Non définie';
    return new Date(date).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  // Calculer total à partir des items du hook
  // L'écotaxe est TOUJOURS par unité, donc on multiplie par la quantité
  const calculateTotal = () => {
    return items.reduce((sum, item) => {
      const subtotal =
        item.quantity *
        item.unit_price_ht *
        (1 - (item.discount_percentage || 0) / 100);
      return sum + subtotal + (item.eco_tax || 0) * item.quantity;
    }, 0);
  };

  // Loading combiné (header + items)
  const isLoading = loading || itemsLoading;
  const hasError = error || itemsError;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent
        className="max-w-5xl max-h-[95vh] overflow-y-auto"
        hideCloseButton
      >
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
              {orderType === 'sales' ? (
                <>
                  <ShoppingCart className="h-6 w-6" /> Commande Client
                </>
              ) : (
                <>
                  <TruckIcon className="h-6 w-6" /> Commande Fournisseur
                </>
              )}
            </DialogTitle>
            <div className="flex items-center gap-2">
              {/* Bouton Modifier uniquement si status = draft */}
              {orderHeader?.status === 'draft' && !isEditMode && (
                <ButtonV2 variant="outline" size="sm" onClick={toggleMode}>
                  <Edit className="h-4 w-4 mr-2" />
                  Modifier
                </ButtonV2>
              )}
              <ButtonV2 variant="ghost" size="sm" onClick={onClose}>
                <X className="h-4 w-4" />
              </ButtonV2>
            </div>
          </div>
        </DialogHeader>

        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            <span className="ml-3 text-gray-600">Chargement...</span>
          </div>
        )}

        {hasError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800 font-medium">Erreur</p>
            <p className="text-red-600 text-sm mt-1">{hasError}</p>
          </div>
        )}

        {!isLoading && !hasError && orderHeader && (
          <div className="space-y-6">
            {/* En-tête commande - Mode READ ou EDIT */}
            {isEditMode ? (
              <OrderHeaderEditSection
                orderType={orderType || 'purchase'}
                data={
                  inlineEdit.getEditedData('order_header') || {
                    billing_address: orderHeader.billing_address,
                    shipping_address: orderHeader.shipping_address,
                    delivery_address: orderHeader.delivery_address,
                    expected_delivery_date: orderHeader.expected_delivery_date,
                    payment_terms: orderHeader.payment_terms,
                    tax_rate: orderHeader.tax_rate,
                    eco_tax_vat_rate: orderHeader.eco_tax_vat_rate,
                  }
                }
                customerName={orderHeader.customer_name}
                supplierName={orderHeader.supplier_name}
                onChange={handleHeaderChange}
                readonly={false}
              />
            ) : (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-xl">
                        {orderHeader.order_number}
                      </CardTitle>
                      <p className="text-sm text-gray-600 mt-1">
                        Créée le {formatDate(orderHeader.created_at)}
                      </p>
                    </div>
                    <Badge
                      className={
                        statusColors[orderHeader.status] ||
                        'bg-gray-100 text-gray-800'
                      }
                    >
                      {statusLabels[orderHeader.status] || orderHeader.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    {orderHeader.customer_name && (
                      <div className="flex items-start gap-3">
                        <User className="h-5 w-5 text-gray-400 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-gray-700">
                            Client
                          </p>
                          <p className="text-sm text-gray-900">
                            {orderHeader.customer_name}
                          </p>
                        </div>
                      </div>
                    )}
                    {orderHeader.supplier_name && (
                      <div className="flex items-start gap-3">
                        <TruckIcon className="h-5 w-5 text-gray-400 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-gray-700">
                            Fournisseur
                          </p>
                          <p className="text-sm text-gray-900">
                            {orderHeader.supplier_name}
                          </p>
                        </div>
                      </div>
                    )}
                    <div className="flex items-start gap-3">
                      <Calendar className="h-5 w-5 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-gray-700">
                          Livraison prévue
                        </p>
                        <p className="text-sm text-gray-900">
                          {formatDate(orderHeader.expected_delivery_date)}
                        </p>
                      </div>
                    </div>
                    {orderHeader.creator_name && (
                      <div className="flex items-start gap-3">
                        <User className="h-5 w-5 text-gray-400 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-gray-700">
                            Créateur
                          </p>
                          <p className="text-sm text-gray-900">
                            {orderHeader.creator_name}
                            {orderHeader.creator_email && (
                              <span className="text-gray-500">
                                {' '}
                                ({orderHeader.creator_email})
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                    )}
                    {orderHeader.channel_name && (
                      <div className="flex items-start gap-3">
                        <ShoppingCart className="h-5 w-5 text-gray-400 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-gray-700">
                            Source
                          </p>
                          <p className="text-sm text-gray-900">
                            {orderHeader.channel_name}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Articles avec composant réutilisable */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Articles ({items.length})
                  </CardTitle>
                  {/* Bouton Ajouter Produit (mode edit uniquement) */}
                  {isEditMode && orderHeader?.status === 'draft' && (
                    <ButtonV2
                      variant="outline"
                      size="sm"
                      onClick={() => setShowAddProductModal(true)}
                    >
                      <Package className="h-4 w-4 mr-2" />
                      Ajouter un produit
                    </ButtonV2>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Produit</TableHead>
                      <TableHead>Qté</TableHead>
                      <TableHead>Prix HT</TableHead>
                      <TableHead>Remise</TableHead>
                      <TableHead>Éco-taxe</TableHead>
                      {orderType === 'sales' && <TableHead>TVA</TableHead>}
                      <TableHead>Total HT</TableHead>
                      <TableHead />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map(item => (
                      <EditableOrderItemRow
                        key={item.id}
                        item={item}
                        orderType={orderType || 'purchase'}
                        readonly={!isEditMode}
                        onUpdate={handleUpdateItem}
                        onDelete={handleRemoveItem}
                      />
                    ))}
                  </TableBody>
                </Table>

                <Separator className="my-4" />

                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold">Total HT</span>
                  <span className="text-2xl font-bold">
                    {formatCurrency(calculateTotal())}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Modal Ajout Produit */}
        <AddProductToOrderModal
          open={showAddProductModal}
          onClose={() => setShowAddProductModal(false)}
          orderType={orderType || 'purchase'}
          onAdd={handleAddProduct}
        />

        {/* Footer avec boutons Enregistrer/Annuler en mode édition */}
        {isEditMode && orderHeader && (
          <DialogFooter className="border-t pt-4">
            <ButtonV2
              variant="outline"
              onClick={toggleMode}
              disabled={inlineEdit.isSaving('order_header')}
            >
              <X className="h-4 w-4 mr-2" />
              Annuler
            </ButtonV2>
            <ButtonV2
              onClick={handleSaveHeader}
              disabled={
                !inlineEdit.hasChanges('order_header') ||
                inlineEdit.isSaving('order_header')
              }
            >
              {inlineEdit.isSaving('order_header') ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Enregistrement...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Enregistrer
                </>
              )}
            </ButtonV2>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}

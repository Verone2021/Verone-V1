'use client';

import { useState, useEffect, useMemo } from 'react';
import { Plus } from 'lucide-react';
import { ButtonV2 } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { CreateOrganisationModal } from './create-organisation-modal';
import { SupplierSelector } from './supplier-selector';
import { AddProductToOrderModal } from './add-product-to-order-modal';
import { EditableOrderItemRow } from './editable-order-item-row';
import { EcoTaxVatInput } from '@/components/forms/eco-tax-vat-input';
import { useOrganisations, Organisation } from '@/shared/modules/organisations/hooks';
import { useOrderItems, CreateOrderItemData } from '@/shared/modules/orders/hooks';
import {
  usePurchaseOrders,
  CreatePurchaseOrderData,
} from '@/shared/modules/orders/hooks';
import { formatCurrency } from '@/lib/utils';
import { useToast } from '@/shared/modules/common/hooks';
import type { Database } from '@/types/database';

type PurchaseOrder = Database['public']['Tables']['purchase_orders']['Row'];

/**
 * Modal Universel Commandes Fournisseurs (Création + Édition)
 *
 * Utilise les composants universels pour maximum réutilisabilité :
 * - AddProductToOrderModal pour ajouter produits
 * - EditableOrderItemRow pour éditer items
 * - useOrderItems hook pour CRUD items
 *
 * @example
 * // Mode Création
 * <PurchaseOrderFormModal />
 *
 * @example
 * // Mode Édition
 * <PurchaseOrderFormModal
 *   order={existingOrder}
 *   isOpen={true}
 *   onClose={() => setOpen(false)}
 * />
 */

interface PurchaseOrderFormModalProps {
  order?: PurchaseOrder; // Si fourni, mode ÉDITION
  isOpen?: boolean;
  onClose?: () => void;
  onSuccess?: () => void;
  prefilledProduct?: any;
  prefilledSupplier?: string;
}

export function PurchaseOrderFormModal({
  order,
  isOpen,
  onClose,
  onSuccess,
  prefilledProduct,
  prefilledSupplier,
}: PurchaseOrderFormModalProps) {
  const isEditMode = !!order;
  const [open, setOpen] = useState(isOpen || false);
  const [loading, setLoading] = useState(false);

  // États form métadonnées
  const [selectedSupplierId, setSelectedSupplierId] = useState(
    order?.supplier_id || ''
  );
  const [selectedSupplier, setSelectedSupplier] = useState<Organisation | null>(
    null
  );
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState(
    order?.expected_delivery_date
      ? new Date(order.expected_delivery_date).toISOString().split('T')[0]
      : ''
  );
  const [deliveryAddress, setDeliveryAddress] = useState<string>(
    (typeof order?.delivery_address === 'string'
      ? order.delivery_address
      : null) || 'Groupe DSA - (Verone)\n4, rue du Pérou\n91300 Massy\nFrance'
  );
  const [notes, setNotes] = useState(order?.notes || '');
  const [ecoTaxVatRate, setEcoTaxVatRate] = useState<number | null>(
    order?.eco_tax_vat_rate ?? null
  );

  // Modal ajout produit
  const [showAddProductModal, setShowAddProductModal] = useState(false);

  // Hooks
  const {
    organisations: suppliers,
    getOrganisationById,
    refetch: refetchSuppliers,
  } = useOrganisations({
    type: 'supplier',
    is_active: true,
  });
  const {
    items,
    loading: itemsLoading,
    addItem,
    updateItem,
    removeItem,
    refetch: refetchItems,
  } = useOrderItems({
    orderId: order?.id,
    orderType: 'purchase',
  });
  const { createOrder, updateOrder } = usePurchaseOrders();
  const { toast } = useToast();

  // Règle métier : bloquer édition si commande reçue ou annulée
  const isBlocked = useMemo(() => {
    if (!isEditMode) return false;
    return order.status === 'received' || order.status === 'cancelled';
  }, [isEditMode, order]);

  // Synchroniser avec props externes
  useEffect(() => {
    if (typeof isOpen !== 'undefined') {
      setOpen(isOpen);
    }
  }, [isOpen]);

  // Charger fournisseur sélectionné
  useEffect(() => {
    if (selectedSupplierId) {
      getOrganisationById(selectedSupplierId).then(setSelectedSupplier);
    } else {
      setSelectedSupplier(null);
    }
  }, [selectedSupplierId, getOrganisationById]);

  // Pré-remplir avec produit fourni (mode création échantillon)
  useEffect(() => {
    if (prefilledProduct && open && !isEditMode) {
      // Auto-select supplier
      if (prefilledProduct.supplier_id) {
        setSelectedSupplierId(prefilledProduct.supplier_id);
      } else if (prefilledSupplier) {
        setSelectedSupplierId(prefilledSupplier);
      }

      // Ajouter note échantillon
      if (prefilledProduct.requires_sample) {
        const sampleNote = `Commande d'échantillon pour le produit "${prefilledProduct.name || 'sans nom'}"`;
        setNotes((prev: string) =>
          prev ? `${prev}\n\n${sampleNote}` : sampleNote
        );
      }
    }
  }, [prefilledProduct, open, isEditMode, prefilledSupplier]);

  // Calculs totaux (inclut eco_tax)
  const totalHT = useMemo(() => {
    return items.reduce((sum, item) => {
      const subtotal =
        item.quantity *
        item.unit_price_ht *
        (1 - (item.discount_percentage || 0) / 100);
      return sum + subtotal + (item.eco_tax || 0);
    }, 0);
  }, [items]);

  const totalTTC = totalHT * 1.2; // TVA 20%

  // Gérer changement fournisseur
  const handleSupplierChange = async (supplierId: string | null) => {
    setSelectedSupplierId(supplierId || '');
  };

  // Handler création nouveau fournisseur
  const handleSupplierCreated = async (
    supplierId: string,
    supplierName: string
  ) => {
    await refetchSuppliers();
    setSelectedSupplierId(supplierId);
    toast({
      title: '✅ Fournisseur créé et sélectionné',
      description: `${supplierName} a été créé et sélectionné automatiquement.`,
    });
  };

  // Handler ajout produit (via modal universel)
  const handleAddProduct = async (data: CreateOrderItemData) => {
    if (!isEditMode) {
      // Mode création : impossible d'ajouter avant création commande
      toast({
        variant: 'destructive',
        title: "Impossible d'ajouter un produit",
        description: "Créez d'abord la commande pour ajouter des produits.",
      });
      return;
    }

    try {
      await addItem(data);
      setShowAddProductModal(false);
      toast({
        title: '✅ Produit ajouté',
        description: 'Le produit a été ajouté à la commande.',
      });
    } catch (error) {
      console.error('❌ Erreur ajout produit:', error);
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description:
          error instanceof Error ? error.message : 'Erreur ajout produit',
      });
    }
  };

  // Handler modification item (via composant universel)
  const handleUpdateItem = async (itemId: string, data: any) => {
    try {
      await updateItem(itemId, data);
    } catch (error) {
      console.error('❌ Erreur modification item:', error);
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Impossible de modifier le produit',
      });
    }
  };

  // Handler suppression item
  const handleRemoveItem = async (itemId: string) => {
    try {
      await removeItem(itemId);
      toast({
        title: '✅ Produit supprimé',
        description: 'Le produit a été retiré de la commande.',
      });
    } catch (error) {
      console.error('❌ Erreur suppression item:', error);
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Impossible de supprimer le produit',
      });
    }
  };

  const resetForm = () => {
    setSelectedSupplierId('');
    setSelectedSupplier(null);
    setExpectedDeliveryDate('');
    setDeliveryAddress(
      'Groupe DSA - (Verone)\n4, rue du Pérou\n91300 Massy\nFrance'
    );
    setNotes('');
    setEcoTaxVatRate(null);
  };

  const handleClose = () => {
    setOpen(false);
    if (onClose) {
      onClose();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation commune
    if (!selectedSupplierId) {
      toast({
        variant: 'destructive',
        title: 'Fournisseur requis',
        description: 'Veuillez sélectionner un fournisseur',
      });
      return;
    }

    setLoading(true);
    try {
      if (isEditMode) {
        // MODE ÉDITION : Mettre à jour métadonnées uniquement
        // Les items sont modifiés via useOrderItems en temps réel
        await updateOrder(order.id, {
          supplier_id: selectedSupplierId,
          expected_delivery_date: expectedDeliveryDate || undefined,
          payment_terms: selectedSupplier?.payment_terms || undefined,
          delivery_address: deliveryAddress || undefined,
          notes: notes || undefined,
          eco_tax_vat_rate: ecoTaxVatRate,
        } as any); // Cast car UpdatePurchaseOrderData type incomplet

        toast({
          title: '✅ Commande mise à jour',
          description: `Commande ${order.po_number} modifiée avec succès`,
        });
      } else {
        // MODE CRÉATION : Impossible sans items (UX)
        toast({
          variant: 'destructive',
          title: 'Création impossible',
          description:
            'Utilisez le hook usePurchaseOrders avec createOrder et ajoutez des items après création.',
        });
        return;
      }

      handleClose();
      onSuccess?.();
    } catch (error) {
      console.error('❌ Erreur submit:', error);
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description:
          error instanceof Error
            ? error.message
            : 'Erreur lors de la sauvegarde',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen && onClose) {
      onClose();
    }
  };

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={
          typeof isOpen !== 'undefined' ? handleOpenChange : setOpen
        }
      >
        {typeof isOpen === 'undefined' && !isEditMode && (
          <DialogTrigger asChild>
            <ButtonV2 className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Nouvelle commande
            </ButtonV2>
          </DialogTrigger>
        )}
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {isEditMode
                ? `Modifier Commande ${order.po_number}`
                : 'Nouvelle Commande Fournisseur'}
            </DialogTitle>
            <DialogDescription>
              {isEditMode
                ? 'Modifier les informations et les produits de la commande'
                : "Créer une nouvelle commande d'approvisionnement"}
            </DialogDescription>
          </DialogHeader>

          {/* Alerte blocage édition */}
          {isBlocked && order && (
            <div className="p-4 mb-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800 font-medium">
                ⚠️ Édition bloquée : Cette commande est{' '}
                {order.status === 'received' ? 'reçue' : 'annulée'}
              </p>
              <p className="text-xs text-red-600 mt-1">
                Les modifications ne sont pas autorisées pour ce statut.
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Informations générales */}
            <Card>
              <CardHeader>
                <CardTitle>Informations générales</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <SupplierSelector
                        selectedSupplierId={selectedSupplierId || null}
                        onSupplierChange={handleSupplierChange}
                        disabled={loading || isBlocked}
                        required={true}
                        label="Fournisseur"
                        placeholder="Sélectionner un fournisseur..."
                      />
                    </div>
                    {!isEditMode && (
                      <CreateOrganisationModal
                        onOrganisationCreated={handleSupplierCreated}
                        defaultType="supplier"
                      />
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="deliveryDate">Date de livraison prévue</Label>
                  <Input
                    id="deliveryDate"
                    type="date"
                    value={expectedDeliveryDate}
                    onChange={e => setExpectedDeliveryDate(e.target.value)}
                    disabled={isBlocked}
                  />
                </div>

                <div className="space-y-2 col-span-2">
                  <Label htmlFor="deliveryAddress">
                    Adresse de livraison (Entrepôt)
                  </Label>
                  <Textarea
                    id="deliveryAddress"
                    value={deliveryAddress}
                    onChange={e => setDeliveryAddress(e.target.value)}
                    className="min-h-[100px] resize-none"
                    disabled={isBlocked}
                  />
                </div>

                <div className="col-span-2">
                  <EcoTaxVatInput
                    value={ecoTaxVatRate}
                    onChange={setEcoTaxVatRate}
                    defaultTaxRate={20}
                    disabled={isBlocked}
                  />
                </div>

                {selectedSupplier && selectedSupplier.payment_terms && (
                  <div className="space-y-2 col-span-2 p-3 bg-gray-50 border rounded-lg">
                    <Label className="text-sm font-medium">
                      Conditions de paiement du fournisseur
                    </Label>
                    <p className="text-sm text-gray-700">
                      {selectedSupplier.payment_terms}
                    </p>
                  </div>
                )}

                <div className="space-y-2 col-span-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    placeholder="Notes additionnelles..."
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    className="min-h-[80px]"
                    disabled={isBlocked}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Articles (MODE ÉDITION UNIQUEMENT) */}
            {isEditMode && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Articles</CardTitle>
                      <CardDescription>
                        {items.length} article(s) dans la commande
                      </CardDescription>
                    </div>
                    {!isBlocked && (
                      <ButtonV2
                        type="button"
                        variant="outline"
                        onClick={() => setShowAddProductModal(true)}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Ajouter un produit
                      </ButtonV2>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {itemsLoading ? (
                    <div className="text-center py-8 text-gray-500">
                      Chargement des articles...
                    </div>
                  ) : items.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      Aucun article dans la commande. Cliquez sur "Ajouter un
                      produit" pour commencer.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Produit</TableHead>
                            <TableHead>Quantité</TableHead>
                            <TableHead>Prix unitaire HT</TableHead>
                            <TableHead>Remise (%)</TableHead>
                            <TableHead>Éco-taxe (€)</TableHead>
                            <TableHead>Total HT</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {items.map(item => (
                            <EditableOrderItemRow
                              key={item.id}
                              item={item}
                              orderType="purchase"
                              onUpdate={handleUpdateItem}
                              onDelete={handleRemoveItem}
                              readonly={isBlocked}
                            />
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Totaux (MODE ÉDITION UNIQUEMENT) */}
            {isEditMode && items.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Récapitulatif</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-sm text-gray-600">Total HT</p>
                      <p className="text-lg font-semibold">
                        {formatCurrency(totalHT)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">TVA (20%)</p>
                      <p className="text-lg font-semibold">
                        {formatCurrency(totalTTC - totalHT)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Total TTC</p>
                      <p className="text-xl font-bold">
                        {formatCurrency(totalTTC)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-4">
              <ButtonV2 type="button" variant="outline" onClick={handleClose}>
                {isEditMode ? 'Fermer' : 'Annuler'}
              </ButtonV2>
              {!isBlocked && (
                <ButtonV2
                  type="submit"
                  disabled={loading || !selectedSupplierId}
                >
                  {loading
                    ? 'Enregistrement...'
                    : isEditMode
                      ? 'Enregistrer'
                      : 'Créer la commande'}
                </ButtonV2>
              )}
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal Ajout Produit Universel */}
      {isEditMode && (
        <AddProductToOrderModal
          open={showAddProductModal}
          onClose={() => setShowAddProductModal(false)}
          orderType="purchase"
          onAdd={handleAddProduct}
        />
      )}
    </>
  );
}

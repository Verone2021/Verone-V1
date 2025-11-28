'use client';

import { useState, useEffect, useMemo } from 'react';

import { useToast } from '@verone/common/hooks';
import type { Organisation } from '@verone/organisations/hooks';
import { useOrganisations } from '@verone/organisations/hooks';
import type { SelectedProduct } from '@verone/products/components/selectors/UniversalProductSelectorV2';
import { UniversalProductSelectorV2 } from '@verone/products/components/selectors/UniversalProductSelectorV2';
import type { Database } from '@verone/types';
import { ButtonV2 } from '@verone/ui';
import { EcoTaxVatInput } from '@verone/ui';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@verone/ui';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@verone/ui';
import { Input } from '@verone/ui';
import { Label } from '@verone/ui';
import { Table, TableBody, TableHead, TableHeader, TableRow } from '@verone/ui';
import { Textarea } from '@verone/ui';
import { formatCurrency } from '@verone/utils';
import { Plus } from 'lucide-react';

import type { CreateOrderItemData } from '@verone/orders/hooks';
import { useOrderItems } from '@verone/orders/hooks';
import { usePurchaseOrders } from '@verone/orders/hooks';

import { CreateOrganisationModal } from './create-organisation-modal';
import { EditableOrderItemRow } from './editable-order-item-row';
import { SupplierSelector } from './supplier-selector';

type PurchaseOrder = Database['public']['Tables']['purchase_orders']['Row'];

// Interface pour items locaux (mode création)
// Note: utilise `products` (pluriel) pour compatibilité avec EditableOrderItemRow
interface LocalOrderItem {
  id: string;
  product_id: string;
  quantity: number;
  unit_price_ht: number;
  discount_percentage: number;
  eco_tax: number;
  notes?: string;
  products?: {
    id: string;
    name: string;
    sku: string;
    primary_image_url?: string;
    product_images?: Array<{ public_url: string; is_primary: boolean }>;
  };
}

// ✅ Payment Terms Options (ENUM mapping - aligné avec CommercialEditSection)
const paymentTermsOptions = [
  { value: 'PREPAID', label: 'Prépaiement obligatoire', days: 0 },
  { value: 'NET_30', label: '30 jours net', days: 30 },
  { value: 'NET_60', label: '60 jours net', days: 60 },
  { value: 'NET_90', label: '90 jours net', days: 90 },
];

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
    // @ts-ignore - eco_tax_vat_rate exists in DB, types might be stale
    order?.eco_tax_vat_rate ?? null
  );
  const [paymentTerms, setPaymentTerms] = useState(order?.payment_terms || '');

  // Frais additionnels (fournisseurs)
  const [shippingCostHt, setShippingCostHt] = useState<number>(
    (order as any)?.shipping_cost_ht || 0
  );
  const [customsCostHt, setCustomsCostHt] = useState<number>(
    (order as any)?.customs_cost_ht || 0
  );
  const [insuranceCostHt, setInsuranceCostHt] = useState<number>(
    (order as any)?.insurance_cost_ht || 0
  );

  // Modal ajout produit
  const [showProductSelector, setShowProductSelector] = useState(false);

  // État items local pour mode création (comme SalesOrderFormModal)
  const [localItems, setLocalItems] = useState<LocalOrderItem[]>([]);

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

  // Items à afficher : locaux en création, hook en édition
  const displayItems = isEditMode ? items : localItems;

  // Calculs totaux (inclut eco_tax + frais additionnels)
  // ✅ FIX: L'écotaxe est PAR UNITÉ, donc multipliée par la quantité
  const totalHT = useMemo(() => {
    return displayItems.reduce((sum, item) => {
      const subtotal =
        item.quantity *
        item.unit_price_ht *
        (1 - (item.discount_percentage || 0) / 100);
      const itemEcoTax = (item.eco_tax || 0) * item.quantity; // Écotaxe × quantité
      return sum + subtotal + itemEcoTax;
    }, 0);
  }, [displayItems]);

  // Total des frais additionnels
  const totalCharges = useMemo(() => {
    return shippingCostHt + customsCostHt + insuranceCostHt;
  }, [shippingCostHt, customsCostHt, insuranceCostHt]);

  const totalTTC = (totalHT + totalCharges) * 1.2; // TVA 20%

  // Memoize excludeProductIds pour éviter re-renders infinis
  const excludeProductIds = useMemo(
    () => displayItems.map(item => item.product_id),
    [displayItems]
  );

  // Gérer changement fournisseur
  const handleSupplierChange = async (supplierId: string | null) => {
    setSelectedSupplierId(supplierId || '');

    // Règle métier : Vider les items locaux au changement de fournisseur (évite mélange produits)
    if (!isEditMode) {
      setLocalItems([]);
    }

    // Pré-remplir automatiquement les conditions de paiement
    if (supplierId) {
      const supplier = await getOrganisationById(supplierId);
      if (supplier && supplier.payment_terms) {
        setPaymentTerms(supplier.payment_terms);
      } else {
        setPaymentTerms('');
      }
    } else {
      setPaymentTerms('');
    }
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

  // Handler sélection produits depuis UniversalProductSelectorV2
  const handleProductsSelect = async (selectedProducts: SelectedProduct[]) => {
    try {
      if (isEditMode) {
        // MODE ÉDITION : utiliser useOrderItems hook (existant)
        for (const product of selectedProducts) {
          const itemData: CreateOrderItemData = {
            product_id: product.id,
            quantity: product.quantity || 1,
            unit_price_ht: product.unit_price || 0,
            discount_percentage: product.discount_percentage || 0,
            eco_tax: 0,
            notes: product.notes || '',
          };
          await addItem(itemData);
        }
      } else {
        // MODE CRÉATION : ajouter aux items locaux
        // ✅ Utiliser cost_price (prix d'achat) et eco_tax_default (éco-taxe) du produit
        const newItems: LocalOrderItem[] = selectedProducts.map(product => ({
          id: `temp-${Date.now()}-${product.id}`,
          product_id: product.id,
          quantity: product.quantity || 1,
          unit_price_ht: product.cost_price ?? 0, // Prix d'achat depuis fiche produit
          discount_percentage: product.discount_percentage || 0,
          eco_tax:
            (product as { eco_tax_default?: number }).eco_tax_default ?? 0, // Éco-taxe depuis fiche produit
          notes: product.notes || '',
          products: {
            id: product.id,
            name: product.name,
            sku: product.sku || '',
            primary_image_url:
              product.product_images?.find(img => img.is_primary)?.public_url ||
              product.product_images?.[0]?.public_url,
            product_images: product.product_images,
          },
        }));
        setLocalItems(prev => [...prev, ...newItems]);
      }

      setShowProductSelector(false);

      toast({
        title: 'Produits ajoutés',
        description: `${selectedProducts.length} produit(s) ajouté(s)`,
      });
    } catch (error) {
      console.error('Erreur ajout produits:', error);
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description:
          error instanceof Error ? error.message : 'Erreur ajout produits',
      });
    }
  };

  // Handler modification item (gère les deux modes)
  const handleUpdateItem = async (itemId: string, data: any) => {
    if (isEditMode) {
      // Mode édition : utiliser hook useOrderItems
      try {
        await updateItem(itemId, data);
      } catch (error) {
        console.error('Erreur modification item:', error);
        toast({
          variant: 'destructive',
          title: 'Erreur',
          description: 'Impossible de modifier le produit',
        });
      }
    } else {
      // Mode création : modifier items locaux
      setLocalItems(prev =>
        prev.map(item => (item.id === itemId ? { ...item, ...data } : item))
      );
    }
  };

  // Handler suppression item (gère les deux modes)
  const handleRemoveItem = async (itemId: string) => {
    if (isEditMode) {
      // Mode édition : utiliser hook useOrderItems
      try {
        await removeItem(itemId);
        toast({
          title: 'Produit supprimé',
          description: 'Le produit a été retiré de la commande.',
        });
      } catch (error) {
        console.error('Erreur suppression item:', error);
        toast({
          variant: 'destructive',
          title: 'Erreur',
          description: 'Impossible de supprimer le produit',
        });
      }
    } else {
      // Mode création : supprimer des items locaux
      setLocalItems(prev => prev.filter(item => item.id !== itemId));
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
    setPaymentTerms('');
    setLocalItems([]); // Réinitialiser items locaux
    // Réinitialiser frais additionnels
    setShippingCostHt(0);
    setCustomsCostHt(0);
    setInsuranceCostHt(0);
  };

  const handleClose = () => {
    setOpen(false);
    if (onClose) {
      onClose();
    }
  };

  const handleSubmitConfirmed = async () => {
    if (!selectedSupplierId) return;

    setLoading(true);
    try {
      if (isEditMode) {
        // MODE ÉDITION : Mettre à jour métadonnées uniquement
        // Les items sont modifiés via useOrderItems en temps réel
        await updateOrder(order.id, {
          supplier_id: selectedSupplierId,
          expected_delivery_date: expectedDeliveryDate || undefined,
          payment_terms: paymentTerms || undefined,
          delivery_address: deliveryAddress || undefined,
          notes: notes || undefined,
          eco_tax_vat_rate: ecoTaxVatRate,
          // Frais additionnels fournisseurs
          shipping_cost_ht: shippingCostHt || 0,
          customs_cost_ht: customsCostHt || 0,
          insurance_cost_ht: insuranceCostHt || 0,
        } as any); // Cast car UpdatePurchaseOrderData type incomplet

        toast({
          title: '✅ Commande mise à jour',
          description: `Commande ${order.po_number} modifiée avec succès`,
        });
      } else {
        // MODE CRÉATION : Créer commande avec items locaux
        const newOrder = await createOrder({
          supplier_id: selectedSupplierId,
          expected_delivery_date: expectedDeliveryDate || undefined,
          delivery_address: deliveryAddress || undefined,
          payment_terms: paymentTerms || undefined,
          notes: notes || undefined,
          eco_tax_vat_rate: ecoTaxVatRate,
          // Frais additionnels fournisseurs
          shipping_cost_ht: shippingCostHt || 0,
          customs_cost_ht: customsCostHt || 0,
          insurance_cost_ht: insuranceCostHt || 0,
          items: localItems.map(item => ({
            product_id: item.product_id,
            quantity: item.quantity,
            unit_price_ht: item.unit_price_ht,
            discount_percentage: item.discount_percentage,
            eco_tax: item.eco_tax,
            notes: item.notes,
          })),
        });

        toast({
          title: 'Commande créée',
          description: `Commande ${newOrder?.po_number || ''} créée avec ${localItems.length} article(s)`,
        });

        resetForm();
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

    // Soumission directe sans confirmation
    await handleSubmitConfirmed();
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
                        required
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

                {/* Conditions de paiement READ-ONLY (héritées de l'organisation) */}
                <div className="space-y-2 col-span-2">
                  <Label>Conditions de paiement</Label>
                  {paymentTerms ? (
                    <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-xs text-green-600 font-medium mb-1">
                            💳 CONDITIONS NÉGOCIÉES
                          </div>
                          <div className="text-sm font-semibold text-green-800">
                            {paymentTermsOptions.find(
                              opt => opt.value === paymentTerms
                            )?.label || paymentTerms}
                          </div>
                        </div>
                      </div>
                      <p className="text-xs text-green-600 mt-2">
                        ℹ️ Héritées de la fiche fournisseur (non modifiables)
                      </p>
                    </div>
                  ) : (
                    <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 text-center">
                      <p className="text-sm text-gray-500">
                        {selectedSupplier
                          ? 'Aucune condition définie pour ce fournisseur'
                          : 'Sélectionnez un fournisseur pour afficher les conditions'}
                      </p>
                    </div>
                  )}
                </div>

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

            {/* Frais additionnels fournisseurs */}
            <Card>
              <CardHeader>
                <CardTitle>Frais additionnels</CardTitle>
                <CardDescription>
                  Frais de transport, douane et assurance (optionnels)
                </CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="shippingCostHt">
                    Frais de livraison HT (€)
                  </Label>
                  <Input
                    id="shippingCostHt"
                    type="number"
                    min="0"
                    step="0.01"
                    value={shippingCostHt || ''}
                    onChange={e =>
                      setShippingCostHt(parseFloat(e.target.value) || 0)
                    }
                    placeholder="0.00"
                    disabled={isBlocked}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="customsCostHt">Frais de douane HT (€)</Label>
                  <Input
                    id="customsCostHt"
                    type="number"
                    min="0"
                    step="0.01"
                    value={customsCostHt || ''}
                    onChange={e =>
                      setCustomsCostHt(parseFloat(e.target.value) || 0)
                    }
                    placeholder="0.00"
                    disabled={isBlocked}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="insuranceCostHt">
                    Frais d'assurance HT (€)
                  </Label>
                  <Input
                    id="insuranceCostHt"
                    type="number"
                    min="0"
                    step="0.01"
                    value={insuranceCostHt || ''}
                    onChange={e =>
                      setInsuranceCostHt(parseFloat(e.target.value) || 0)
                    }
                    placeholder="0.00"
                    disabled={isBlocked}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Articles (disponible en création ET édition) */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Articles</CardTitle>
                    <CardDescription>
                      {displayItems.length} article(s){' '}
                      {isEditMode ? 'dans la commande' : 'à ajouter'}
                    </CardDescription>
                  </div>
                  {!isBlocked && (
                    <ButtonV2
                      type="button"
                      variant="outline"
                      onClick={() => setShowProductSelector(true)}
                      disabled={!selectedSupplierId}
                      title={
                        !selectedSupplierId
                          ? "Veuillez sélectionner un fournisseur d'abord"
                          : undefined
                      }
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Ajouter des produits
                    </ButtonV2>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {isEditMode && itemsLoading ? (
                  <div className="text-center py-8 text-gray-500">
                    Chargement des articles...
                  </div>
                ) : displayItems.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    Aucun article. Cliquez sur "Ajouter des produits" pour
                    commencer.
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
                        {displayItems.map(item => (
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

            {/* Totaux (affichés si items présents) */}
            {displayItems.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Récapitulatif</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-4 gap-4 text-center">
                    <div>
                      <p className="text-sm text-gray-600">Total HT produits</p>
                      <p className="text-lg font-semibold">
                        {formatCurrency(totalHT)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">
                        Frais additionnels
                      </p>
                      <p className="text-lg font-semibold">
                        {formatCurrency(totalCharges)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">TVA (20%)</p>
                      <p className="text-lg font-semibold">
                        {formatCurrency(totalTTC - totalHT - totalCharges)}
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

      {/* Modal UniversalProductSelectorV2 - disponible en création ET édition */}
      {showProductSelector && (
        <UniversalProductSelectorV2
          open={showProductSelector}
          onClose={() => setShowProductSelector(false)}
          onSelect={handleProductsSelect}
          mode="multi"
          context="orders"
          title="Sélectionner des produits pour la commande"
          description="Choisissez les produits à ajouter. Vous pourrez ajuster quantités et prix après sélection."
          excludeProductIds={excludeProductIds}
          supplierId={selectedSupplierId || null}
          showImages
          showQuantity
          showPricing
        />
      )}
    </>
  );
}

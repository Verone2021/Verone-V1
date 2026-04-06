'use client';

import { useState, useEffect, useMemo } from 'react';

import { useToast } from '@verone/common/hooks';
import type { Organisation } from '@verone/organisations/hooks';
import { useOrganisations } from '@verone/organisations/hooks';
import type { SelectedProduct } from '@verone/products/components/selectors/UniversalProductSelectorV2';

import type {
  CreateOrderItemData,
  OrderItem,
  UpdatePurchaseOrderData,
} from '@verone/orders/hooks';
import { useOrderItems } from '@verone/orders/hooks';
import { usePurchaseOrders } from '@verone/orders/hooks';

import type { LocalOrderItem, PurchaseOrderFormModalProps } from './types';

export function usePurchaseOrderForm(props: PurchaseOrderFormModalProps) {
  const {
    order,
    isOpen,
    onClose,
    onSuccess,
    prefilledProduct,
    prefilledSupplier,
  } = props;

  const isEditMode = !!order;
  const [open, setOpen] = useState(isOpen ?? false);
  const [loading, setLoading] = useState(false);

  // États form métadonnées
  const [selectedSupplierId, setSelectedSupplierId] = useState(
    order?.supplier_id ?? ''
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
      : null) ?? 'Groupe DSA - (Verone)\n4, rue du Pérou\n91300 Massy\nFrance'
  );
  const [notes, setNotes] = useState(order?.notes ?? '');
  const [ecoTaxVatRate, setEcoTaxVatRate] = useState<number | null>(
    order?.eco_tax_vat_rate ?? null
  );
  const [paymentTerms, setPaymentTerms] = useState(order?.payment_terms ?? '');

  // Frais additionnels (fournisseurs)
  const [shippingCostHt, setShippingCostHt] = useState<number>(
    (order as unknown as { shipping_cost_ht?: number })?.shipping_cost_ht ?? 0
  );
  const [customsCostHt, setCustomsCostHt] = useState<number>(
    (order as unknown as { customs_cost_ht?: number })?.customs_cost_ht ?? 0
  );
  const [insuranceCostHt, setInsuranceCostHt] = useState<number>(
    (order as unknown as { insurance_cost_ht?: number })?.insurance_cost_ht ?? 0
  );

  // Modal ajout produit
  const [showProductSelector, setShowProductSelector] = useState(false);

  // État items local pour mode création
  const [localItems, setLocalItems] = useState<LocalOrderItem[]>([]);

  // Hooks
  const {
    organisations: _suppliers,
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
    refetch: _refetchItems,
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
      void getOrganisationById(selectedSupplierId).then(setSelectedSupplier);
    } else {
      setSelectedSupplier(null);
    }
  }, [selectedSupplierId, getOrganisationById]);

  // Pré-remplir avec produit fourni (mode création échantillon)
  useEffect(() => {
    if (prefilledProduct && open && !isEditMode) {
      if (prefilledProduct.supplier_id) {
        setSelectedSupplierId(prefilledProduct.supplier_id);
      } else if (prefilledSupplier) {
        setSelectedSupplierId(prefilledSupplier);
      }

      if (prefilledProduct.requires_sample) {
        const sampleNote = `Commande d'échantillon pour le produit "${prefilledProduct.name ?? 'sans nom'}"`;
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
      const itemEcoTax = (item.eco_tax || 0) * item.quantity;
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
    () => displayItems.map((item: { product_id: string }) => item.product_id),
    [displayItems]
  );

  // Gérer changement fournisseur
  const handleSupplierChange = async (supplierId: string | null) => {
    setSelectedSupplierId(supplierId ?? '');

    // Règle métier : Vider les items locaux au changement de fournisseur
    if (!isEditMode) {
      setLocalItems([]);
    }

    if (supplierId) {
      const supplier = await getOrganisationById(supplierId);
      if (supplier?.payment_terms) {
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
        for (const product of selectedProducts) {
          const itemData: CreateOrderItemData = {
            product_id: product.id,
            quantity: product.quantity ?? 1,
            unit_price_ht: product.unit_price ?? 0,
            discount_percentage: product.discount_percentage ?? 0,
            eco_tax: 0,
            notes: product.notes ?? '',
          };
          await addItem(itemData);
        }
      } else {
        // ✅ Utiliser cost_price (prix d'achat) et eco_tax_default (éco-taxe) du produit
        const newItems: LocalOrderItem[] = selectedProducts.map(product => ({
          id: `temp-${Date.now()}-${product.id}`,
          product_id: product.id,
          quantity: product.quantity ?? 1,
          unit_price_ht: product.cost_price ?? 0,
          discount_percentage: product.discount_percentage ?? 0,
          eco_tax:
            (product as { eco_tax_default?: number }).eco_tax_default ?? 0,
          notes: product.notes ?? '',
          products: {
            id: product.id,
            name: product.name,
            sku: product.sku ?? '',
            primary_image_url:
              product.product_images?.find(img => img.is_primary)?.public_url ??
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
  const handleUpdateItem = async (itemId: string, data: Partial<OrderItem>) => {
    if (isEditMode) {
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
      setLocalItems(prev =>
        prev.map(item =>
          item.id === itemId ? ({ ...item, ...data } as LocalOrderItem) : item
        )
      );
    }
  };

  // Handler suppression item (gère les deux modes)
  const handleRemoveItem = async (itemId: string) => {
    if (isEditMode) {
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
    setLocalItems([]);
    setShippingCostHt(0);
    setCustomsCostHt(0);
    setInsuranceCostHt(0);
  };

  const handleClose = () => {
    setOpen(false);
    onClose?.();
  };

  const handleSubmitConfirmed = async () => {
    if (!selectedSupplierId) return;

    setLoading(true);
    try {
      if (isEditMode) {
        await updateOrder(order.id, {
          supplier_id: selectedSupplierId,
          expected_delivery_date: expectedDeliveryDate || undefined,
          payment_terms: paymentTerms || undefined,
          delivery_address: deliveryAddress || undefined,
          notes: notes || undefined,
          eco_tax_vat_rate: ecoTaxVatRate,
          shipping_cost_ht: shippingCostHt || 0,
          customs_cost_ht: customsCostHt || 0,
          insurance_cost_ht: insuranceCostHt || 0,
        } as unknown as UpdatePurchaseOrderData);

        toast({
          title: '✅ Commande mise à jour',
          description: `Commande ${order.po_number} modifiée avec succès`,
        });
      } else {
        const newOrder = await createOrder({
          supplier_id: selectedSupplierId,
          expected_delivery_date: expectedDeliveryDate || undefined,
          delivery_address: (deliveryAddress || undefined) as
            | Record<string, unknown>
            | undefined,
          payment_terms: paymentTerms || undefined,
          notes: notes || undefined,
          eco_tax_vat_rate: ecoTaxVatRate,
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

    if (!selectedSupplierId) {
      toast({
        variant: 'destructive',
        title: 'Fournisseur requis',
        description: 'Veuillez sélectionner un fournisseur',
      });
      return;
    }

    await handleSubmitConfirmed();
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      onClose?.();
    }
  };

  return {
    // State
    open,
    loading,
    selectedSupplierId,
    selectedSupplier,
    expectedDeliveryDate,
    setExpectedDeliveryDate,
    deliveryAddress,
    setDeliveryAddress,
    notes,
    setNotes,
    ecoTaxVatRate,
    setEcoTaxVatRate,
    paymentTerms,
    shippingCostHt,
    setShippingCostHt,
    customsCostHt,
    setCustomsCostHt,
    insuranceCostHt,
    setInsuranceCostHt,
    showProductSelector,
    setShowProductSelector,
    localItems,
    // Computed
    isEditMode,
    isBlocked,
    displayItems,
    itemsLoading,
    totalHT,
    totalCharges,
    totalTTC,
    excludeProductIds,
    // Handlers
    handleSupplierChange,
    handleSupplierCreated,
    handleProductsSelect,
    handleUpdateItem,
    handleRemoveItem,
    handleClose,
    handleSubmit,
    handleOpenChange,
    setOpen,
  };
}

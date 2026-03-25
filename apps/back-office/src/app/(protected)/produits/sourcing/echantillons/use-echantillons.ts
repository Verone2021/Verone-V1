'use client';

import { useState } from 'react';

import { useToast } from '@verone/common';
import { useCustomerSamples } from '@verone/customers';
import type { UnifiedCustomer } from '@verone/orders';
import type { SelectedProduct } from '@verone/products';
import { createClient } from '@verone/utils/supabase/client';

import type { EchantillonFilters } from './echantillons-types';

// ---------------------------------------------------------------------------
// Pure module-level helpers
// ---------------------------------------------------------------------------

function buildDeliveryAddress(customer: UnifiedCustomer): string {
  if (customer.type === 'professional') {
    return [
      customer.name,
      customer.shipping_address_line1 ?? customer.billing_address_line1,
      customer.shipping_city ?? customer.billing_city,
      customer.shipping_postal_code ?? customer.billing_postal_code,
    ]
      .filter(Boolean)
      .join(', ');
  }
  return [
    customer.name,
    customer.address_line1,
    customer.city,
    customer.postal_code,
  ]
    .filter(Boolean)
    .join(', ');
}

interface SamplePOCtx {
  selectedProductId: string;
  selectedCustomer: UnifiedCustomer | null;
  quantity: number;
  deliveryAddress: string;
  notes: string;
  toast: (p: {
    title?: string;
    description?: string;
    variant?: 'destructive' | 'default' | 'success';
  }) => void;
}

async function createSamplePO(
  ctx: SamplePOCtx,
  refresh: () => Promise<void>,
  onSuccess: () => void
) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    ctx.toast({
      title: 'Erreur',
      description: 'Utilisateur non connecté',
      variant: 'destructive',
    });
    return;
  }
  const { data: product, error: productError } = await supabase
    .from('products')
    .select('cost_price, supplier_id')
    .eq('id', ctx.selectedProductId)
    .single();
  if (productError ?? !product?.supplier_id) {
    ctx.toast({
      title: 'Erreur',
      description: 'Produit invalide ou fournisseur manquant',
      variant: 'destructive',
    });
    return;
  }
  const { data: newPO, error: poError } = await supabase
    .from('purchase_orders')
    .insert({
      po_number: `SAMPLE-${Date.now()}`,
      status: 'draft',
      notes: `Échantillon client: ${ctx.selectedCustomer?.name ?? ''}`,
      created_by: user.id,
      supplier_id: product.supplier_id,
    })
    .select('id')
    .single();
  if (poError) throw poError;
  const { error: itemError } = await supabase
    .from('purchase_order_items')
    .insert({
      purchase_order_id: newPO.id,
      product_id: ctx.selectedProductId,
      quantity: ctx.quantity,
      unit_price_ht: product.cost_price ?? 0.01,
      sample_type: 'customer',
      customer_organisation_id:
        ctx.selectedCustomer?.type === 'professional'
          ? ctx.selectedCustomer.id
          : null,
      customer_individual_id:
        ctx.selectedCustomer?.type === 'individual'
          ? ctx.selectedCustomer.id
          : null,
      notes: `Livraison: ${ctx.deliveryAddress}\n\nNotes: ${ctx.notes}`,
    });
  if (itemError) throw itemError;
  ctx.toast({
    title: 'Demande créée',
    description: "Demande d'échantillon enregistrée avec succès",
  });
  onSuccess();
  void refresh().catch(err => {
    console.error('[EchantillonsPage] Refresh after creation failed:', err);
  });
}

// ---------------------------------------------------------------------------
// useFormState — raw state atoms for the sample creation form
// ---------------------------------------------------------------------------

function useFormState() {
  const [selectedCustomer, setSelectedCustomer] =
    useState<UnifiedCustomer | null>(null);
  const [selectedProduct, setSelectedProduct] =
    useState<SelectedProduct | null>(null);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [showProductModal, setShowProductModal] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const resetForm = () => {
    setSelectedCustomer(null);
    setSelectedProductId('');
    setSelectedProduct(null);
    setQuantity(1);
    setDeliveryAddress('');
    setNotes('');
  };
  return {
    selectedCustomer,
    setSelectedCustomer,
    selectedProduct,
    setSelectedProduct,
    selectedProductId,
    setSelectedProductId,
    showProductModal,
    setShowProductModal,
    quantity,
    setQuantity,
    deliveryAddress,
    setDeliveryAddress,
    notes,
    setNotes,
    submitting,
    setSubmitting,
    resetForm,
  };
}

// ---------------------------------------------------------------------------
// useEchantillonActions — archive / reactivate / reinsert / delete
// ---------------------------------------------------------------------------

function useEchantillonActions(deps: {
  archiveSample: (id: string) => Promise<void>;
  reactivateSample: (id: string) => Promise<void>;
  insertSampleInPO: (id: string) => Promise<void>;
  deleteSample: (id: string) => Promise<void>;
}) {
  const { archiveSample, reactivateSample, insertSampleInPO, deleteSample } =
    deps;
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [sampleToDelete, setSampleToDelete] = useState<string | null>(null);
  const handleArchive = async (sampleId: string) => {
    try {
      await archiveSample(sampleId);
    } catch (err) {
      console.error('Archive failed:', err);
    }
  };
  const handleReactivate = async (sampleId: string) => {
    try {
      await reactivateSample(sampleId);
    } catch (err) {
      console.error('Reactivate failed:', err);
    }
  };
  const handleReinsert = async (sampleId: string) => {
    try {
      await insertSampleInPO(sampleId);
    } catch (err) {
      console.error('Reinsert failed:', err);
    }
  };
  const handleDeleteClick = (sampleId: string) => {
    setSampleToDelete(sampleId);
    setDeleteConfirmOpen(true);
  };
  const handleDeleteConfirm = async () => {
    if (!sampleToDelete) return;
    try {
      await deleteSample(sampleToDelete);
      setDeleteConfirmOpen(false);
      setSampleToDelete(null);
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };
  return {
    deleteConfirmOpen,
    setDeleteConfirmOpen,
    handleArchive,
    handleReactivate,
    handleReinsert,
    handleDeleteClick,
    handleDeleteConfirm,
  };
}

// ---------------------------------------------------------------------------
// useEchantillonForm — handlers (state atoms via useFormState)
// ---------------------------------------------------------------------------

function useEchantillonForm(deps: {
  refresh: () => Promise<void>;
  setShowSampleForm: (open: boolean) => void;
}) {
  const { refresh, setShowSampleForm } = deps;
  const { toast } = useToast();
  const s = useFormState();

  const handleCustomerChange = (customer: UnifiedCustomer | null) => {
    s.setSelectedCustomer(customer);
    s.setDeliveryAddress(customer ? buildDeliveryAddress(customer) : '');
  };

  const handleProductSelect = (products: SelectedProduct[]) => {
    if (products.length > 0) {
      const pr = products[0];
      s.setSelectedProduct(pr);
      s.setSelectedProductId(pr.id);
    }
    s.setShowProductModal(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!s.selectedCustomer || !s.selectedProductId) {
      toast({
        title: 'Erreur',
        description: 'Client et produit requis',
        variant: 'destructive',
      });
      return;
    }
    s.setSubmitting(true);
    try {
      const poCtx: SamplePOCtx = {
        selectedProductId: s.selectedProductId,
        selectedCustomer: s.selectedCustomer,
        quantity: s.quantity,
        deliveryAddress: s.deliveryAddress,
        notes: s.notes,
        toast,
      };
      await createSamplePO(poCtx, refresh, () => {
        setShowSampleForm(false);
        s.resetForm();
      });
    } catch (err) {
      console.error('Erreur création échantillon:', err);
      toast({
        title: 'Erreur',
        description: 'Impossible de créer la demande',
        variant: 'destructive',
      });
    } finally {
      s.setSubmitting(false);
    }
  };

  return {
    selectedCustomer: s.selectedCustomer,
    selectedProduct: s.selectedProduct,
    selectedProductId: s.selectedProductId,
    showProductModal: s.showProductModal,
    setShowProductModal: s.setShowProductModal,
    quantity: s.quantity,
    setQuantity: s.setQuantity,
    deliveryAddress: s.deliveryAddress,
    setDeliveryAddress: s.setDeliveryAddress,
    notes: s.notes,
    setNotes: s.setNotes,
    submitting: s.submitting,
    handleCustomerChange,
    handleProductSelect,
    handleSubmit,
  };
}

// ---------------------------------------------------------------------------
// useEchantillons — public API (thin coordinator)
// ---------------------------------------------------------------------------

export function useEchantillons() {
  const [activeTab, setActiveTab] = useState<'active' | 'archived'>('active');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [showSampleForm, setShowSampleForm] = useState(false);

  const {
    samples,
    loading,
    error,
    stats,
    archiveSample,
    reactivateSample,
    insertSampleInPO,
    deleteSample,
    refresh,
  } = useCustomerSamples({ archived: activeTab === 'archived' });

  const actions = useEchantillonActions({
    archiveSample,
    reactivateSample,
    insertSampleInPO,
    deleteSample,
  });
  const form = useEchantillonForm({ refresh, setShowSampleForm });

  const filteredSamples = samples.filter(sample => {
    const q = searchTerm.toLowerCase();
    const matchesSearch =
      sample.product_name.toLowerCase().includes(q) ||
      sample.product_sku.toLowerCase().includes(q) ||
      sample.customer_display_name.toLowerCase().includes(q) ||
      sample.po_number.toLowerCase().includes(q);
    const matchesStatus =
      statusFilter === 'all' || sample.sample_status === statusFilter;
    const matchesType =
      typeFilter === 'all' || sample.sample_type === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  const filters: EchantillonFilters = { searchTerm, statusFilter, typeFilter };
  const handleRefresh = () => {
    void refresh().catch(err => {
      console.error('[EchantillonsPage] Refresh failed:', err);
    });
  };

  return {
    filteredSamples,
    loading,
    error,
    stats,
    activeTab,
    setActiveTab,
    filters,
    setSearchTerm,
    setStatusFilter,
    setTypeFilter,
    handleRefresh,
    showSampleForm,
    setShowSampleForm,
    ...form,
    ...actions,
  };
}

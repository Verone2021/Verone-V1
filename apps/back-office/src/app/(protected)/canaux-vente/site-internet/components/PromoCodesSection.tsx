'use client';

import { useCallback, useMemo, useState } from 'react';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { Card, CardContent } from '@verone/ui';
import { toast } from 'sonner';

import { createClient } from '@verone/utils/supabase/client';

import { useSiteInternetCollections } from '../hooks/use-site-internet-collections';
import { useSiteInternetProducts } from '../hooks/use-site-internet-products';

import { PromoFormDialog } from './promo-codes-form';
import { PromoTable } from './promo-codes-table';
import type { PromoCode, PromoFormData } from './promo-codes-types';

const EMPTY_FORM: PromoFormData = {
  code: '',
  name: '',
  description: '',
  discount_type: 'percentage',
  discount_value: 10,
  min_order_amount: '',
  max_discount_amount: '',
  valid_from: new Date().toISOString().slice(0, 10),
  valid_until: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
  max_uses_total: '',
  max_uses_per_customer: 1,
  is_active: true,
  is_automatic: false,
  target_type: 'all',
  exclude_sale_items: false,
  selected_target_ids: [],
};

// ============================================
// Stats Grid
// ============================================

interface PromoStatsGridProps {
  stats: { total: number; active: number; expired: number; totalUses: number };
}

function PromoStatsGrid({ stats }: PromoStatsGridProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <Card>
        <CardContent className="pt-4 pb-4">
          <div className="text-2xl font-bold">{stats.total}</div>
          <div className="text-sm text-muted-foreground">Promotions</div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-4 pb-4">
          <div className="text-2xl font-bold text-green-600">
            {stats.active}
          </div>
          <div className="text-sm text-muted-foreground">Actives</div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-4 pb-4">
          <div className="text-2xl font-bold text-red-600">{stats.expired}</div>
          <div className="text-sm text-muted-foreground">Expirees</div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-4 pb-4">
          <div className="text-2xl font-bold">{stats.totalUses}</div>
          <div className="text-sm text-muted-foreground">Utilisations</div>
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================
// Hooks & Helpers
// ============================================

function usePromoQuery() {
  const supabase = createClient();
  return useQuery({
    queryKey: ['promo-codes-bo'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('order_discounts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200);
      if (error) {
        console.error('[PromoCodesSection] fetch error:', error);
        throw error;
      }
      return (data ?? []) as PromoCode[];
    },
    staleTime: 30_000,
  });
}

function buildPromoPayload(data: PromoFormData) {
  return {
    code: data.is_automatic ? null : data.code.toUpperCase(),
    name: data.name,
    description: data.description || null,
    discount_type: data.discount_type,
    discount_value:
      data.discount_type === 'free_shipping' ? 0 : data.discount_value,
    min_order_amount: data.min_order_amount
      ? parseFloat(data.min_order_amount)
      : null,
    max_discount_amount: data.max_discount_amount
      ? parseFloat(data.max_discount_amount)
      : null,
    valid_from: data.valid_from,
    valid_until: data.valid_until,
    max_uses_total: data.max_uses_total
      ? parseInt(data.max_uses_total, 10)
      : null,
    max_uses_per_customer: data.max_uses_per_customer,
    is_active: data.is_active,
    is_automatic: data.is_automatic,
    target_type: data.target_type,
    exclude_sale_items: data.exclude_sale_items,
    applicable_channels: ['site-internet'],
    requires_code: !data.is_automatic,
  };
}

async function saveTargets(
  supabase: ReturnType<typeof createClient>,
  discountId: string,
  targetType: 'all' | 'products' | 'collections',
  targetIds: string[]
) {
  // Delete existing targets
  await supabase
    .from('order_discount_targets')
    .delete()
    .eq('discount_id', discountId);

  // Insert new targets if not 'all'
  if (targetType !== 'all' && targetIds.length > 0) {
    const rows = targetIds.map(id => ({
      discount_id: discountId,
      target_type:
        targetType === 'products'
          ? ('product' as const)
          : ('collection' as const),
      target_id: id,
    }));
    const { error } = await supabase
      .from('order_discount_targets')
      .insert(rows);
    if (error) throw error;
  }
}

async function fetchTargetIds(
  supabase: ReturnType<typeof createClient>,
  discountId: string
): Promise<string[]> {
  const { data } = await supabase
    .from('order_discount_targets')
    .select('target_id')
    .eq('discount_id', discountId);
  return data?.map(t => t.target_id) ?? [];
}

function usePromoSaveMutation(
  queryClient: ReturnType<typeof useQueryClient>,
  editingId: string | null,
  onSuccess: () => void
) {
  const supabase = createClient();
  return useMutation({
    mutationFn: async (data: PromoFormData & { id?: string }) => {
      const payload = buildPromoPayload(data);
      let discountId = data.id;

      if (data.id) {
        const { error } = await supabase
          .from('order_discounts')
          .update(payload)
          .eq('id', data.id);
        if (error) throw error;
      } else {
        const { data: inserted, error } = await supabase
          .from('order_discounts')
          .insert(payload)
          .select('id')
          .single();
        if (error) throw error;
        discountId = inserted.id;
      }

      // Save targets
      if (discountId) {
        await saveTargets(
          supabase,
          discountId,
          data.target_type,
          data.selected_target_ids
        );
      }
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['promo-codes-bo'] });
      onSuccess();
      toast.success(editingId ? 'Promotion mise a jour' : 'Promotion creee');
    },
    onError: (error: Error) => {
      console.error('[PromoCodesSection] save error:', error);
      toast.error('Erreur : ' + error.message);
    },
  });
}

function usePromoDeleteMutation(
  queryClient: ReturnType<typeof useQueryClient>
) {
  const supabase = createClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('order_discounts')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['promo-codes-bo'] });
      toast.success('Promotion supprimee');
    },
    onError: (error: Error) => {
      console.error('[PromoCodesSection] delete error:', error);
      toast.error('Erreur lors de la suppression');
    },
  });
}

function promoToFormData(promo: PromoCode, targetIds: string[]): PromoFormData {
  return {
    code: promo.code ?? '',
    name: promo.name,
    description: promo.description ?? '',
    discount_type: promo.discount_type,
    discount_value: promo.discount_value,
    min_order_amount: promo.min_order_amount?.toString() ?? '',
    max_discount_amount: promo.max_discount_amount?.toString() ?? '',
    valid_from: promo.valid_from,
    valid_until: promo.valid_until,
    max_uses_total: promo.max_uses_total?.toString() ?? '',
    max_uses_per_customer: promo.max_uses_per_customer,
    is_active: promo.is_active,
    is_automatic: promo.is_automatic,
    target_type: promo.target_type,
    exclude_sale_items: promo.exclude_sale_items,
    selected_target_ids: targetIds,
  };
}

function filterPromos(promos: PromoCode[], query: string): PromoCode[] {
  if (!query) return promos;
  const q = query.toLowerCase();
  return promos.filter(
    p =>
      (p.code?.toLowerCase().includes(q) ?? false) ||
      p.name.toLowerCase().includes(q)
  );
}

function computePromoStats(promos: PromoCode[]) {
  const active = promos.filter(p => p.is_active).length;
  const expired = promos.filter(
    p => new Date(p.valid_until) < new Date()
  ).length;
  const totalUses = promos.reduce((sum, p) => sum + p.current_uses, 0);
  return { total: promos.length, active, expired, totalUses };
}

// ============================================
// Main Export
// ============================================

export function PromoCodesSection() {
  const queryClient = useQueryClient();
  const supabase = createClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<PromoFormData>(EMPTY_FORM);

  const { data: promos = [], isLoading } = usePromoQuery();
  const { data: siteProducts } = useSiteInternetProducts();
  const { data: siteCollections } = useSiteInternetCollections();

  // Map to selectable items
  const products = useMemo(
    () => siteProducts?.map(p => ({ id: p.product_id, name: p.name })) ?? [],
    [siteProducts]
  );
  const collections = useMemo(
    () => siteCollections?.map(c => ({ id: c.id, name: c.name })) ?? [],
    [siteCollections]
  );

  const closeDialog = useCallback(() => {
    setDialogOpen(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
  }, []);

  const saveMutation = usePromoSaveMutation(
    queryClient,
    editingId,
    closeDialog
  );
  const deleteMutation = usePromoDeleteMutation(queryClient);

  const openCreateDialog = useCallback(() => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  }, []);

  const openEditDialog = useCallback(
    async (promo: PromoCode) => {
      const targetIds = await fetchTargetIds(supabase, promo.id);
      setEditingId(promo.id);
      setForm(promoToFormData(promo, targetIds));
      setDialogOpen(true);
    },
    [supabase]
  );

  const handleSave = useCallback(() => {
    if (!form.is_automatic && !form.code) {
      toast.error('Code obligatoire pour les promos manuelles');
      return;
    }
    if (!form.name) {
      toast.error('Nom obligatoire');
      return;
    }
    if (form.target_type !== 'all' && form.selected_target_ids.length === 0) {
      toast.error('Selectionnez au moins un produit ou collection');
      return;
    }
    saveMutation.mutate({ ...form, id: editingId ?? undefined });
  }, [form, editingId, saveMutation]);

  const handleDelete = useCallback(
    (id: string, code: string) => {
      if (window.confirm(`Supprimer la promotion ${code || 'automatique'} ?`))
        deleteMutation.mutate(id);
    },
    [deleteMutation]
  );

  const filtered = useMemo(
    () => filterPromos(promos, searchQuery),
    [promos, searchQuery]
  );
  const stats = useMemo(() => computePromoStats(promos), [promos]);

  return (
    <div className="space-y-6">
      <PromoStatsGrid stats={stats} />
      <PromoTable
        filtered={filtered}
        isLoading={isLoading}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onEdit={openEditDialog}
        onDelete={handleDelete}
        isDeleting={deleteMutation.isPending}
        onCreateClick={openCreateDialog}
      />
      <PromoFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        form={form}
        setForm={setForm}
        editingId={editingId}
        onSave={handleSave}
        isSaving={saveMutation.isPending}
        products={products}
        collections={collections}
      />
    </div>
  );
}

'use client';

import { useCallback, useMemo, useState } from 'react';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { Card, CardContent } from '@verone/ui';
import { toast } from 'sonner';

import { createClient } from '@verone/utils/supabase/client';

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
          <div className="text-sm text-muted-foreground">Codes promo</div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-4 pb-4">
          <div className="text-2xl font-bold text-green-600">
            {stats.active}
          </div>
          <div className="text-sm text-muted-foreground">Actifs</div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-4 pb-4">
          <div className="text-2xl font-bold text-red-600">{stats.expired}</div>
          <div className="text-sm text-muted-foreground">Expirés</div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-4 pb-4">
          <div className="text-2xl font-bold">{stats.totalUses}</div>
          <div className="text-sm text-muted-foreground">
            Utilisations totales
          </div>
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
    code: data.code.toUpperCase(),
    name: data.name,
    description: data.description || null,
    discount_type: data.discount_type,
    discount_value: data.discount_value,
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
    applicable_channels: ['site-internet'],
    requires_code: true,
  };
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
      if (data.id) {
        const { error } = await supabase
          .from('order_discounts')
          .update(payload)
          .eq('id', data.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('order_discounts')
          .insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['promo-codes-bo'] });
      onSuccess();
      toast.success(editingId ? 'Code promo mis à jour' : 'Code promo créé');
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
      toast.success('Code promo supprimé');
    },
    onError: (error: Error) => {
      console.error('[PromoCodesSection] delete error:', error);
      toast.error('Erreur lors de la suppression');
    },
  });
}

function promoToFormData(promo: PromoCode): PromoFormData {
  return {
    code: promo.code,
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
  };
}

function filterPromos(promos: PromoCode[], query: string): PromoCode[] {
  if (!query) return promos;
  const q = query.toLowerCase();
  return promos.filter(
    p => p.code.toLowerCase().includes(q) || p.name.toLowerCase().includes(q)
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
  const [searchQuery, setSearchQuery] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<PromoFormData>(EMPTY_FORM);

  const { data: promos = [], isLoading } = usePromoQuery();

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

  const openEditDialog = useCallback((promo: PromoCode) => {
    setEditingId(promo.id);
    setForm(promoToFormData(promo));
    setDialogOpen(true);
  }, []);

  const handleSave = useCallback(() => {
    if (!form.code || !form.name) {
      toast.error('Code et nom obligatoires');
      return;
    }
    saveMutation.mutate({ ...form, id: editingId ?? undefined });
  }, [form, editingId, saveMutation]);

  const handleDelete = useCallback(
    (id: string, code: string) => {
      if (window.confirm(`Supprimer le code ${code} ?`))
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
      />
    </div>
  );
}

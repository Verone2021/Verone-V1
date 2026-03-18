'use client';

import { useCallback, useMemo, useState } from 'react';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  Badge,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Textarea,
} from '@verone/ui';
import { ButtonV2 } from '@verone/ui';
import {
  Plus,
  Search,
  Tag,
  Pencil,
  Trash2,
  Percent,
  BadgeEuro,
} from 'lucide-react';
import { toast } from 'sonner';

import { createClient } from '@verone/utils/supabase/client';

interface PromoCode {
  id: string;
  code: string;
  name: string;
  description: string | null;
  discount_type: string;
  discount_value: number;
  min_order_amount: number | null;
  max_discount_amount: number | null;
  valid_from: string;
  valid_until: string;
  max_uses_total: number | null;
  max_uses_per_customer: number;
  current_uses: number;
  is_active: boolean;
  created_at: string;
}

interface PromoFormData {
  code: string;
  name: string;
  description: string;
  discount_type: string;
  discount_value: number;
  min_order_amount: string;
  max_discount_amount: string;
  valid_from: string;
  valid_until: string;
  max_uses_total: string;
  max_uses_per_customer: number;
  is_active: boolean;
}

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

export function PromoCodesSection() {
  const supabase = createClient();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<PromoFormData>(EMPTY_FORM);

  // Fetch promo codes
  const { data: promos = [], isLoading } = useQuery({
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

  // Create/Update mutation
  const saveMutation = useMutation({
    mutationFn: async (data: PromoFormData & { id?: string }) => {
      const payload = {
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
      setDialogOpen(false);
      setEditingId(null);
      setForm(EMPTY_FORM);
      toast.success(
        editingId ? 'Code promo mis \u00e0 jour' : 'Code promo cr\u00e9\u00e9'
      );
    },
    onError: (error: Error) => {
      console.error('[PromoCodesSection] save error:', error);
      toast.error('Erreur : ' + error.message);
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('order_discounts')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['promo-codes-bo'] });
      toast.success('Code promo supprim\u00e9');
    },
    onError: (error: Error) => {
      console.error('[PromoCodesSection] delete error:', error);
      toast.error('Erreur lors de la suppression');
    },
  });

  const openCreateDialog = useCallback(() => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  }, []);

  const openEditDialog = useCallback((promo: PromoCode) => {
    setEditingId(promo.id);
    setForm({
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
    });
    setDialogOpen(true);
  }, []);

  const handleSave = useCallback(() => {
    if (!form.code || !form.name) {
      toast.error('Code et nom obligatoires');
      return;
    }
    saveMutation.mutate({ ...form, id: editingId ?? undefined });
  }, [form, editingId, saveMutation]);

  // Filtered promos
  const filtered = useMemo(() => {
    if (!searchQuery) return promos;
    const q = searchQuery.toLowerCase();
    return promos.filter(
      p => p.code.toLowerCase().includes(q) || p.name.toLowerCase().includes(q)
    );
  }, [promos, searchQuery]);

  // Stats
  const stats = useMemo(() => {
    const active = promos.filter(p => p.is_active).length;
    const expired = promos.filter(
      p => new Date(p.valid_until) < new Date()
    ).length;
    const totalUses = promos.reduce((sum, p) => sum + p.current_uses, 0);
    return { total: promos.length, active, expired, totalUses };
  }, [promos]);

  const isExpired = (validUntil: string) => new Date(validUntil) < new Date();

  return (
    <div className="space-y-6">
      {/* Stats */}
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
            <div className="text-2xl font-bold text-red-600">
              {stats.expired}
            </div>
            <div className="text-sm text-muted-foreground">Expir\u00e9s</div>
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

      {/* Main card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Tag className="h-5 w-5" />
              Codes promotionnels
            </CardTitle>
            <ButtonV2 size="sm" onClick={openCreateDialog}>
              <Plus className="h-4 w-4 mr-2" />
              Nouveau code
            </ButtonV2>
          </div>
        </CardHeader>
        <CardContent>
          <div className="relative max-w-sm mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              Chargement...
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Aucun code promo
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Nom</TableHead>
                  <TableHead>R\u00e9duction</TableHead>
                  <TableHead>Validit\u00e9</TableHead>
                  <TableHead>Utilisations</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(promo => (
                  <TableRow key={promo.id}>
                    <TableCell className="font-mono font-bold">
                      {promo.code}
                    </TableCell>
                    <TableCell>{promo.name}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {promo.discount_type === 'percentage' ? (
                          <>
                            <Percent className="h-3.5 w-3.5" />
                            {promo.discount_value}%
                          </>
                        ) : (
                          <>
                            <BadgeEuro className="h-3.5 w-3.5" />
                            {promo.discount_value}\u20ac
                          </>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(promo.valid_from).toLocaleDateString('fr-FR')}{' '}
                      \u2192{' '}
                      {new Date(promo.valid_until).toLocaleDateString('fr-FR')}
                    </TableCell>
                    <TableCell>
                      {promo.current_uses}
                      {promo.max_uses_total ? ` / ${promo.max_uses_total}` : ''}
                    </TableCell>
                    <TableCell>
                      {!promo.is_active ? (
                        <Badge
                          variant="outline"
                          className="bg-gray-50 text-gray-600"
                        >
                          Inactif
                        </Badge>
                      ) : isExpired(promo.valid_until) ? (
                        <Badge
                          variant="outline"
                          className="bg-red-50 text-red-700"
                        >
                          Expir\u00e9
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="bg-green-50 text-green-700"
                        >
                          Actif
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <ButtonV2
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditDialog(promo)}
                        >
                          <Pencil className="h-4 w-4" />
                        </ButtonV2>
                        <ButtonV2
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => {
                            if (
                              window.confirm(
                                `Supprimer le code ${promo.code} ?`
                              )
                            ) {
                              deleteMutation.mutate(promo.id);
                            }
                          }}
                          disabled={deleteMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                        </ButtonV2>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingId ? 'Modifier le code promo' : 'Nouveau code promo'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Code *</Label>
                <Input
                  value={form.code}
                  onChange={e =>
                    setForm(prev => ({
                      ...prev,
                      code: e.target.value.toUpperCase(),
                    }))
                  }
                  placeholder="BIENVENUE10"
                  className="font-mono"
                />
              </div>
              <div>
                <Label>Nom *</Label>
                <Input
                  value={form.name}
                  onChange={e =>
                    setForm(prev => ({ ...prev, name: e.target.value }))
                  }
                  placeholder="Promo bienvenue"
                />
              </div>
            </div>

            <div>
              <Label>Description</Label>
              <Textarea
                value={form.description}
                onChange={e =>
                  setForm(prev => ({ ...prev, description: e.target.value }))
                }
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Type de r\u00e9duction</Label>
                <Select
                  value={form.discount_type}
                  onValueChange={v =>
                    setForm(prev => ({ ...prev, discount_type: v }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Pourcentage (%)</SelectItem>
                    <SelectItem value="fixed_amount">
                      Montant fixe (\u20ac)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>
                  Valeur{' '}
                  {form.discount_type === 'percentage' ? '(%)' : '(\u20ac)'}
                </Label>
                <Input
                  type="number"
                  min={0}
                  value={form.discount_value}
                  onChange={e =>
                    setForm(prev => ({
                      ...prev,
                      discount_value: parseFloat(e.target.value) || 0,
                    }))
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Montant min. commande (\u20ac)</Label>
                <Input
                  type="number"
                  value={form.min_order_amount}
                  onChange={e =>
                    setForm(prev => ({
                      ...prev,
                      min_order_amount: e.target.value,
                    }))
                  }
                  placeholder="Pas de minimum"
                />
              </div>
              <div>
                <Label>R\u00e9duction max. (\u20ac)</Label>
                <Input
                  type="number"
                  value={form.max_discount_amount}
                  onChange={e =>
                    setForm(prev => ({
                      ...prev,
                      max_discount_amount: e.target.value,
                    }))
                  }
                  placeholder="Pas de plafond"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Valide du</Label>
                <Input
                  type="date"
                  value={form.valid_from}
                  onChange={e =>
                    setForm(prev => ({ ...prev, valid_from: e.target.value }))
                  }
                />
              </div>
              <div>
                <Label>Valide jusqu&apos;au</Label>
                <Input
                  type="date"
                  value={form.valid_until}
                  onChange={e =>
                    setForm(prev => ({ ...prev, valid_until: e.target.value }))
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Utilisations max. (total)</Label>
                <Input
                  type="number"
                  value={form.max_uses_total}
                  onChange={e =>
                    setForm(prev => ({
                      ...prev,
                      max_uses_total: e.target.value,
                    }))
                  }
                  placeholder="Illimit\u00e9"
                />
              </div>
              <div>
                <Label>Max. par client</Label>
                <Input
                  type="number"
                  min={1}
                  value={form.max_uses_per_customer}
                  onChange={e =>
                    setForm(prev => ({
                      ...prev,
                      max_uses_per_customer: parseInt(e.target.value, 10) || 1,
                    }))
                  }
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Switch
                checked={form.is_active}
                onCheckedChange={checked =>
                  setForm(prev => ({ ...prev, is_active: checked }))
                }
              />
              <Label>Code actif</Label>
            </div>
          </div>

          <DialogFooter>
            <ButtonV2 variant="outline" onClick={() => setDialogOpen(false)}>
              Annuler
            </ButtonV2>
            <ButtonV2 onClick={handleSave} disabled={saveMutation.isPending}>
              {saveMutation.isPending
                ? 'Enregistrement...'
                : editingId
                  ? 'Mettre \u00e0 jour'
                  : 'Cr\u00e9er'}
            </ButtonV2>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

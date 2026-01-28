'use client';

import { useEffect, useState } from 'react';

import { useToast } from '@verone/common';
import { Badge } from '@verone/ui';
import { ButtonV2 } from '@verone/ui';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@verone/ui';
import { Checkbox } from '@verone/ui';
import { Input } from '@verone/ui';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@verone/ui';
import { Skeleton } from '@verone/ui';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@verone/ui';
import { createClient } from '@verone/utils/supabase/client';
import {
  Search,
  Wallet,
  Clock,
  CheckCircle,
  CreditCard,
  XCircle,
  Download,
} from 'lucide-react';

interface Commission {
  id: string;
  affiliate_id: string;
  selection_id: string | null;
  order_id: string | null;
  order_item_id: string | null;
  order_amount_ht: number;
  affiliate_commission: number;
  linkme_commission: number;
  margin_rate_applied: number;
  linkme_rate_applied: number;
  status: string | null; // 'pending' | 'validated' | 'paid' | 'cancelled' - relaxed for Supabase types
  validated_at: string | null;
  paid_at: string | null;
  payment_reference: string | null;
  payment_method: string | null;
  created_at: string | null;
  // Joined
  affiliate?: {
    display_name: string;
  } | null;
}

const statusConfig = {
  pending: {
    label: 'En attente',
    variant: 'outline' as const,
    icon: Clock,
    color: 'text-orange-600',
  },
  validated: {
    label: 'Validée',
    variant: 'default' as const,
    icon: CheckCircle,
    color: 'text-blue-600',
  },
  paid: {
    label: 'Payée',
    variant: 'default' as const,
    icon: CreditCard,
    color: 'text-green-600',
  },
  cancelled: {
    label: 'Annulée',
    variant: 'destructive' as const,
    icon: XCircle,
    color: 'text-red-600',
  },
};

/**
 * CommissionsSection - Gestion des commissions
 *
 * Fonctionnalités:
 * - Liste commissions avec filtres (statut, affilié, période)
 * - Actions bulk : Valider, Marquer payé
 * - Export CSV pour comptabilité
 * - Historique paiements
 */
export function CommissionsSection() {
  const { toast } = useToast();
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [affiliates, setAffiliates] = useState<
    { id: string; display_name: string }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [affiliateFilter, setAffiliateFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    void fetchData().catch(error => {
      console.error('[CommissionsSection] Initial fetch failed:', error);
    });
  }, []);

  async function fetchData() {
    const supabase = createClient();
    setLoading(true);

    try {
      // Fetch commissions with affiliate info
      const { data: commissionsData, error: commissionsError } = await (
        supabase as any
      )
        .from('linkme_commissions')
        .select(
          `
          *,
          affiliate:linkme_affiliates(display_name)
        `
        )
        .order('created_at', { ascending: false });

      if (commissionsError) throw commissionsError;

      // Fetch affiliates for filter
      const { data: affiliatesData, error: affiliatesError } = await (
        supabase as any
      )
        .from('linkme_affiliates')
        .select('id, display_name');

      if (affiliatesError) throw affiliatesError;

      setCommissions(commissionsData || []);
      setAffiliates(affiliatesData || []);
    } catch (error) {
      console.error('Error fetching commissions:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les commissions',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleValidate(ids: string[]) {
    const supabase = createClient();
    setProcessing(true);

    try {
      const { error } = await (supabase as any)
        .from('linkme_commissions')
        .update({
          status: 'validated',
          validated_at: new Date().toISOString(),
        })
        .in('id', ids);

      if (error) throw error;

      toast({
        title: 'Succès',
        description: `${ids.length} commission(s) validée(s)`,
      });

      setSelectedIds([]);
      void fetchData().catch(error => {
        console.error(
          '[CommissionsSection] Fetch after validate failed:',
          error
        );
      });
    } catch (error) {
      console.error('Error validating commissions:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de valider les commissions',
        variant: 'destructive',
      });
    } finally {
      setProcessing(false);
    }
  }

  async function handleMarkPaid(ids: string[]) {
    const supabase = createClient();
    setProcessing(true);

    try {
      const { error } = await (supabase as any)
        .from('linkme_commissions')
        .update({
          status: 'paid',
          paid_at: new Date().toISOString(),
        })
        .in('id', ids);

      if (error) throw error;

      toast({
        title: 'Succès',
        description: `${ids.length} commission(s) marquée(s) comme payée(s)`,
      });

      setSelectedIds([]);
      void fetchData().catch(error => {
        console.error(
          '[CommissionsSection] Fetch after mark paid failed:',
          error
        );
      });
    } catch (error) {
      console.error('Error marking paid:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de marquer les commissions comme payées',
        variant: 'destructive',
      });
    } finally {
      setProcessing(false);
    }
  }

  function exportToCSV() {
    const filtered = filteredCommissions;
    if (filtered.length === 0) {
      toast({
        title: 'Aucune donnée',
        description: 'Aucune commission à exporter',
        variant: 'destructive',
      });
      return;
    }

    const headers = [
      'Date',
      'Affilié',
      'Commande',
      'Montant HT',
      'Commission Affilié',
      'Commission LinkMe',
      'Statut',
    ];

    const rows = filtered.map(c => [
      c.created_at ? new Date(c.created_at).toLocaleDateString('fr-FR') : '-',
      c.affiliate?.display_name || 'N/A',
      (c.order_id ?? '').slice(0, 8),
      c.order_amount_ht.toFixed(2),
      c.affiliate_commission.toFixed(2),
      c.linkme_commission.toFixed(2),
      statusConfig[(c.status || 'pending') as keyof typeof statusConfig].label,
    ]);

    const csv = [headers.join(';'), ...rows.map(r => r.join(';'))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `commissions-linkme-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);

    toast({
      title: 'Export réussi',
      description: `${filtered.length} commission(s) exportée(s)`,
    });
  }

  function toggleSelect(id: string) {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  }

  function toggleSelectAll() {
    const pendingIds = filteredCommissions
      .filter(c => c.status === 'pending' || c.status === 'validated')
      .map(c => c.id);

    if (selectedIds.length === pendingIds.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(pendingIds);
    }
  }

  // Filter commissions
  const filteredCommissions = commissions.filter(commission => {
    const matchesSearch = (commission.order_id ?? '')
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesAffiliate =
      affiliateFilter === 'all' || commission.affiliate_id === affiliateFilter;
    const matchesStatus =
      statusFilter === 'all' || commission.status === statusFilter;
    return matchesSearch && matchesAffiliate && matchesStatus;
  });

  // Calculate totals
  const totals = {
    pending: filteredCommissions
      .filter(c => c.status === 'pending')
      .reduce((sum, c) => sum + c.affiliate_commission, 0),
    validated: filteredCommissions
      .filter(c => c.status === 'validated')
      .reduce((sum, c) => sum + c.affiliate_commission, 0),
    paid: filteredCommissions
      .filter(c => c.status === 'paid')
      .reduce((sum, c) => sum + c.affiliate_commission, 0),
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              En attente de validation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {totals.pending.toLocaleString('fr-FR', {
                minimumFractionDigits: 2,
              })}{' '}
              €
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Validées (à payer)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {totals.validated.toLocaleString('fr-FR', {
                minimumFractionDigits: 2,
              })}{' '}
              €
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total payé</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {totals.paid.toLocaleString('fr-FR', {
                minimumFractionDigits: 2,
              })}{' '}
              €
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Commissions</CardTitle>
              <CardDescription>
                Gestion des commissions affiliés
              </CardDescription>
            </div>
            <ButtonV2 variant="outline" onClick={exportToCSV}>
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </ButtonV2>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-wrap gap-4 mb-6">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher par commande..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={affiliateFilter} onValueChange={setAffiliateFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Affilié" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les affiliés</SelectItem>
                {affiliates.map(affiliate => (
                  <SelectItem key={affiliate.id} value={affiliate.id}>
                    {affiliate.display_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="pending">En attente</SelectItem>
                <SelectItem value="validated">Validées</SelectItem>
                <SelectItem value="paid">Payées</SelectItem>
                <SelectItem value="cancelled">Annulées</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Bulk Actions */}
          {selectedIds.length > 0 && (
            <div className="flex items-center gap-4 mb-4 p-3 bg-muted rounded-lg">
              <span className="text-sm font-medium">
                {selectedIds.length} sélectionnée(s)
              </span>
              <ButtonV2
                size="sm"
                variant="outline"
                onClick={() => {
                  void handleValidate(selectedIds).catch(error => {
                    console.error(
                      '[CommissionsSection] Validate failed:',
                      error
                    );
                  });
                }}
                disabled={processing}
              >
                <CheckCircle className="h-4 w-4 mr-1" />
                Valider
              </ButtonV2>
              <ButtonV2
                size="sm"
                variant="outline"
                onClick={() => {
                  void handleMarkPaid(selectedIds).catch(error => {
                    console.error(
                      '[CommissionsSection] Mark paid failed:',
                      error
                    );
                  });
                }}
                disabled={processing}
              >
                <CreditCard className="h-4 w-4 mr-1" />
                Marquer payé
              </ButtonV2>
            </div>
          )}

          {/* Table */}
          {filteredCommissions.length === 0 ? (
            <div className="text-center py-12">
              <Wallet className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Aucune commission</h3>
              <p className="text-muted-foreground">
                {searchTerm ||
                affiliateFilter !== 'all' ||
                statusFilter !== 'all'
                  ? 'Aucun résultat pour ces filtres'
                  : 'Les commissions apparaîtront ici après les premières ventes'}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">
                    <Checkbox
                      checked={
                        selectedIds.length > 0 &&
                        selectedIds.length ===
                          filteredCommissions.filter(
                            c =>
                              c.status === 'pending' || c.status === 'validated'
                          ).length
                      }
                      onCheckedChange={toggleSelectAll}
                    />
                  </TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Affilié</TableHead>
                  <TableHead>Commande</TableHead>
                  <TableHead className="text-right">Montant HT</TableHead>
                  <TableHead className="text-right">Commission</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCommissions.map(commission => {
                  const statusInfo =
                    statusConfig[
                      (commission.status ||
                        'pending') as keyof typeof statusConfig
                    ];
                  const canSelect =
                    commission.status === 'pending' ||
                    commission.status === 'validated';

                  return (
                    <TableRow key={commission.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedIds.includes(commission.id)}
                          onCheckedChange={() => toggleSelect(commission.id)}
                          disabled={!canSelect}
                        />
                      </TableCell>
                      <TableCell>
                        {commission.created_at
                          ? new Date(commission.created_at).toLocaleDateString(
                              'fr-FR'
                            )
                          : '-'}
                      </TableCell>
                      <TableCell>
                        {commission.affiliate?.display_name || 'N/A'}
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        #{(commission.order_id ?? '').slice(0, 8)}
                      </TableCell>
                      <TableCell className="text-right">
                        {commission.order_amount_ht.toLocaleString('fr-FR', {
                          minimumFractionDigits: 2,
                        })}{' '}
                        €
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {commission.affiliate_commission.toLocaleString(
                          'fr-FR',
                          {
                            minimumFractionDigits: 2,
                          }
                        )}{' '}
                        €
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusInfo.variant}>
                          <statusInfo.icon className="h-3 w-3 mr-1" />
                          {statusInfo.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {commission.status === 'pending' && (
                          <ButtonV2
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              void handleValidate([commission.id]).catch(
                                error => {
                                  console.error(
                                    '[CommissionsSection] Validate single failed:',
                                    error
                                  );
                                }
                              );
                            }}
                            disabled={processing}
                          >
                            Valider
                          </ButtonV2>
                        )}
                        {commission.status === 'validated' && (
                          <ButtonV2
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              void handleMarkPaid([commission.id]).catch(
                                error => {
                                  console.error(
                                    '[CommissionsSection] Mark paid single failed:',
                                    error
                                  );
                                }
                              );
                            }}
                            disabled={processing}
                          >
                            Payer
                          </ButtonV2>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

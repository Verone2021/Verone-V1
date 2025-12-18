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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@verone/ui';
import { formatPrice } from '@verone/utils';
import { createClient } from '@verone/utils/supabase/client';
import {
  Search,
  Wallet,
  Clock,
  CheckCircle,
  CreditCard,
  Download,
  Eye,
  Banknote,
  Hourglass,
  ArrowRightCircle,
} from 'lucide-react';

import { PaymentRequestModalAdmin } from '../components/PaymentRequestModalAdmin';

// ============================================
// TYPES
// ============================================

interface Commission {
  id: string;
  affiliate_id: string;
  selection_id: string | null;
  order_id: string;
  order_item_id: string | null;
  order_amount_ht: number;
  affiliate_commission: number;
  affiliate_commission_ttc: number | null;
  linkme_commission: number;
  margin_rate_applied: number;
  linkme_rate_applied: number;
  tax_rate: number | null;
  order_number: string | null;
  status: string | null;
  validated_at: string | null;
  paid_at: string | null;
  payment_reference: string | null;
  payment_method: string | null;
  created_at: string | null;
  // Joined
  affiliate?: {
    display_name: string;
    enseigne_id: string | null;
    organisation_id: string | null;
  } | null;
  sales_order?: {
    order_number: string;
    payment_status: string | null;
    customer_type: string;
    total_ttc: number | null;
  } | null;
}

interface Affiliate {
  id: string;
  display_name: string;
  enseigne_id: string | null;
  organisation_id: string | null;
}

// ============================================
// TABS CONFIGURATION
// ============================================

type TabType = 'en_attente' | 'payables' | 'en_cours' | 'payees';

const TABS_CONFIG: Record<
  TabType,
  {
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    description: string;
    color: string;
  }
> = {
  en_attente: {
    label: 'En attente',
    icon: Clock,
    description: 'Commandes non payées par le client',
    color: 'text-orange-600',
  },
  payables: {
    label: 'Payables',
    icon: Banknote,
    description: 'Commissions à percevoir',
    color: 'text-green-600',
  },
  en_cours: {
    label: 'En cours de règlement',
    icon: Hourglass,
    description: 'Demandes de paiement en attente',
    color: 'text-blue-600',
  },
  payees: {
    label: 'Payées',
    icon: CheckCircle,
    description: 'Commissions versées',
    color: 'text-emerald-600',
  },
};

// ============================================
// STATUS CONFIG
// ============================================

const statusConfig = {
  pending: {
    label: 'En attente',
    variant: 'outline' as const,
    icon: Clock,
  },
  validated: {
    label: 'Payable',
    variant: 'default' as const,
    icon: CheckCircle,
  },
  requested: {
    label: 'Demandée',
    variant: 'secondary' as const,
    icon: ArrowRightCircle,
  },
  paid: {
    label: 'Payée',
    variant: 'default' as const,
    icon: CreditCard,
  },
};

// ============================================
// COMPONENT
// ============================================

export default function LinkMeCommissionsPage() {
  const { toast } = useToast();
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [affiliates, setAffiliates] = useState<Affiliate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [affiliateFilter, setAffiliateFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [processing, setProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('payables');
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    const supabase = createClient();
    setLoading(true);

    try {
      // Fetch commissions with joins
      const { data: commissionsData, error: commissionsError } = await supabase
        .from('linkme_commissions')
        .select(
          `
          *,
          affiliate:linkme_affiliates(display_name, enseigne_id, organisation_id),
          sales_order:sales_orders(order_number, payment_status, customer_type, total_ttc)
        `
        )
        .order('created_at', { ascending: false });

      if (commissionsError) throw commissionsError;

      // Fetch affiliates for filter
      const { data: affiliatesData, error: affiliatesError } = await supabase
        .from('linkme_affiliates')
        .select('id, display_name, enseigne_id, organisation_id');

      if (affiliatesError) throw affiliatesError;

      setCommissions((commissionsData as unknown as Commission[]) || []);
      setAffiliates((affiliatesData as unknown as Affiliate[]) || []);
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

  // ============================================
  // FILTER BY TAB
  // ============================================

  function getCommissionsByTab(tab: TabType): Commission[] {
    return commissions.filter(c => {
      const commissionStatus = c.status || 'pending';

      switch (tab) {
        case 'en_attente':
          // Client n'a pas payé, commission en attente
          return commissionStatus === 'pending';
        case 'payables':
          // Commission prête pour demande de paiement (client a payé)
          return commissionStatus === 'validated';
        case 'en_cours':
          // Demande de paiement en cours
          return commissionStatus === 'requested';
        case 'payees':
          // Commissions payées à l'affilié
          return commissionStatus === 'paid';
        default:
          return false;
      }
    });
  }

  function applyFilters(list: Commission[]): Commission[] {
    return list.filter(c => {
      // Search by order number
      const orderNum =
        c.order_number || c.sales_order?.order_number || c.order_id || '';
      const matchesSearch = orderNum
        .toLowerCase()
        .includes(searchTerm.toLowerCase());

      // Filter by affiliate
      const matchesAffiliate =
        affiliateFilter === 'all' || c.affiliate_id === affiliateFilter;

      // Filter by type (enseigne vs organisation)
      let matchesType = true;
      if (typeFilter !== 'all') {
        const isEnseigne = !!c.affiliate?.enseigne_id;
        matchesType =
          (typeFilter === 'enseigne' && isEnseigne) ||
          (typeFilter === 'organisation' && !isEnseigne);
      }

      return matchesSearch && matchesAffiliate && matchesType;
    });
  }

  // ============================================
  // ACTIONS
  // ============================================

  // Ouvrir le modal de paiement (au lieu de l'ancienne fonction cassée)
  function openPaymentModal() {
    if (selectedIds.length === 0) {
      toast({
        title: 'Aucune sélection',
        description: 'Veuillez sélectionner au moins une commission',
        variant: 'destructive',
      });
      return;
    }
    setIsPaymentModalOpen(true);
  }

  // Callback succès après création de la demande
  function handlePaymentSuccess() {
    toast({
      title: 'Demande créée',
      description: `Demande de paiement créée avec succès`,
    });
    setSelectedIds([]);
    fetchData();
  }

  async function handleMarkPaid(ids: string[]) {
    const supabase = createClient();
    setProcessing(true);

    try {
      const { error } = await supabase
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
      fetchData();
    } catch (error) {
      console.error('Error marking paid:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de marquer comme payé',
        variant: 'destructive',
      });
    } finally {
      setProcessing(false);
    }
  }

  function exportToCSV() {
    const filtered = applyFilters(getCommissionsByTab(activeTab));
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
      'N° Commande',
      'Affilié',
      'Type',
      'Paiement Client',
      'Total HT',
      'Commission HT',
      'Commission TTC',
      'Statut',
    ];

    const rows = filtered.map(c => [
      c.created_at ? new Date(c.created_at).toLocaleDateString('fr-FR') : '-',
      c.order_number || c.sales_order?.order_number || '-',
      c.affiliate?.display_name || 'N/A',
      c.affiliate?.enseigne_id ? 'Enseigne' : 'Organisation',
      c.sales_order?.payment_status === 'paid' ? 'Payé' : 'En attente',
      c.order_amount_ht.toFixed(2),
      c.affiliate_commission.toFixed(2),
      (c.affiliate_commission_ttc || c.affiliate_commission * 1.2).toFixed(2),
      statusConfig[(c.status || 'pending') as keyof typeof statusConfig]
        ?.label || c.status,
    ]);

    const csv = [headers.join(';'), ...rows.map(r => r.join(';'))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `commissions-linkme-${activeTab}-${new Date().toISOString().slice(0, 10)}.csv`;
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

  function toggleSelectAll(list: Commission[]) {
    if (selectedIds.length === list.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(list.map(c => c.id));
    }
  }

  // ============================================
  // COMPUTED VALUES
  // ============================================

  const tabCounts: Record<TabType, { count: number; total: number }> = {
    en_attente: {
      count: getCommissionsByTab('en_attente').length,
      total: getCommissionsByTab('en_attente').reduce(
        (sum, c) => sum + c.affiliate_commission,
        0
      ),
    },
    payables: {
      count: getCommissionsByTab('payables').length,
      total: getCommissionsByTab('payables').reduce(
        (sum, c) => sum + c.affiliate_commission,
        0
      ),
    },
    en_cours: {
      count: getCommissionsByTab('en_cours').length,
      total: getCommissionsByTab('en_cours').reduce(
        (sum, c) => sum + c.affiliate_commission,
        0
      ),
    },
    payees: {
      count: getCommissionsByTab('payees').length,
      total: getCommissionsByTab('payees').reduce(
        (sum, c) => sum + c.affiliate_commission,
        0
      ),
    },
  };

  // ============================================
  // RENDER
  // ============================================

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Rémunération</h1>
          <p className="text-muted-foreground">
            Gestion des commissions affiliés LinkMe
          </p>
        </div>
        <ButtonV2 variant="outline" onClick={exportToCSV}>
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </ButtonV2>
      </div>

      {/* KPI CARDS */}
      <div className="grid gap-4 md:grid-cols-4">
        {(Object.keys(TABS_CONFIG) as TabType[]).map(tab => {
          const config = TABS_CONFIG[tab];
          const Icon = config.icon;
          const data = tabCounts[tab];

          return (
            <Card
              key={tab}
              className={`cursor-pointer transition-all hover:shadow-md ${
                activeTab === tab ? 'ring-2 ring-primary' : ''
              }`}
              onClick={() => setActiveTab(tab)}
            >
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <Icon className={`h-4 w-4 ${config.color}`} />
                  <CardTitle className="text-sm font-medium">
                    {config.label}
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${config.color}`}>
                  {formatPrice(data.total)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {data.count} commande{data.count > 1 ? 's' : ''}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* TABS */}
      <Tabs
        value={activeTab}
        onValueChange={v => {
          setActiveTab(v as TabType);
          setSelectedIds([]);
        }}
      >
        <TabsList className="grid w-full grid-cols-4">
          {(Object.keys(TABS_CONFIG) as TabType[]).map(tab => {
            const config = TABS_CONFIG[tab];
            const Icon = config.icon;
            return (
              <TabsTrigger key={tab} value={tab} className="gap-2">
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{config.label}</span>
                <Badge variant="secondary" className="ml-1">
                  {tabCounts[tab].count}
                </Badge>
              </TabsTrigger>
            );
          })}
        </TabsList>

        {(Object.keys(TABS_CONFIG) as TabType[]).map(tab => {
          const config = TABS_CONFIG[tab];
          const tabCommissions = applyFilters(getCommissionsByTab(tab));
          const showCheckboxes = tab === 'payables' || tab === 'en_cours';

          return (
            <TabsContent key={tab} value={tab} className="mt-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {config.label}
                        <Badge variant="outline">
                          {tabCounts[tab].count} commande
                          {tabCounts[tab].count > 1 ? 's' : ''}
                        </Badge>
                      </CardTitle>
                      <CardDescription>{config.description}</CardDescription>
                    </div>
                    {tab === 'payables' && selectedIds.length > 0 && (
                      <ButtonV2
                        onClick={openPaymentModal}
                        disabled={processing}
                      >
                        <Banknote className="h-4 w-4 mr-2" />
                        Payer ({selectedIds.length})
                      </ButtonV2>
                    )}
                    {tab === 'en_cours' && selectedIds.length > 0 && (
                      <ButtonV2
                        onClick={() => handleMarkPaid(selectedIds)}
                        disabled={processing}
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Marquer payé ({selectedIds.length})
                      </ButtonV2>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {/* FILTERS */}
                  <div className="flex flex-wrap gap-4 mb-6">
                    <div className="relative flex-1 min-w-[200px]">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Rechercher par N° commande..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    <Select
                      value={affiliateFilter}
                      onValueChange={setAffiliateFilter}
                    >
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
                    <Select value={typeFilter} onValueChange={setTypeFilter}>
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tous les types</SelectItem>
                        <SelectItem value="enseigne">Enseigne</SelectItem>
                        <SelectItem value="organisation">
                          Organisation
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* TABLE */}
                  {tabCommissions.length === 0 ? (
                    <div className="text-center py-12">
                      <Wallet className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <h3 className="text-lg font-medium mb-2">
                        Aucune commission
                      </h3>
                      <p className="text-muted-foreground">
                        {config.description}
                      </p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          {showCheckboxes && (
                            <TableHead className="w-[50px]">
                              <Checkbox
                                checked={
                                  selectedIds.length ===
                                    tabCommissions.length &&
                                  tabCommissions.length > 0
                                }
                                onCheckedChange={() =>
                                  toggleSelectAll(tabCommissions)
                                }
                              />
                            </TableHead>
                          )}
                          <TableHead>Date</TableHead>
                          <TableHead>N° Commande</TableHead>
                          <TableHead>Affilié</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Paiement</TableHead>
                          <TableHead className="text-right">Total HT</TableHead>
                          <TableHead className="text-right">
                            Total TTC
                          </TableHead>
                          <TableHead className="text-right">Marge HT</TableHead>
                          <TableHead className="text-right text-orange-600">
                            Marge TTC
                          </TableHead>
                          <TableHead className="w-[50px]" />
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {tabCommissions.map(commission => {
                          const affiliateType = commission.affiliate
                            ?.enseigne_id
                            ? 'Enseigne'
                            : 'Organisation';
                          const orderNumber =
                            commission.order_number ||
                            commission.sales_order?.order_number ||
                            `#${commission.order_id.slice(0, 8)}`;
                          const commissionTTC =
                            commission.affiliate_commission_ttc ||
                            commission.affiliate_commission *
                              (1 + (commission.tax_rate || 0.2));

                          return (
                            <TableRow key={commission.id}>
                              {showCheckboxes && (
                                <TableCell>
                                  <Checkbox
                                    checked={selectedIds.includes(
                                      commission.id
                                    )}
                                    onCheckedChange={() =>
                                      toggleSelect(commission.id)
                                    }
                                  />
                                </TableCell>
                              )}
                              <TableCell>
                                {commission.created_at
                                  ? new Date(
                                      commission.created_at
                                    ).toLocaleDateString('fr-FR', {
                                      day: '2-digit',
                                      month: '2-digit',
                                      year: '2-digit',
                                    })
                                  : '-'}
                              </TableCell>
                              <TableCell className="font-mono text-sm font-medium">
                                {orderNumber}
                              </TableCell>
                              <TableCell>
                                {commission.affiliate?.display_name || 'N/A'}
                              </TableCell>
                              <TableCell>
                                <Badge
                                  variant={
                                    affiliateType === 'Enseigne'
                                      ? 'default'
                                      : 'secondary'
                                  }
                                >
                                  {affiliateType}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <Badge
                                  variant={
                                    commission.sales_order?.payment_status ===
                                    'paid'
                                      ? 'default'
                                      : 'outline'
                                  }
                                  className={
                                    commission.sales_order?.payment_status ===
                                    'paid'
                                      ? 'bg-green-100 text-green-700 border-green-200'
                                      : 'bg-orange-50 text-orange-600 border-orange-200'
                                  }
                                >
                                  {commission.sales_order?.payment_status ===
                                  'paid'
                                    ? 'Payé'
                                    : 'En attente'}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                {formatPrice(commission.order_amount_ht)}
                              </TableCell>
                              <TableCell className="text-right">
                                {formatPrice(
                                  commission.sales_order?.total_ttc ||
                                    commission.order_amount_ht * 1.2
                                )}
                              </TableCell>
                              <TableCell className="text-right font-medium">
                                {formatPrice(commission.affiliate_commission)}
                              </TableCell>
                              <TableCell className="text-right font-bold text-orange-600">
                                {formatPrice(commissionTTC)}
                              </TableCell>
                              <TableCell>
                                <ButtonV2
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0"
                                >
                                  <Eye className="h-4 w-4" />
                                </ButtonV2>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          );
        })}
      </Tabs>

      {/* Modal de paiement */}
      {(() => {
        // Récupérer les commissions sélectionnées
        const selectedCommissions = commissions.filter(c =>
          selectedIds.includes(c.id)
        );
        // Déterminer l'affilié (on prend le premier sélectionné)
        const firstSelected = selectedCommissions[0];
        const affiliateId = firstSelected?.affiliate_id || '';
        const affiliateName =
          firstSelected?.affiliate?.display_name || 'Affilié';

        return (
          <PaymentRequestModalAdmin
            isOpen={isPaymentModalOpen}
            onClose={() => setIsPaymentModalOpen(false)}
            selectedCommissions={selectedCommissions}
            affiliateId={affiliateId}
            affiliateName={affiliateName}
            onSuccess={handlePaymentSuccess}
          />
        );
      })()}
    </div>
  );
}

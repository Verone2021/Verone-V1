// =====================================================================
// Composant: InvoicesList
// Date: 2025-10-11
// Description: Liste factures avec filtres (status, date) et pagination
// =====================================================================

'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ButtonV2 } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { FileText, Calendar, DollarSign, Loader2, Search } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// =====================================================================
// TYPES
// =====================================================================

interface Invoice {
  id: string;
  abby_invoice_number: string;
  sales_order_id: string;
  total_ht: number;
  total_ttc: number;
  tva_amount: number;
  status: 'draft' | 'sent' | 'paid' | 'partially_paid' | 'overdue' | 'cancelled' | 'refunded';
  issue_date: string;
  due_date: string;
  created_at: string;
}

// =====================================================================
// CONFIGURATION
// =====================================================================

const STATUS_LABELS: Record<Invoice['status'], string> = {
  draft: 'Brouillon',
  sent: 'Envoyée',
  paid: 'Payée',
  partially_paid: 'Partiellement payée',
  overdue: 'En retard',
  cancelled: 'Annulée',
  refunded: 'Remboursée',
};

const STATUS_VARIANTS: Record<Invoice['status'], 'default' | 'secondary' | 'destructive'> = {
  draft: 'secondary',
  sent: 'secondary',
  paid: 'secondary',
  partially_paid: 'secondary',
  overdue: 'destructive',
  cancelled: 'secondary',
  refunded: 'secondary',
};

const ITEMS_PER_PAGE = 20;

// =====================================================================
// COMPOSANT
// =====================================================================

export function InvoicesList() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Filtres
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const { toast } = useToast();
  const supabase = createClient();

  // Fetch factures avec filtres
  useEffect(() => {
    const fetchInvoices = async () => {
      setIsLoading(true);

      try {
        let query = supabase
          .from('invoices')
          .select('*', { count: 'exact' })
          .order('created_at', { ascending: false });

        // Filtre statut
        if (statusFilter !== 'all') {
          query = query.eq('status', statusFilter);
        }

        // Filtre recherche (numéro facture)
        if (searchQuery.trim()) {
          query = query.ilike('abby_invoice_number', `%${searchQuery.trim()}%`);
        }

        // Pagination
        const start = (currentPage - 1) * ITEMS_PER_PAGE;
        const end = start + ITEMS_PER_PAGE - 1;
        query = query.range(start, end);

        const { data, error, count } = await query;

        if (error) {
          throw error;
        }

        setInvoices(data as any || []);
        setTotalCount(count || 0);
      } catch (error) {
        console.error('Erreur chargement factures:', error);

        toast({
          title: 'Erreur',
          description: 'Impossible de charger les factures',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchInvoices();
  }, [statusFilter, searchQuery, currentPage, supabase, toast]);

  // Calculer pagination
  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  // Formater montant
  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  };

  // Formater date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="space-y-4">
      {/* Header avec filtres */}
      <Card>
        <CardHeader>
          <CardTitle>Factures</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Recherche */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Rechercher par numéro de facture..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1); // Reset pagination
                  }}
                  className="pl-9"
                />
              </div>
            </div>

            {/* Filtre statut */}
            <Select
              value={statusFilter}
              onValueChange={(value) => {
                setStatusFilter(value);
                setCurrentPage(1); // Reset pagination
              }}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filtrer par statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="draft">Brouillon</SelectItem>
                <SelectItem value="sent">Envoyée</SelectItem>
                <SelectItem value="paid">Payée</SelectItem>
                <SelectItem value="partially_paid">Part. payée</SelectItem>
                <SelectItem value="overdue">En retard</SelectItem>
                <SelectItem value="cancelled">Annulée</SelectItem>
                <SelectItem value="refunded">Remboursée</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Stats rapides */}
          <div className="mt-4 text-sm text-muted-foreground">
            {totalCount} facture{totalCount > 1 ? 's' : ''} trouvée{totalCount > 1 ? 's' : ''}
          </div>
        </CardContent>
      </Card>

      {/* Liste factures */}
      {isLoading ? (
        <div className="flex items-center justify-center p-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : invoices.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-12 text-center">
            <FileText className="mb-4 h-12 w-12 text-muted-foreground" />
            <p className="text-lg font-medium">Aucune facture trouvée</p>
            <p className="text-sm text-muted-foreground">
              Essayez de modifier vos filtres de recherche
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {invoices.map((invoice) => (
            <Card key={invoice.id}>
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  {/* Infos principales */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-muted-foreground" />
                      <span className="font-mono font-semibold">
                        {invoice.abby_invoice_number}
                      </span>
                      <Badge variant={STATUS_VARIANTS[invoice.status]}>
                        {STATUS_LABELS[invoice.status]}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        Émise le {formatDate(invoice.issue_date)}
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        Échéance: {formatDate(invoice.due_date)}
                      </div>
                    </div>
                  </div>

                  {/* Montants */}
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <div className="text-sm text-muted-foreground">Total HT</div>
                      <div className="font-semibold">{formatAmount(invoice.total_ht)}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-muted-foreground">Total TTC</div>
                      <div className="text-lg font-bold">{formatAmount(invoice.total_ttc)}</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <ButtonV2
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            Précédent
          </ButtonV2>

          <span className="text-sm text-muted-foreground">
            Page {currentPage} sur {totalPages}
          </span>

          <ButtonV2
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
          >
            Suivant
          </ButtonV2>
        </div>
      )}
    </div>
  );
}

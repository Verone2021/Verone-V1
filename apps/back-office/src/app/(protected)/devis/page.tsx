'use client';

import { useEffect, useState } from 'react';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

import {
  OrderSelectModal,
  QuoteCreateFromOrderModal,
  QuoteCreateServiceModal,
  type IOrderForDocument,
} from '@verone/finance/components';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@verone/ui';
import {
  Briefcase,
  ChevronDown,
  Download,
  Eye,
  FileEdit,
  Loader2,
  Plus,
  RefreshCw,
  Send,
  ShoppingCart,
  Trash2,
} from 'lucide-react';

interface Quote {
  id: string;
  quote_number: string;
  status:
    | 'draft'
    | 'pending_approval'
    | 'finalized'
    | 'accepted'
    | 'declined'
    | 'expired';
  currency: string;
  total_amount: number;
  issue_date: string;
  expiry_date: string;
  client?: {
    name: string;
  };
  converted_to_invoice_id?: string;
}

function formatAmount(amount: number, currency = 'EUR'): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency,
  }).format(amount);
}

function formatDate(dateString: string): string {
  return new Intl.DateTimeFormat('fr-FR').format(new Date(dateString));
}

function StatusBadge({ status }: { status: string }): React.ReactNode {
  const variants: Record<
    string,
    'default' | 'secondary' | 'destructive' | 'outline'
  > = {
    draft: 'secondary',
    pending_approval: 'outline',
    finalized: 'default',
    accepted: 'default',
    declined: 'destructive',
    expired: 'outline',
  };

  const labels: Record<string, string> = {
    draft: 'Brouillon',
    pending_approval: 'En attente',
    finalized: 'Finalisé',
    accepted: 'Accepté',
    declined: 'Refusé',
    expired: 'Expiré',
  };

  return (
    <Badge variant={variants[status] || 'outline'}>
      {labels[status] || status}
    </Badge>
  );
}

export default function DevisPage(): React.ReactNode {
  const router = useRouter();
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal states
  const [showOrderSelect, setShowOrderSelect] = useState(false);
  const [showQuoteCreate, setShowQuoteCreate] = useState(false);
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<IOrderForDocument | null>(
    null
  );
  const [quoteToDelete, setQuoteToDelete] = useState<Quote | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [finalizingId, setFinalizingId] = useState<string | null>(null);

  const fetchQuotes = async (): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/qonto/quotes');
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to fetch quotes');
      }

      setQuotes(data.quotes || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchQuotes();
  }, []);

  const handleOrderSelected = (order: IOrderForDocument): void => {
    setSelectedOrder(order);
    setShowOrderSelect(false);
    setShowQuoteCreate(true);
  };

  const handleQuoteCreated = (): void => {
    setShowQuoteCreate(false);
    setSelectedOrder(null);
    void fetchQuotes();
  };

  const handleDownloadPdf = async (quote: Quote): Promise<void> => {
    try {
      const response = await fetch(`/api/qonto/quotes/${quote.id}/pdf`);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error || `Erreur ${response.status}: ${response.statusText}`
        );
      }

      const blob = await response.blob();

      // Vérifier que le blob contient des données
      if (blob.size === 0) {
        throw new Error('Le PDF est vide');
      }

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `devis-${quote.quote_number}.pdf`;
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();

      // Délai avant de révoquer l'URL pour laisser le téléchargement démarrer
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }, 1000);
    } catch (err) {
      console.error('Download error:', err);
      setError(err instanceof Error ? err.message : 'Erreur de téléchargement');
    }
  };

  const handleDeleteQuote = async (): Promise<void> => {
    if (!quoteToDelete) return;

    setDeleting(true);
    try {
      const response = await fetch(`/api/qonto/quotes/${quoteToDelete.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Erreur lors de la suppression');
      }

      // Refresh the list
      void fetchQuotes();
    } catch (err) {
      console.error('Delete error:', err);
      setError(err instanceof Error ? err.message : 'Erreur de suppression');
    } finally {
      setDeleting(false);
      setQuoteToDelete(null);
    }
  };

  const handleFinalizeQuote = async (quote: Quote): Promise<void> => {
    setFinalizingId(quote.id);
    try {
      const response = await fetch(`/api/qonto/quotes/${quote.id}/finalize`, {
        method: 'POST',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Erreur lors de la finalisation');
      }

      // Refresh the list
      void fetchQuotes();
    } catch (err) {
      console.error('Finalize error:', err);
      setError(err instanceof Error ? err.message : 'Erreur de finalisation');
    } finally {
      setFinalizingId(null);
    }
  };

  // Helper to check if quote is a draft
  const isDraftQuote = (quote: Quote): boolean => {
    return quote.status === 'draft' || quote.status === 'pending_approval';
  };

  // Helper to check if quote is finalized (PDF available)
  const isFinalized = (quote: Quote): boolean => {
    return ['finalized', 'accepted', 'declined', 'expired'].includes(
      quote.status
    );
  };

  return (
    <div className="container mx-auto space-y-6 py-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Devis</h1>
          <p className="text-muted-foreground">
            Gestion des devis clients (Quotes)
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchQuotes} disabled={loading}>
            <RefreshCw
              className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`}
            />
            Actualiser
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Nouveau devis
                <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setShowOrderSelect(true)}>
                <ShoppingCart className="mr-2 h-4 w-4" />
                Depuis une commande
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setShowServiceModal(true)}>
                <Briefcase className="mr-2 h-4 w-4" />
                Devis de service
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileEdit className="h-5 w-5" />
            Liste des devis
          </CardTitle>
          <CardDescription>
            Créez des devis depuis vos commandes et convertissez-les en factures
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3].map(i => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : error ? (
            <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-4 text-destructive">
              {error}
            </div>
          ) : quotes.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              <FileEdit className="mx-auto mb-4 h-12 w-12 opacity-50" />
              <p>Aucun devis</p>
              <p className="text-sm">
                Cliquez sur &quot;Nouveau devis&quot; pour en créer un
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>N° Devis</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Expiration</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Montant</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {quotes.map(quote => (
                  <TableRow key={quote.id}>
                    <TableCell className="font-mono">
                      {quote.quote_number}
                    </TableCell>
                    <TableCell>{quote.client?.name || '-'}</TableCell>
                    <TableCell>{formatDate(quote.issue_date)}</TableCell>
                    <TableCell>{formatDate(quote.expiry_date)}</TableCell>
                    <TableCell>
                      <StatusBadge status={quote.status} />
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatAmount(quote.total_amount, quote.currency)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" asChild>
                          <Link href={`/devis/${quote.id}`} title="Voir">
                            <Eye className="h-4 w-4" />
                          </Link>
                        </Button>
                        {isDraftQuote(quote) && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleFinalizeQuote(quote)}
                            title="Envoyer au client"
                            disabled={finalizingId === quote.id}
                            className="text-primary hover:text-primary hover:bg-primary/10"
                          >
                            {finalizingId === quote.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Send className="h-4 w-4" />
                            )}
                          </Button>
                        )}
                        {/* Voir PDF - ouvre dans nouvel onglet */}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() =>
                            window.open(
                              `/api/qonto/quotes/${quote.id}/view`,
                              '_blank'
                            )
                          }
                          title="Voir PDF"
                          className="text-primary hover:text-primary hover:bg-primary/10"
                        >
                          <FileEdit className="h-4 w-4" />
                        </Button>
                        {/* Télécharger PDF */}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDownloadPdf(quote)}
                          title="Télécharger PDF"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        {isDraftQuote(quote) && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setQuoteToDelete(quote)}
                            title="Supprimer"
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Modal sélection commande */}
      <OrderSelectModal
        open={showOrderSelect}
        onOpenChange={setShowOrderSelect}
        onSelectOrder={handleOrderSelected}
      />

      {/* Modal création devis depuis commande */}
      <QuoteCreateFromOrderModal
        order={selectedOrder}
        open={showQuoteCreate}
        onOpenChange={setShowQuoteCreate}
        onSuccess={handleQuoteCreated}
      />

      {/* Modal création devis de service (sans commande) */}
      <QuoteCreateServiceModal
        open={showServiceModal}
        onOpenChange={setShowServiceModal}
        onSuccess={() => {
          void fetchQuotes();
        }}
      />

      {/* Dialog confirmation suppression */}
      <AlertDialog
        open={!!quoteToDelete}
        onOpenChange={open => !open && setQuoteToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce devis ?</AlertDialogTitle>
            <AlertDialogDescription>
              Vous allez supprimer le devis{' '}
              <strong>{quoteToDelete?.quote_number}</strong>. Cette action est
              irreversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteQuote}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? 'Suppression...' : 'Supprimer'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

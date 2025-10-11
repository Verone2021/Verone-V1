// =====================================================================
// Page: Rapprochement Bancaire
// Date: 2025-10-11
// Description: Interface rapprochement manuel transactions bancaires ↔ factures
// STATUS: DÉSACTIVÉ Phase 1 - Placeholder uniquement
// =====================================================================

'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, Lock } from 'lucide-react';
import { featureFlags } from '@/lib/feature-flags';

// =====================================================================
// PAGE COMPONENT
// =====================================================================

export default function RapprochementPage() {
  // FEATURE FLAG: Finance module disabled for Phase 1
  if (!featureFlags.financeEnabled) {
    return (
      <div className="container mx-auto py-8">
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <div className="flex items-center gap-3">
              <Lock className="h-6 w-6 text-orange-600" />
              <div>
                <CardTitle className="text-orange-900">Module Rapprochement Bancaire - Phase 2</CardTitle>
                <CardDescription className="text-orange-700">
                  Ce module sera disponible après le déploiement Phase 1
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-orange-900">Fonctionnalités Phase 2</p>
                  <ul className="text-sm text-orange-700 list-disc list-inside mt-1">
                    <li>Rapprochement automatique transactions Qonto ↔ factures</li>
                    <li>Suggestions intelligentes avec score de confiance</li>
                    <li>Validation manuelle transactions non rapprochées</li>
                    <li>Export CSV pour comptabilité</li>
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  /* CODE ORIGINAL - RÉACTIVATION PHASE 2
  const {
    unmatchedTransactions,
    unpaidInvoices,
    stats,
    loading,
    error,
    matchTransaction,
    ignoreTransaction,
    refresh,
  } = useBankReconciliation();

  const { toast } = useToast();
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true);

  // ===================================================================
  // AUTO-REFRESH (Polling 30s)
  // ===================================================================

  useEffect(() => {
    if (!autoRefreshEnabled) return;

    const interval = setInterval(() => {
      refresh();
    }, 30000); // 30 secondes

    return () => clearInterval(interval);
  }, [autoRefreshEnabled, refresh]);

  // ===================================================================
  // HANDLERS
  // ===================================================================

  const handleAcceptSuggestion = async (transactionId: string, invoiceId: string) => {
    try {
      setProcessingId(transactionId);
      await matchTransaction(transactionId, invoiceId, 'Auto-suggestion acceptée');
      toast({
        title: 'Rapprochement réussi',
        description: 'La transaction a été rapprochée avec succès',
      });
    } catch (err: any) {
      toast({
        title: 'Erreur',
        description: err.message || 'Impossible de rapprocher la transaction',
        variant: 'destructive',
      });
    } finally {
      setProcessingId(null);
    }
  };

  const handleIgnoreTransaction = async (transactionId: string) => {
    try {
      setProcessingId(transactionId);
      await ignoreTransaction(transactionId, 'Transaction ignorée par admin (frais bancaires, etc.)');
      toast({
        title: 'Transaction ignorée',
        description: 'La transaction a été marquée comme ignorée',
      });
    } catch (err: any) {
      toast({
        title: 'Erreur',
        description: err.message || 'Impossible d\'ignorer la transaction',
        variant: 'destructive',
      });
    } finally {
      setProcessingId(null);
    }
  };

  const handleExportCSV = () => {
    try {
      const csvData = arrayToCSV(
        unmatchedTransactions,
        [
          { key: 'settled_at' as const, label: 'Date' },
          { key: 'label' as const, label: 'Libellé' },
          { key: 'counterparty_name' as const, label: 'Contrepartie' },
          { key: 'amount' as const, label: 'Montant' },
          { key: 'currency' as const, label: 'Devise' },
          { key: 'operation_type' as const, label: 'Type' },
        ]
      );

      const filename = `rapprochement-bancaire-${new Date().toISOString().split('T')[0]}.csv`;
      downloadCSV(csvData, filename);

      toast({
        title: 'Export réussi',
        description: `${unmatchedTransactions.length} transactions exportées`,
      });
    } catch (err: any) {
      toast({
        title: 'Erreur',
        description: 'Impossible d\'exporter les transactions',
        variant: 'destructive',
      });
    }
  };

  // ===================================================================
  // LOADING STATE
  // ===================================================================

  if (loading) {
    return (
      <div className="container mx-auto py-6 px-4 space-y-6">
        <div>
          <Skeleton className="h-9 w-64" />
          <Skeleton className="h-5 w-96 mt-2" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-5 w-32" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-24" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // ===================================================================
  // ERROR STATE
  // ===================================================================

  if (error) {
    return (
      <div className="container mx-auto py-6 px-4">
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-900 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Erreur
            </CardTitle>
            <CardDescription className="text-red-700">{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={refresh} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Réessayer
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ===================================================================
  // MAIN RENDER
  // ===================================================================

  return (
    <div className="container mx-auto py-6 px-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Rapprochement Bancaire</h1>
          <p className="text-muted-foreground mt-1">
            Validation manuelle des {stats?.manual_review_count || 0} transactions non rapprochées
            automatiquement
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => setAutoRefreshEnabled(!autoRefreshEnabled)}
            variant={autoRefreshEnabled ? 'default' : 'outline'}
            size="sm"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${autoRefreshEnabled ? 'animate-spin' : ''}`} />
            {autoRefreshEnabled ? 'Auto-refresh ON' : 'Auto-refresh OFF'}
          </Button>
          <Button onClick={refresh} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualiser
          </Button>
        </div>
      </div>

      {/* KPIs Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="text-xs">Transactions en attente</CardDescription>
            <CardTitle className="text-2xl">{stats?.total_unmatched || 0}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Banknote className="h-4 w-4" />
              <span>
                {stats?.total_amount_pending.toLocaleString('fr-FR', {
                  style: 'currency',
                  currency: 'EUR',
                })}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="text-xs">Taux auto-match</CardDescription>
            <CardTitle className="text-2xl">{stats?.auto_match_rate.toFixed(0)}%</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-1 text-sm text-green-600">
              <TrendingUp className="h-4 w-4" />
              <span>Objectif: 95%</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="text-xs">Revue manuelle</CardDescription>
            <CardTitle className="text-2xl">{stats?.manual_review_count || 0}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-1 text-sm text-orange-600">
              <AlertTriangle className="h-4 w-4" />
              <span>À traiter</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="text-xs">Factures impayées</CardDescription>
            <CardTitle className="text-2xl">{unpaidInvoices.length}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <FileText className="h-4 w-4" />
              <span>En attente</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Transactions Non Rapprochées */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Transactions à rapprocher</CardTitle>
              <CardDescription>
                Suggestions automatiques avec score de confiance
              </CardDescription>
            </div>
            {unmatchedTransactions.length > 0 && (
              <Button onClick={handleExportCSV} variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Exporter CSV
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {unmatchedTransactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <CheckCircle className="h-12 w-12 text-green-600 mb-4" />
              <h3 className="text-lg font-semibold">Tout est à jour !</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Aucune transaction en attente de rapprochement
              </p>
            </div>
          ) : (
            unmatchedTransactions.map((transaction) => (
              <div
                key={transaction.id}
                className="border rounded-lg p-4 space-y-3 hover:bg-accent/50 transition-colors"
              >
                {/* Transaction Header */}
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold">{transaction.label}</h4>
                      <Badge variant="outline" className="text-xs">
                        {transaction.operation_type}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                      <span>
                        {new Date(transaction.settled_at || transaction.emitted_at).toLocaleDateString('fr-FR')}
                      </span>
                      {transaction.counterparty_name && (
                        <span>De: {transaction.counterparty_name}</span>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-green-600">
                      +{transaction.amount.toLocaleString('fr-FR', {
                        style: 'currency',
                        currency: transaction.currency,
                      })}
                    </p>
                  </div>
                </div>

                {/* Suggestions */}
                {transaction.suggestions && transaction.suggestions.length > 0 ? (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Suggestions de rapprochement :</p>
                    {transaction.suggestions.map((suggestion, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-md p-3"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <Badge
                              variant={suggestion.confidence >= 80 ? 'default' : 'secondary'}
                              className="text-xs"
                            >
                              {suggestion.confidence}% confiance
                            </Badge>
                            <span className="font-medium">{suggestion.invoice_number}</span>
                          </div>
                          <div className="text-sm text-muted-foreground mt-1">
                            {suggestion.customer_name} •{' '}
                            {suggestion.invoice_amount.toLocaleString('fr-FR', {
                              style: 'currency',
                              currency: 'EUR',
                            })}{' '}
                            • {suggestion.match_reason}
                          </div>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => handleAcceptSuggestion(transaction.id, suggestion.invoice_id)}
                          disabled={processingId === transaction.id}
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Valider
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                    <p className="text-sm text-yellow-800">
                      Aucune suggestion automatique - Rapprochement manuel requis
                    </p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-2 pt-2 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleIgnoreTransaction(transaction.id)}
                    disabled={processingId === transaction.id}
                  >
                    <XCircle className="h-4 w-4 mr-1" />
                    Ignorer
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={processingId === transaction.id}
                  >
                    <FileText className="h-4 w-4 mr-1" />
                    Matcher manuellement
                  </Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Factures Impayées (Reference) */}
      <Card>
        <CardHeader>
          <CardTitle>Factures en attente de paiement</CardTitle>
          <CardDescription>
            {unpaidInvoices.length} facture{unpaidInvoices.length > 1 ? 's' : ''} non réglée{unpaidInvoices.length > 1 ? 's' : ''}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {unpaidInvoices.slice(0, 10).map((invoice) => (
              <div
                key={invoice.id}
                className="flex items-center justify-between border-b pb-2 last:border-0"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{invoice.invoice_number}</span>
                    <Badge
                      variant={invoice.status === 'overdue' ? 'destructive' : 'secondary'}
                      className="text-xs"
                    >
                      {invoice.status === 'overdue'
                        ? `En retard ${invoice.days_overdue}j`
                        : 'Envoyée'}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{invoice.customer_name}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">
                    {invoice.amount_remaining.toLocaleString('fr-FR', {
                      style: 'currency',
                      currency: 'EUR',
                    })}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Échéance: {new Date(invoice.due_date).toLocaleDateString('fr-FR')}
                  </p>
                </div>
              </div>
            ))}
            {unpaidInvoices.length > 10 && (
              <p className="text-sm text-muted-foreground text-center pt-2">
                Et {unpaidInvoices.length - 10} autre{unpaidInvoices.length - 10 > 1 ? 's' : ''} facture{unpaidInvoices.length - 10 > 1 ? 's' : ''}...
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

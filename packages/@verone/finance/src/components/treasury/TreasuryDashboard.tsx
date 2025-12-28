'use client';

import { Alert, AlertDescription, AlertTitle, Button } from '@verone/ui';
import { RefreshCw, Loader2, AlertCircle } from 'lucide-react';

import { BankAccountsCard } from './BankAccountsCard';
import { TreasuryForecastChart } from './TreasuryForecastChart';
import { TreasuryKPICards } from './TreasuryKPICards';
import { UpcomingPaymentsCard } from './UpcomingPaymentsCard';
import { useTreasuryStats } from '../../hooks/use-treasury-stats';

export function TreasuryDashboard() {
  const {
    // Bank accounts
    bankAccounts,
    totalBalance,
    bankData,
    bankLoading,

    // Stats
    stats,
    evolution,
    forecasts,
    metrics,

    // State
    loading,
    error,

    // Actions
    refresh,
    refreshBankBalance,
  } = useTreasuryStats();

  const isLoading = loading || bankLoading;

  const handleRefresh = () => {
    refresh();
    refreshBankBalance();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Trésorerie</h1>
          <p className="text-muted-foreground">
            Vue d'ensemble de votre position de trésorerie
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Actualiser
          </Button>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Erreur</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Bank Accounts Card */}
      <BankAccountsCard
        accounts={bankAccounts}
        totalBalance={totalBalance}
        currency={bankData?.currency}
        isLoading={bankLoading}
        onRefresh={refreshBankBalance}
      />

      {/* KPI Cards */}
      <TreasuryKPICards metrics={metrics} stats={stats} isLoading={loading} />

      {/* Forecast Chart */}
      <TreasuryForecastChart
        evolution={evolution}
        forecasts={forecasts}
        currentBalance={totalBalance}
        isLoading={loading}
      />

      {/* AR/AP Cards */}
      <UpcomingPaymentsCard stats={stats} isLoading={loading} />

      {/* Last sync info */}
      {bankData?.lastUpdated && (
        <p className="text-center text-xs text-muted-foreground">
          Dernière synchronisation Qonto :{' '}
          {new Date(bankData.lastUpdated).toLocaleString('fr-FR')}
        </p>
      )}
    </div>
  );
}

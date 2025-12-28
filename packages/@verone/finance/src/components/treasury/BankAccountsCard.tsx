'use client';

import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Skeleton,
} from '@verone/ui';
import { cn } from '@verone/utils';
import { Building2, RefreshCw } from 'lucide-react';

import type { BankAccountBalance } from '../../hooks/use-treasury-stats';

interface BankAccountsCardProps {
  accounts: BankAccountBalance[];
  totalBalance: number;
  currency?: string;
  isLoading: boolean;
  onRefresh: () => void;
}

const formatCurrency = (amount: number, currency = 'EUR') => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

export function BankAccountsCard({
  accounts,
  totalBalance,
  currency = 'EUR',
  isLoading,
  onRefresh,
}: BankAccountsCardProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="flex items-center gap-2 text-sm font-medium">
            <Building2 className="h-4 w-4" />
            Vos Comptes Qonto
          </CardTitle>
          <Skeleton className="h-6 w-24" />
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2].map(i => (
            <div
              key={i}
              className="flex items-center justify-between border-b pb-2 last:border-b-0"
            >
              <div className="space-y-1">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-40" />
              </div>
              <Skeleton className="h-5 w-20" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="flex items-center gap-2 text-sm font-medium">
          <Building2 className="h-4 w-4 text-primary" />
          Vos Comptes Qonto
        </CardTitle>
        <div className="flex items-center gap-3">
          <span className="text-lg font-bold text-primary">
            {formatCurrency(totalBalance || 0, currency || 'EUR')}
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={onRefresh}
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {accounts.length === 0 ? (
          <p className="text-center text-muted-foreground py-4">
            Aucun compte bancaire trouvé
          </p>
        ) : (
          <div className="space-y-3">
            {accounts.map(account => (
              <div
                key={account.id}
                className="flex items-center justify-between border-b pb-2 last:border-b-0"
              >
                <div className="space-y-0.5">
                  <p className="font-medium text-sm">{account.name}</p>
                  <p className="text-xs text-muted-foreground font-mono">
                    {account.iban}
                  </p>
                </div>
                <div className="text-right">
                  <p
                    className={cn(
                      'font-semibold',
                      account.balance >= 0
                        ? 'text-emerald-600'
                        : 'text-destructive'
                    )}
                  >
                    {formatCurrency(account.balance, account.currency)}
                  </p>
                  {account.authorizedBalance !== account.balance && (
                    <p className="text-xs text-muted-foreground">
                      Autorisé:{' '}
                      {formatCurrency(
                        account.authorizedBalance,
                        account.currency
                      )}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

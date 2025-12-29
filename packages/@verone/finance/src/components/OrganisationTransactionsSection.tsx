'use client';

/**
 * OrganisationTransactionsSection
 * Affiche les transactions bancaires liées à une organisation
 * avec indication des pièces jointes (justificatifs)
 */

import { Card, CardContent, CardHeader, CardTitle, Badge } from '@verone/ui';
import { cn } from '@verone/utils';
import {
  ArrowDownLeft,
  ArrowUpRight,
  FileText,
  Loader2,
  Paperclip,
  RefreshCw,
  Wallet,
  AlertCircle,
} from 'lucide-react';

import { useOrganisationTransactions } from '../hooks/use-organisation-transactions';

interface OrganisationTransactionsSectionProps {
  organisationId: string;
  organisationName?: string;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  }).format(amount);
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

export function OrganisationTransactionsSection({
  organisationId,
  organisationName,
}: OrganisationTransactionsSectionProps) {
  const { transactions, stats, loading, error, refresh } =
    useOrganisationTransactions(organisationId);

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="flex flex-col items-center justify-center text-gray-500">
            <Loader2 className="h-8 w-8 animate-spin mb-4" />
            <p>Chargement des transactions...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="flex flex-col items-center justify-center text-red-500">
            <AlertCircle className="h-8 w-8 mb-4" />
            <p className="font-medium">Erreur de chargement</p>
            <p className="text-sm text-gray-500 mt-1">{error}</p>
            <button
              onClick={() => refresh()}
              className="mt-4 text-blue-600 hover:underline text-sm flex items-center gap-1"
            >
              <RefreshCw className="h-4 w-4" />
              Réessayer
            </button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-50">
                <Wallet className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total</p>
                <p className="text-lg font-semibold">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-50">
                <ArrowDownLeft className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Encaissements</p>
                <p className="text-lg font-semibold text-emerald-600">
                  {formatCurrency(stats.creditAmount)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-50">
                <ArrowUpRight className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Decaissements</p>
                <p className="text-lg font-semibold text-red-600">
                  {formatCurrency(stats.debitAmount)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-50">
                <Paperclip className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Justifies</p>
                <p className="text-lg font-semibold">
                  {stats.withAttachment} / {stats.total}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tableau des transactions */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-500" />
              Transactions bancaires
              {organisationName && (
                <span className="text-sm font-normal text-gray-500">
                  - {organisationName}
                </span>
              )}
            </CardTitle>
            <button
              onClick={() => refresh()}
              className="text-gray-500 hover:text-gray-700 p-1 rounded"
              title="Actualiser"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Wallet className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p>Aucune transaction liee a cette organisation</p>
              <p className="text-sm mt-1">
                Les transactions apparaitront ici une fois liees via la page
                Rapprochement
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 text-left">
                    <th className="pb-3 text-xs font-medium text-gray-500 uppercase">
                      Date
                    </th>
                    <th className="pb-3 text-xs font-medium text-gray-500 uppercase">
                      Libelle
                    </th>
                    <th className="pb-3 text-xs font-medium text-gray-500 uppercase text-right">
                      Montant
                    </th>
                    <th className="pb-3 text-xs font-medium text-gray-500 uppercase text-center">
                      Justificatif
                    </th>
                    <th className="pb-3 text-xs font-medium text-gray-500 uppercase">
                      Statut
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map(tx => (
                    <tr
                      key={tx.id}
                      className="border-b border-gray-100 hover:bg-gray-50"
                    >
                      <td className="py-3 text-sm text-gray-600">
                        {formatDate(tx.emitted_at)}
                      </td>
                      <td className="py-3">
                        <div className="max-w-xs">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {tx.label}
                          </p>
                          {tx.reference && (
                            <p className="text-xs text-gray-500 truncate">
                              Ref: {tx.reference}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="py-3 text-right">
                        <span
                          className={cn(
                            'text-sm font-semibold',
                            tx.side === 'credit'
                              ? 'text-emerald-600'
                              : 'text-red-600'
                          )}
                        >
                          {tx.side === 'credit' ? '+' : '-'}
                          {formatCurrency(Math.abs(tx.amount))}
                        </span>
                      </td>
                      <td className="py-3 text-center">
                        {tx.has_attachment ? (
                          <a
                            href={`/api/qonto/attachments/${tx.attachment_id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center p-1 text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 rounded"
                            title="Voir le justificatif"
                          >
                            <Paperclip className="h-4 w-4" />
                          </a>
                        ) : (
                          <span className="text-gray-300">-</span>
                        )}
                      </td>
                      <td className="py-3">
                        <Badge
                          variant={
                            tx.has_attachment
                              ? 'default'
                              : tx.matching_status === 'manual_matched'
                                ? 'secondary'
                                : 'outline'
                          }
                          className={cn(
                            tx.has_attachment &&
                              'bg-emerald-100 text-emerald-800 border-emerald-200'
                          )}
                        >
                          {tx.has_attachment
                            ? 'Justifie'
                            : tx.matching_status === 'manual_matched'
                              ? 'Rapproche'
                              : 'En attente'}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

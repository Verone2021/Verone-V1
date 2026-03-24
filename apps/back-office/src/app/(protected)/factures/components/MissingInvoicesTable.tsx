'use client';

import { Badge, Button } from '@verone/ui';
import { Money } from '@verone/ui-business';
import { AlertTriangle, CheckCircle, Paperclip, Upload } from 'lucide-react';
import type { TransactionMissingInvoice } from '@verone/finance';

interface MissingInvoicesTableProps {
  transactions: TransactionMissingInvoice[];
  loading: boolean;
  onUpload: (transaction: TransactionMissingInvoice) => void;
}

export function MissingInvoicesTable({
  transactions,
  loading,
  onUpload,
}: MissingInvoicesTableProps) {
  if (loading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="h-12 bg-muted animate-pulse rounded" />
        ))}
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500 opacity-70" />
        <p className="font-medium text-foreground">
          Toutes les transactions ont une facture!
        </p>
        <p className="text-sm mt-1">Aucune facture manquante a uploader</p>
      </div>
    );
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <table className="w-full">
        <thead className="bg-muted/50">
          <tr>
            <th className="text-left p-3 text-sm font-medium">Transaction</th>
            <th className="text-left p-3 text-sm font-medium">Contrepartie</th>
            <th className="text-left p-3 text-sm font-medium">Date</th>
            <th className="text-left p-3 text-sm font-medium">Commande</th>
            <th className="text-right p-3 text-sm font-medium">Montant</th>
            <th className="text-center p-3 text-sm font-medium">Statut</th>
            <th className="text-right p-3 text-sm font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map(tx => (
            <tr key={tx.id} className="border-t hover:bg-muted/30">
              <td className="p-3">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                  <span className="text-sm font-medium truncate max-w-[200px]">
                    {tx.label ?? 'Sans libelle'}
                  </span>
                </div>
              </td>
              <td className="p-3">
                <span className="text-sm">{tx.counterparty_name ?? '-'}</span>
              </td>
              <td className="p-3 text-sm">
                {tx.emitted_at
                  ? new Date(tx.emitted_at).toLocaleDateString('fr-FR')
                  : '-'}
              </td>
              <td className="p-3">
                {tx.order_number ? (
                  <Badge variant="outline">{tx.order_number}</Badge>
                ) : (
                  <span className="text-muted-foreground text-sm">-</span>
                )}
              </td>
              <td className="p-3 text-right">
                <Money
                  amount={Math.abs(tx.amount)}
                  size="sm"
                  className="text-green-600 font-medium"
                />
              </td>
              <td className="p-3 text-center">
                {tx.upload_status === 'pending' ? (
                  <Badge variant="secondary">En attente</Badge>
                ) : tx.upload_status === 'uploading' ? (
                  <Badge variant="secondary" className="animate-pulse">
                    Upload...
                  </Badge>
                ) : (
                  <Badge variant="destructive" className="gap-1">
                    <Paperclip className="h-3 w-3" />
                    Manquante
                  </Badge>
                )}
              </td>
              <td className="p-3 text-right">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onUpload(tx)}
                >
                  <Upload className="h-4 w-4 mr-1" />
                  Uploader
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

'use client';

import {
  useFinancialPayments,
  FinancialPaymentForm,
  type FinancialPayment,
} from '@verone/finance';
import {
  ButtonUnified,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Separator,
  Skeleton,
} from '@verone/ui';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@verone/ui';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { CreditCard } from 'lucide-react';

// =====================================================================
// TYPES
// =====================================================================

interface ExpensePaymentsProps {
  documentId: string;
  documentNumber: string;
  remainingAmount: number;
  isPaid: boolean;
  showPaymentForm: boolean;
  onTogglePaymentForm: (show: boolean) => void;
  onPaymentSuccess: () => void;
}

// =====================================================================
// COMPONENT
// =====================================================================

export function ExpensePayments({
  documentId,
  documentNumber,
  remainingAmount,
  isPaid,
  showPaymentForm,
  onTogglePaymentForm,
  onPaymentSuccess,
}: ExpensePaymentsProps) {
  const { payments, loading: paymentsLoading } =
    useFinancialPayments(documentId);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Historique des paiements ({payments.length})</CardTitle>
          {!isPaid && remainingAmount > 0 && !showPaymentForm && (
            <ButtonUnified
              variant="success"
              icon={CreditCard}
              iconPosition="left"
              onClick={() => onTogglePaymentForm(true)}
            >
              Enregistrer un paiement
            </ButtonUnified>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {showPaymentForm && (
          <>
            <FinancialPaymentForm
              documentId={documentId}
              documentNumber={documentNumber}
              remainingAmount={remainingAmount}
              onSuccess={onPaymentSuccess}
              onCancel={() => onTogglePaymentForm(false)}
            />
            <Separator className="my-6" />
          </>
        )}

        {paymentsLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : payments.length === 0 ? (
          <div className="text-center py-8">
            <CreditCard className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">
              Aucun paiement enregistré pour cette dépense
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Montant</TableHead>
                <TableHead>Méthode</TableHead>
                <TableHead>Référence</TableHead>
                <TableHead>Notes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(payments as FinancialPayment[]).map(payment => (
                <TableRow key={payment.id}>
                  <TableCell>
                    {format(new Date(payment.payment_date), 'dd MMM yyyy', {
                      locale: fr,
                    })}
                  </TableCell>
                  <TableCell className="font-medium text-green-600">
                    {payment.amount_paid.toFixed(2)} €
                  </TableCell>
                  <TableCell className="capitalize">
                    {payment.payment_method ?? '-'}
                  </TableCell>
                  <TableCell className="text-sm text-gray-500">
                    {payment.transaction_reference ?? '-'}
                  </TableCell>
                  <TableCell className="text-sm text-gray-500">
                    {payment.notes ?? '-'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

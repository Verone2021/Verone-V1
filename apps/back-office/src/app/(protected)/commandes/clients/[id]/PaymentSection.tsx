'use client';

import { useState } from 'react';

import Link from 'next/link';

import {
  InvoiceCreateFromOrderModal,
  type IOrderForInvoice,
} from '@verone/finance/components';
import { Badge, Button, Card } from '@verone/ui';
import { AlertCircle, CheckCircle, CreditCard, FileText } from 'lucide-react';

interface PaymentSectionProps {
  orderId: string;
  orderNumber: string;
  orderStatus: string;
  totalHt: number;
  totalTtc: number;
  taxRate: number;
  currency: string;
  paymentTerms: string;
  paymentStatus: string;
  customerName: string;
  customerEmail: string | null;
  customerType: 'organization' | 'individual';
  orderItems: Array<{
    id: string;
    quantity: number;
    unit_price_ht: number;
    tax_rate: number;
    products?: {
      name: string;
    } | null;
  }>;
}

export function PaymentSection({
  orderId,
  orderNumber,
  orderStatus,
  totalHt,
  totalTtc,
  taxRate,
  currency,
  paymentTerms,
  paymentStatus,
  customerName,
  customerEmail,
  customerType,
  orderItems,
}: PaymentSectionProps): React.ReactNode {
  // On ne peut creer une facture que si la commande est validee
  const canCreateInvoice = orderStatus === 'validated';
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);

  // Preparer l'objet commande pour le modal de creation de facture
  const orderForInvoice: IOrderForInvoice = {
    id: orderId,
    order_number: orderNumber,
    total_ht: totalHt,
    total_ttc: totalTtc,
    tax_rate: taxRate,
    currency: currency,
    payment_terms: paymentTerms,
    organisations:
      customerType === 'organization'
        ? { name: customerName, email: customerEmail }
        : null,
    individual_customers:
      customerType === 'individual'
        ? {
            first_name: customerName.split(' ')[0] ?? '',
            last_name: customerName.split(' ').slice(1).join(' ') ?? '',
            email: customerEmail,
          }
        : null,
    sales_order_items: orderItems,
  };

  const handleInvoiceCreated = (invoiceId: string): void => {
    console.warn('[PaymentSection] Invoice created:', invoiceId);
    // On pourrait recharger la page ou afficher un message de succes
  };

  return (
    <>
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <CreditCard className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-xl font-semibold">Paiement</h2>
        </div>

        <div className="space-y-3">
          {/* Statut paiement */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Statut</span>
            {paymentStatus === 'paid' ? (
              <Badge
                variant="default"
                className="bg-green-100 text-green-800 border-green-200"
              >
                <CheckCircle className="h-3 w-3 mr-1" />
                Paye
              </Badge>
            ) : paymentStatus === 'partial' ? (
              <Badge
                variant="secondary"
                className="bg-yellow-100 text-yellow-800 border-yellow-200"
              >
                <AlertCircle className="h-3 w-3 mr-1" />
                Partiel
              </Badge>
            ) : (
              <Badge
                variant="outline"
                className="bg-red-50 text-red-700 border-red-200"
              >
                <AlertCircle className="h-3 w-3 mr-1" />
                Non paye
              </Badge>
            )}
          </div>

          {/* Montant TTC */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Montant</span>
            <span className="font-medium">{totalTtc?.toFixed(2)} EUR</span>
          </div>

          {/* Boutons d'action */}
          <div className="pt-2 space-y-2">
            {/* Bouton Creer facture - uniquement si commande validee */}
            {canCreateInvoice ? (
              <Button
                variant="default"
                className="w-full"
                onClick={() => setShowInvoiceModal(true)}
              >
                <FileText className="h-4 w-4 mr-2" />
                Creer une facture
              </Button>
            ) : (
              <p className="text-xs text-muted-foreground text-center">
                La commande doit etre validee pour creer une facture
              </p>
            )}

            {/* Bouton Associer un paiement */}
            {paymentStatus !== 'paid' && (
              <Link
                href={`/finance/rapprochement?orderId=${orderId}&amount=${totalTtc}`}
              >
                <Button variant="outline" className="w-full">
                  <CreditCard className="h-4 w-4 mr-2" />
                  Associer un paiement
                </Button>
              </Link>
            )}
          </div>
        </div>
      </Card>

      {/* Modal creation facture */}
      <InvoiceCreateFromOrderModal
        order={orderForInvoice}
        open={showInvoiceModal}
        onOpenChange={setShowInvoiceModal}
        onSuccess={handleInvoiceCreated}
      />
    </>
  );
}

'use client';

import { useState } from 'react';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

import {
  InvoiceCreateFromOrderModal,
  InvoiceCreateServiceModal,
  OrderSelectModal,
} from '@verone/finance';
import type { IOrderForDocument } from '@verone/finance';
import { Button, Card, CardContent, CardHeader, CardTitle } from '@verone/ui';
import { ArrowLeft, Briefcase, ShoppingBag } from 'lucide-react';

export default function NouvelleFacturePage() {
  const router = useRouter();

  const [showOrderSelect, setShowOrderSelect] = useState(false);
  const [showInvoiceFromOrder, setShowInvoiceFromOrder] = useState(false);
  const [showServiceInvoice, setShowServiceInvoice] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<IOrderForDocument | null>(
    null
  );

  const handleOrderSelected = (order: IOrderForDocument) => {
    setSelectedOrder(order);
    setShowOrderSelect(false);
    setShowInvoiceFromOrder(true);
  };

  const handleInvoiceCreated = () => {
    router.push('/factures');
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      {/* Header with back button */}
      <div className="flex items-center gap-3">
        <Link href="/factures">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Nouvelle facture</h1>
          <p className="text-sm text-gray-500">
            Choisissez comment creer votre facture
          </p>
        </div>
      </div>

      {/* Two options */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Option 1: From existing order */}
        <Card
          className="cursor-pointer transition-shadow hover:shadow-md hover:border-blue-300"
          onClick={() => setShowOrderSelect(true)}
        >
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50">
                <ShoppingBag className="h-5 w-5 text-blue-600" />
              </div>
              <CardTitle className="text-base">Depuis une commande</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500">
              Selectionnez une commande existante. La facture sera pre-remplie
              avec les produits, les prix et le client de la commande.
            </p>
          </CardContent>
        </Card>

        {/* Option 2: Service invoice */}
        <Card
          className="cursor-pointer transition-shadow hover:shadow-md hover:border-amber-300"
          onClick={() => setShowServiceInvoice(true)}
        >
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50">
                <Briefcase className="h-5 w-5 text-amber-600" />
              </div>
              <CardTitle className="text-base">Facture de service</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500">
              Creez une facture avec des libelles libres. Ajoutez manuellement
              les lignes, les prix et le client.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Modals — all from @verone/finance, zero new component */}
      <OrderSelectModal
        open={showOrderSelect}
        onOpenChange={setShowOrderSelect}
        onSelectOrder={handleOrderSelected}
      />

      <InvoiceCreateFromOrderModal
        order={selectedOrder}
        open={showInvoiceFromOrder}
        onOpenChange={setShowInvoiceFromOrder}
        onSuccess={handleInvoiceCreated}
      />

      <InvoiceCreateServiceModal
        open={showServiceInvoice}
        onOpenChange={setShowServiceInvoice}
        onSuccess={handleInvoiceCreated}
      />
    </div>
  );
}

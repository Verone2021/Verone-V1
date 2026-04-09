'use client';

import { useState } from 'react';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

import {
  OrderSelectModal,
  QuoteCreateFromOrderModal,
  QuoteFormModal,
} from '@verone/finance';
import type { IOrderForDocument } from '@verone/finance';
import { Button, Card, CardContent, CardHeader, CardTitle } from '@verone/ui';
import { ArrowLeft, FileText, ShoppingBag } from 'lucide-react';

export default function NouveauDevisPage() {
  const router = useRouter();

  const [showOrderSelect, setShowOrderSelect] = useState(false);
  const [showQuoteFromOrder, setShowQuoteFromOrder] = useState(false);
  const [showQuoteFromScratch, setShowQuoteFromScratch] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<IOrderForDocument | null>(
    null
  );

  const handleOrderSelected = (order: IOrderForDocument) => {
    setSelectedOrder(order);
    setShowOrderSelect(false);
    setShowQuoteFromOrder(true);
  };

  const handleQuoteFromOrderSuccess = (quoteId: string) => {
    router.push(`/factures/devis/${quoteId}`);
  };

  const handleQuoteFromScratchSuccess = () => {
    router.push('/factures?tab=devis');
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      {/* Header with back button */}
      <div className="flex items-center gap-3">
        <Link href="/ventes">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Nouveau devis</h1>
          <p className="text-sm text-gray-500">
            Choisissez comment creer votre devis
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
              Selectionnez une commande existante. Le devis sera pre-rempli avec
              les produits, les prix et le client de la commande.
            </p>
          </CardContent>
        </Card>

        {/* Option 2: From scratch */}
        <Card
          className="cursor-pointer transition-shadow hover:shadow-md hover:border-green-300"
          onClick={() => setShowQuoteFromScratch(true)}
        >
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-50">
                <FileText className="h-5 w-5 text-green-600" />
              </div>
              <CardTitle className="text-base">Devis vierge</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500">
              Creez un devis de zero. Ajoutez manuellement les produits, les
              lignes de service et le client.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Existing link to list */}
      <div className="text-center pt-4">
        <Link
          href="/factures?tab=devis"
          className="text-sm text-gray-500 hover:text-gray-900"
        >
          Voir tous les devis existants
        </Link>
      </div>

      {/* Modals — all from @verone/finance, zero new component */}
      <OrderSelectModal
        open={showOrderSelect}
        onOpenChange={setShowOrderSelect}
        onSelectOrder={handleOrderSelected}
        statuses={['draft', 'validated']}
      />

      <QuoteCreateFromOrderModal
        order={selectedOrder}
        open={showQuoteFromOrder}
        onOpenChange={setShowQuoteFromOrder}
        onSuccess={handleQuoteFromOrderSuccess}
      />

      <QuoteFormModal
        open={showQuoteFromScratch}
        onOpenChange={setShowQuoteFromScratch}
        onSuccess={handleQuoteFromScratchSuccess}
      />
    </div>
  );
}

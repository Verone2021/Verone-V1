'use client';

import { useState } from 'react';
import {
  ProductSelector,
  SelectedProduct,
} from '@/shared/modules/products/components/selectors';
import { ButtonV2 } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function DemoUniversalSelectorPage() {
  const [showModal, setShowModal] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState<SelectedProduct[]>(
    []
  );
  const [context, setContext] = useState<
    'collections' | 'orders' | 'consultations'
  >('collections');

  const handleSelect = (products: SelectedProduct[]) => {
    setSelectedProducts(products);
    console.log('Produits sélectionnés:', products);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Démonstration - Universal Product Selector</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-600">
              Testez le nouveau composant universel avec différents contextes.
            </p>

            {/* Sélection contexte */}
            <div className="flex gap-2">
              <ButtonV2
                variant={context === 'collections' ? 'primary' : 'outline'}
                onClick={() => setContext('collections')}
              >
                Collections (Simple)
              </ButtonV2>
              <ButtonV2
                variant={context === 'consultations' ? 'primary' : 'outline'}
                onClick={() => setContext('consultations')}
              >
                Consultations (+ Quantité)
              </ButtonV2>
              <ButtonV2
                variant={context === 'orders' ? 'primary' : 'outline'}
                onClick={() => setContext('orders')}
              >
                Commandes (Complexe)
              </ButtonV2>
            </div>

            <ButtonV2
              onClick={() => setShowModal(true)}
              size="lg"
              className="w-full"
            >
              Ouvrir le sélecteur ({context})
            </ButtonV2>

            {selectedProducts.length > 0 && (
              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h3 className="font-semibold mb-2">
                  Produits sélectionnés ({selectedProducts.length}):
                </h3>
                <ul className="space-y-2">
                  {selectedProducts.map(product => (
                    <li key={product.id} className="text-sm">
                      • {product.name} ({product.sku})
                      {product.quantity && ` - Quantité: ${product.quantity}`}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Modal universel V2 avec layout 2 colonnes */}
      <ProductSelector
        open={showModal}
        onClose={() => setShowModal(false)}
        onSelect={handleSelect}
        mode="multi"
        context={context}
        selectedProducts={selectedProducts}
        showQuantity={context === 'consultations' || context === 'orders'}
        showImages={true}
      />
    </div>
  );
}

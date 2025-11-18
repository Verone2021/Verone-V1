/**
 * Page: Créer Ajustement Stock
 * Route: /stocks/ajustements/create
 * Description: Page création ajustement inventaire (augmentation/diminution/correction)
 */

'use client';

import { useRouter } from 'next/navigation';

import { ButtonV2 } from '@verone/ui';
import { ArrowLeft } from 'lucide-react';

import { StockAdjustmentForm } from '@/components/forms/stock-adjustment-form';

export default function CreateStockAdjustmentPage() {
  const router = useRouter();

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <ButtonV2
          variant="ghost"
          size="sm"
          onClick={() => router.push('/stocks/ajustements')}
        >
          <ArrowLeft className="h-4 w-4" />
        </ButtonV2>

        <div>
          <h1 className="text-3xl font-bold">Nouvel Ajustement Stock</h1>
          <p className="text-gray-500 mt-1">
            Créer un ajustement d'inventaire (augmentation, diminution ou
            correction)
          </p>
        </div>
      </div>

      {/* Formulaire */}
      <StockAdjustmentForm />
    </div>
  );
}

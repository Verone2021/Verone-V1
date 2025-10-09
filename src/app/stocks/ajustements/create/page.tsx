/**
 * Page: Créer Ajustement Stock
 * Route: /stocks/ajustements/create
 * Description: Page création ajustement inventaire (augmentation/diminution/correction)
 */

'use client'

import { StockAdjustmentForm } from '@/components/forms/stock-adjustment-form'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function CreateStockAdjustmentPage() {
  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/stocks/ajustements">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>

        <div>
          <h1 className="text-3xl font-bold">Nouvel Ajustement Stock</h1>
          <p className="text-gray-500 mt-1">
            Créer un ajustement d'inventaire (augmentation, diminution ou correction)
          </p>
        </div>
      </div>

      {/* Formulaire */}
      <StockAdjustmentForm />
    </div>
  )
}

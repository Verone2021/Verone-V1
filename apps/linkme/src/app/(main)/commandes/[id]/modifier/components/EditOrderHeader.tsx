'use client';

import { useRouter } from 'next/navigation';

import { Badge } from '@verone/ui';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { ArrowLeft } from 'lucide-react';

import type { FullOrderData } from '../page';

// ============================================================================
// TYPES
// ============================================================================

interface EditOrderHeaderProps {
  order: FullOrderData['order'];
}

// ============================================================================
// COMPONENT
// ============================================================================

export function EditOrderHeader({ order }: EditOrderHeaderProps) {
  const router = useRouter();

  return (
    <div className="bg-white border-b px-6 py-4 sticky top-0 z-10">
      <div className="flex items-center justify-between max-w-4xl mx-auto">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => router.push('/commandes')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-semibold text-[#183559]">
                Modifier {order.linkme_display_number ?? order.order_number}
              </h1>
              <Badge
                variant="outline"
                className="bg-amber-100 text-amber-800 border-amber-200"
              >
                Brouillon
              </Badge>
            </div>
            <p className="text-sm text-gray-500 mt-0.5">
              Client:{' '}
              {order.customer?.trade_name ??
                order.customer?.legal_name ??
                'Inconnu'}{' '}
              | Cree le{' '}
              {format(new Date(order.created_at), 'dd MMMM yyyy', {
                locale: fr,
              })}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

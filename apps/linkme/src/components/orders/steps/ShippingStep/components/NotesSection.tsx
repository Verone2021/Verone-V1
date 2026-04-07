'use client';

import { Card, Textarea } from '@verone/ui';
import { MessageSquare } from 'lucide-react';

import type { DeliveryStepData } from '../../../schemas/order-form.schema';

interface NotesSectionProps {
  delivery: DeliveryStepData;
  onDeliveryChange: (field: keyof DeliveryStepData, value: unknown) => void;
}

export function NotesSection({
  delivery,
  onDeliveryChange,
}: NotesSectionProps) {
  return (
    <Card className="p-5">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
          <MessageSquare className="h-5 w-5 text-gray-600" />
        </div>
        <div>
          <h3 className="font-semibold text-gray-900">Notes complementaires</h3>
          <p className="text-sm text-gray-500">
            Instructions particulieres pour la livraison
          </p>
        </div>
      </div>

      <Textarea
        id="notes"
        value={delivery.notes ?? ''}
        onChange={e => onDeliveryChange('notes', e.target.value)}
        placeholder="Ex: Livraison par l'entree de service, interphone code 1234..."
        rows={4}
      />
    </Card>
  );
}

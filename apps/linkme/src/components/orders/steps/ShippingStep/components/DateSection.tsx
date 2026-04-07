'use client';

import { Card, Checkbox, Label, Input, cn } from '@verone/ui';
import { Calendar, Check } from 'lucide-react';

import type { DeliveryStepData } from '../../../schemas/order-form.schema';

interface DateSectionProps {
  delivery: DeliveryStepData;
  onUpdateDelivery: (data: Partial<DeliveryStepData>) => void;
  onDateChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export function DateSection({
  delivery,
  onUpdateDelivery,
  onDateChange,
}: DateSectionProps) {
  return (
    <Card className="p-5">
      <div className="flex items-center gap-3 mb-4">
        <div
          className={cn(
            'w-10 h-10 rounded-full flex items-center justify-center',
            delivery.desiredDate || delivery.deliveryAsap
              ? 'bg-green-100 text-green-600'
              : 'bg-blue-100 text-blue-600'
          )}
        >
          {delivery.desiredDate || delivery.deliveryAsap ? (
            <Check className="h-5 w-5" />
          ) : (
            <Calendar className="h-5 w-5" />
          )}
        </div>
        <div>
          <h3 className="font-semibold text-gray-900">
            Date de livraison souhaitee <span className="text-red-500">*</span>
          </h3>
          <p className="text-sm text-gray-500">Sous reserve de disponibilite</p>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <Checkbox
            id="deliveryAsap"
            checked={delivery.deliveryAsap}
            onCheckedChange={(checked: boolean) => {
              onUpdateDelivery({
                deliveryAsap: checked,
                desiredDate: checked ? null : delivery.desiredDate,
              });
            }}
          />
          <Label
            htmlFor="deliveryAsap"
            className="text-sm font-medium cursor-pointer"
          >
            Des que possible
          </Label>
        </div>

        {!delivery.deliveryAsap && (
          <>
            <Input
              id="desiredDate"
              type="date"
              value={delivery.desiredDate ?? ''}
              onChange={onDateChange}
              min={new Date().toISOString().split('T')[0]}
            />
            {!delivery.desiredDate && (
              <p className="text-xs text-amber-600">
                Veuillez indiquer une date de livraison souhaitee ou cocher
                &quot;Des que possible&quot;.
              </p>
            )}
          </>
        )}
        <p className="text-xs text-gray-500">
          La date finale sera confirmee par notre equipe apres validation de la
          commande.
        </p>
      </div>
    </Card>
  );
}

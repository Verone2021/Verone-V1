'use client';

import { Card, Checkbox, Label } from '@verone/ui';
import { User, Check, Package } from 'lucide-react';

import type {
  ContactBase,
  OrderFormData,
} from '../../../schemas/order-form.schema';
import { defaultContact } from '../../../schemas/order-form.schema';
import { ContactForm } from './ContactForm';

interface DeliveryContactSectionProps {
  formData: OrderFormData;
  onSameAsResponsable: (checked: boolean) => void;
  onContactChange: (field: keyof ContactBase, value: string) => void;
}

export function DeliveryContactSection({
  formData,
  onSameAsResponsable,
  onContactChange,
}: DeliveryContactSectionProps) {
  return (
    <Card className="p-5">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
          <User className="h-5 w-5 text-purple-600" />
        </div>
        <div>
          <h3 className="font-semibold text-gray-900">
            Contact Livraison / Reception
          </h3>
          <p className="text-sm text-gray-500">
            Personne SUR PLACE qui receptionnera la livraison
          </p>
        </div>
      </div>

      <Card className="p-4">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Checkbox
              id="delivery-same-as-responsable"
              checked={formData.contacts.delivery.sameAsResponsable}
              onCheckedChange={(checked: boolean) =>
                onSameAsResponsable(checked)
              }
            />
            <Label
              htmlFor="delivery-same-as-responsable"
              className="text-sm font-medium cursor-pointer"
            >
              Meme contact que le responsable de commande
            </Label>
          </div>

          {formData.contacts.delivery.sameAsResponsable && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-start gap-2">
                <Check className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-green-700">
                  <p className="font-medium">
                    Contact identique au responsable commande
                  </p>
                  {formData.contacts.responsable.firstName && (
                    <p className="mt-1">
                      {formData.contacts.responsable.firstName}{' '}
                      {formData.contacts.responsable.lastName} -{' '}
                      {formData.contacts.responsable.email}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {!formData.contacts.delivery.sameAsResponsable && (
            <div className="pt-2">
              <div className="flex items-center gap-2 pb-3 border-b mb-4">
                <Package className="h-4 w-4 text-gray-500" />
                <h5 className="text-sm font-medium text-gray-700">
                  Contact livraison
                </h5>
              </div>
              <ContactForm
                contact={formData.contacts.delivery.contact ?? defaultContact}
                onChange={onContactChange}
              />
            </div>
          )}
        </div>
      </Card>
    </Card>
  );
}

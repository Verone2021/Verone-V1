'use client';

import { Card, Label, Input, Switch } from '@verone/ui';
import {
  Truck,
  Building2,
  FileUp,
  AlertCircle,
  AlertTriangle,
} from 'lucide-react';

import type { DeliveryStepData } from '../../../schemas/order-form.schema';

interface DeliveryOptionsSectionProps {
  delivery: DeliveryStepData;
  onDeliveryChange: (field: keyof DeliveryStepData, value: unknown) => void;
}

export function DeliveryOptionsSection({
  delivery,
  onDeliveryChange,
}: DeliveryOptionsSectionProps) {
  return (
    <Card className="p-5">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
          <Truck className="h-5 w-5 text-amber-600" />
        </div>
        <div>
          <h3 className="font-semibold text-gray-900">Options de livraison</h3>
          <p className="text-sm text-gray-500">
            Informations complementaires pour faciliter la livraison
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Centre commercial */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Building2 className="h-5 w-5 text-gray-400" />
              <div>
                <Label htmlFor="isMallDelivery" className="cursor-pointer">
                  Livraison en centre commercial
                </Label>
                <p className="text-xs text-gray-500">
                  Necessite une coordination avec le centre
                </p>
              </div>
            </div>
            <Switch
              id="isMallDelivery"
              checked={delivery.isMallDelivery}
              onCheckedChange={checked =>
                onDeliveryChange('isMallDelivery', checked)
              }
            />
          </div>

          {delivery.isMallDelivery && (
            <div className="ml-8 p-4 bg-amber-50 border border-amber-200 rounded-lg space-y-4">
              <div className="space-y-2">
                <Label htmlFor="mallEmail">
                  Email du centre commercial{' '}
                  <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="mallEmail"
                  type="email"
                  value={delivery.mallEmail ?? ''}
                  onChange={e => onDeliveryChange('mallEmail', e.target.value)}
                  placeholder="livraison@centre-commercial.fr"
                />
                <p className="text-xs text-amber-700">
                  Nous contacterons le centre pour organiser la livraison.
                </p>
              </div>

              <div className="pt-3 border-t border-amber-200">
                <div className="flex items-center gap-3 mb-3">
                  <FileUp className="h-5 w-5 text-amber-600" />
                  <div>
                    <Label>Formulaire d&apos;acces (optionnel)</Label>
                    <p className="text-xs text-amber-700">
                      Telechargez le formulaire d&apos;acces du centre si
                      disponible (PDF, max 5Mo)
                    </p>
                  </div>
                </div>
                <input
                  type="file"
                  accept=".pdf"
                  onChange={e => {
                    const file = e.target.files?.[0];
                    if (file) {
                      if (file.size > 5 * 1024 * 1024) {
                        alert('Le fichier est trop volumineux (max 5Mo)');
                        return;
                      }
                      onDeliveryChange('accessFormFile', file);
                    }
                  }}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-amber-100 file:text-amber-700 hover:file:bg-amber-200 cursor-pointer"
                />
                {delivery.accessFormFile && (
                  <p className="mt-2 text-sm text-green-600">
                    Fichier selectionne :{' '}
                    {(delivery.accessFormFile as File).name}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Semi-remorque */}
        <div className="pt-4 border-t">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Truck className="h-5 w-5 text-gray-400" />
              <div>
                <Label
                  htmlFor="semiTrailerAccessible"
                  className="cursor-pointer"
                >
                  Acces semi-remorque possible
                </Label>
                <p className="text-xs text-gray-500">
                  Le site permet l&apos;acces aux grands vehicules
                </p>
              </div>
            </div>
            <Switch
              id="semiTrailerAccessible"
              checked={delivery.semiTrailerAccessible}
              onCheckedChange={checked =>
                onDeliveryChange('semiTrailerAccessible', checked)
              }
            />
          </div>

          {delivery.semiTrailerAccessible ? (
            <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-blue-700">
                  Une verification sera effectuee. Si l&apos;acces semi-remorque
                  n&apos;est pas reellement possible, le prix de livraison du
                  devis pourra etre revise.
                </p>
              </div>
            </div>
          ) : (
            <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                <div className="text-xs text-amber-700">
                  <p className="font-semibold">Surcouts de livraison</p>
                  <p className="mt-1">
                    Sans acces semi-remorque, la livraison necessite un
                    transbordement (semi → entrepot → petit vehicule), ce qui
                    engendre des frais supplementaires.
                  </p>
                  <p className="mt-2 font-medium">
                    Plus vous anticipez, plus nous pouvons optimiser les couts.
                    Un changement de derniere minute entraine des surcouts
                    significatifs.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

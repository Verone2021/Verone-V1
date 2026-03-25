import {
  AddressAutocomplete,
  Card,
  CardContent,
  Checkbox,
  RadioGroup,
  RadioGroupItem,
  Label,
  Separator,
  Input,
  Textarea,
} from '@verone/ui';
import { CheckCircle } from 'lucide-react';
import { createClient } from '@verone/utils/supabase/client';
import { toast } from 'sonner';

import type { StepProps } from './types';

export function OpeningStep5Delivery({ data, errors, updateData }: StepProps) {
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Upload vers Supabase Storage
    const supabase = createClient();
    const fileName = `${Date.now()}_${file.name}`;

    const { data: _uploadData, error } = await supabase.storage
      .from('linkme-delivery-forms')
      .upload(fileName, file);

    if (error) {
      toast.error("Erreur lors de l'upload du fichier");
      return;
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from('linkme-delivery-forms').getPublicUrl(fileName);

    updateData({
      delivery: { ...data.delivery, accessFormUrl: publicUrl },
    });

    toast.success('Fichier uploadé avec succès');
  };

  return (
    <div className="space-y-6 max-w-lg">
      <div>
        <h3 className="text-lg font-medium">Livraison</h3>
        <p className="text-sm text-gray-500 mt-1">
          Adresse et modalités de livraison
        </p>
      </div>

      {/* Contact livraison */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Checkbox
              id="useResponsableContact"
              checked={data.delivery.useResponsableContact}
              onCheckedChange={checked =>
                updateData({
                  delivery: {
                    ...data.delivery,
                    useResponsableContact: !!checked,
                  },
                })
              }
            />
            <div className="flex-1">
              <Label
                htmlFor="useResponsableContact"
                className="cursor-pointer font-medium"
              >
                Le contact de livraison est le responsable du restaurant
              </Label>
              <p className="text-xs text-gray-500 mt-1">
                Les coordonnées du responsable seront utilisées pour la
                livraison
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Si décoché : formulaire contact */}
      {!data.delivery.useResponsableContact && (
        <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
          <div>
            <Label htmlFor="deliveryContactName">
              Nom complet <span className="text-red-500">*</span>
            </Label>
            <Input
              id="deliveryContactName"
              value={data.delivery.contactName}
              onChange={e =>
                updateData({
                  delivery: { ...data.delivery, contactName: e.target.value },
                })
              }
              placeholder="Paul Leclerc"
            />
            {errors['delivery.contactName'] && (
              <p className="text-sm text-red-600 mt-1">
                {errors['delivery.contactName']}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="deliveryContactEmail">
              Email <span className="text-red-500">*</span>
            </Label>
            <Input
              id="deliveryContactEmail"
              type="email"
              value={data.delivery.contactEmail}
              onChange={e =>
                updateData({
                  delivery: {
                    ...data.delivery,
                    contactEmail: e.target.value,
                  },
                })
              }
              placeholder="paul.leclerc@restaurant.fr"
            />
            {errors['delivery.contactEmail'] && (
              <p className="text-sm text-red-600 mt-1">
                {errors['delivery.contactEmail']}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="deliveryContactPhone">
              Téléphone <span className="text-red-500">*</span>
            </Label>
            <Input
              id="deliveryContactPhone"
              type="tel"
              value={data.delivery.contactPhone}
              onChange={e =>
                updateData({
                  delivery: {
                    ...data.delivery,
                    contactPhone: e.target.value,
                  },
                })
              }
              placeholder="06 98 76 54 32"
            />
            {errors['delivery.contactPhone'] && (
              <p className="text-sm text-red-600 mt-1">
                {errors['delivery.contactPhone']}
              </p>
            )}
          </div>
        </div>
      )}

      <Separator />

      {/* Adresse livraison */}
      <div>
        <Label>
          Adresse de livraison <span className="text-red-500">*</span>
        </Label>
        <AddressAutocomplete
          value={
            data.delivery.address
              ? `${data.delivery.address}, ${data.delivery.postalCode} ${data.delivery.city}`
              : ''
          }
          onSelect={address =>
            updateData({
              delivery: {
                ...data.delivery,
                address: address.streetAddress,
                postalCode: address.postalCode,
                city: address.city,
                latitude: address.latitude,
                longitude: address.longitude,
              },
            })
          }
          placeholder="123 Rue de Rivoli, 75001 Paris"
        />
        {errors['delivery.address'] && (
          <p className="text-sm text-red-600 mt-1">
            {errors['delivery.address']}
          </p>
        )}
      </div>

      {/* Date livraison */}
      <div>
        <Label htmlFor="deliveryDate">
          Date de livraison souhaitée <span className="text-red-500">*</span>
        </Label>

        {/* Checkbox dès que possible */}
        <div className="flex items-center gap-3 my-2">
          <Checkbox
            id="deliveryAsap"
            checked={data.delivery.deliveryAsap}
            onCheckedChange={(checked: boolean) =>
              updateData({
                delivery: {
                  ...data.delivery,
                  deliveryAsap: checked,
                  deliveryDate: checked ? '' : data.delivery.deliveryDate,
                },
              })
            }
          />
          <Label
            htmlFor="deliveryAsap"
            className="text-sm font-medium cursor-pointer"
          >
            Dès que possible
          </Label>
        </div>

        {/* Champ date (masqué si "dès que possible" coché) */}
        {!data.delivery.deliveryAsap && (
          <Input
            id="deliveryDate"
            type="date"
            value={data.delivery.deliveryDate}
            onChange={e =>
              updateData({
                delivery: { ...data.delivery, deliveryDate: e.target.value },
              })
            }
            min={new Date().toISOString().split('T')[0]}
          />
        )}
        {errors['delivery.deliveryDate'] && (
          <p className="text-sm text-red-600 mt-1">
            {errors['delivery.deliveryDate']}
          </p>
        )}
      </div>

      <Separator />

      {/* Centre commercial */}
      <div>
        <Label>Livraison dans un centre commercial ?</Label>
        <RadioGroup
          value={data.delivery.isMallDelivery ? 'yes' : 'no'}
          onValueChange={value =>
            updateData({
              delivery: { ...data.delivery, isMallDelivery: value === 'yes' },
            })
          }
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="yes" id="mall-yes" />
            <Label htmlFor="mall-yes" className="cursor-pointer font-normal">
              Oui
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="no" id="mall-no" />
            <Label htmlFor="mall-no" className="cursor-pointer font-normal">
              Non
            </Label>
          </div>
        </RadioGroup>
      </div>

      {/* Si centre commercial */}
      {data.delivery.isMallDelivery && (
        <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
          <div>
            <Label htmlFor="mallEmail">
              Email du centre commercial <span className="text-red-500">*</span>
            </Label>
            <Input
              id="mallEmail"
              type="email"
              value={data.delivery.mallEmail}
              onChange={e =>
                updateData({
                  delivery: { ...data.delivery, mallEmail: e.target.value },
                })
              }
              placeholder="accueil@centrecommercial.fr"
            />
            {errors['delivery.mallEmail'] && (
              <p className="text-sm text-red-600 mt-1">
                {errors['delivery.mallEmail']}
              </p>
            )}
          </div>

          <div>
            <Label>Formulaire d'accès requis ?</Label>
            <RadioGroup
              value={data.delivery.accessFormRequired ? 'yes' : 'no'}
              onValueChange={value =>
                updateData({
                  delivery: {
                    ...data.delivery,
                    accessFormRequired: value === 'yes',
                  },
                })
              }
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="yes" id="form-yes" />
                <Label
                  htmlFor="form-yes"
                  className="cursor-pointer font-normal"
                >
                  Oui
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="no" id="form-no" />
                <Label htmlFor="form-no" className="cursor-pointer font-normal">
                  Non
                </Label>
              </div>
            </RadioGroup>
          </div>

          {data.delivery.accessFormRequired && (
            <div>
              <Label htmlFor="accessFormUpload">
                Télécharger le formulaire d'accès
              </Label>
              <Input
                id="accessFormUpload"
                type="file"
                accept=".pdf,.png,.jpg,.jpeg"
                onChange={e => {
                  void handleFileUpload(e).catch(error => {
                    console.error('[OrderForm] File upload failed:', error);
                  });
                }}
              />
              <p className="text-xs text-gray-500 mt-1">
                Formats acceptés : PDF, PNG, JPG (max 5 MB)
              </p>
              {data.delivery.accessFormUrl && (
                <div className="mt-2 flex items-center gap-2 text-sm text-green-600">
                  <CheckCircle className="h-4 w-4" />
                  <span>Fichier uploadé avec succès</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <Separator />

      {/* Semi-remorque */}
      <div>
        <Label>Accessible par semi-remorque ?</Label>
        <RadioGroup
          value={data.delivery.semiTrailerAccessible ? 'yes' : 'no'}
          onValueChange={value =>
            updateData({
              delivery: {
                ...data.delivery,
                semiTrailerAccessible: value === 'yes',
              },
            })
          }
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="yes" id="semi-yes" />
            <Label htmlFor="semi-yes" className="cursor-pointer font-normal">
              Oui (par défaut)
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="no" id="semi-no" />
            <Label htmlFor="semi-no" className="cursor-pointer font-normal">
              Non
            </Label>
          </div>
        </RadioGroup>
      </div>

      {/* Notes livraison */}
      <div>
        <Label htmlFor="deliveryNotes">Notes livraison (optionnel)</Label>
        <Textarea
          id="deliveryNotes"
          value={data.delivery.notes}
          onChange={e =>
            updateData({
              delivery: { ...data.delivery, notes: e.target.value },
            })
          }
          placeholder="Instructions spéciales pour la livraison..."
          rows={4}
        />
      </div>
    </div>
  );
}

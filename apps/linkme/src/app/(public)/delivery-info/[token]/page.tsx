'use client';

import { useParams } from 'next/navigation';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Badge,
  Separator,
  Skeleton,
} from '@verone/ui';
import { formatCurrency } from '@verone/utils';
import {
  CheckCircle2,
  AlertCircle,
  Truck,
  FileText,
  Building2,
  Package,
} from 'lucide-react';

import { DeliveryInfoForm } from './DeliveryInfoForm';
import { useDeliveryInfoPage } from './use-delivery-info-page';

export default function DeliveryInfoPage() {
  const params = useParams();
  const token = params.token as string;

  const {
    validation,
    isLoading,
    isSubmitting,
    submitSuccess,
    submitError,
    form,
    setForm,
    handleSubmit,
  } = useDeliveryInfoPage(token);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl">
          <CardHeader>
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-48 mt-2" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!validation?.valid && !validation?.alreadyCompleted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <div className="mx-auto mb-4">
              <AlertCircle className="h-16 w-16 text-red-500" />
            </div>
            <CardTitle className="text-red-700">
              {validation?.expired ? 'Lien expiré' : 'Lien invalide'}
            </CardTitle>
            <CardDescription>
              {validation?.error ??
                "Ce lien n'est plus valide. Veuillez contacter le support."}
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (validation?.alreadyCompleted && validation.order) {
    const d = validation.order.linkmeDetails;
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4">
              <CheckCircle2 className="h-16 w-16 text-green-500" />
            </div>
            <CardTitle className="text-green-700">
              Informations déjà soumises
            </CardTitle>
            <CardDescription>
              Les informations de livraison pour la commande{' '}
              <strong>{validation.order.order_number}</strong> ont déjà été
              complétées.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-50 p-4 rounded-lg space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Contact réception</span>
                <span className="font-medium">{d.reception_contact_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Email</span>
                <span>{d.reception_contact_email}</span>
              </div>
              {d.confirmed_delivery_date && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Date confirmée</span>
                  <span>
                    {new Date(d.confirmed_delivery_date).toLocaleDateString(
                      'fr-FR'
                    )}
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (submitSuccess) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl text-center">
          <CardHeader>
            <div className="mx-auto mb-4">
              <CheckCircle2 className="h-16 w-16 text-green-500" />
            </div>
            <CardTitle className="text-green-700">
              Informations enregistrées
            </CardTitle>
            <CardDescription>
              Merci ! Vos informations de livraison ont été transmises à notre
              équipe.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
              <p className="text-green-800">
                Vous recevrez une confirmation par email à{' '}
                <strong>{form.receptionEmail}</strong>.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const order = validation.order!;

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">
            Informations de livraison
          </h1>
          <p className="text-gray-600 mt-1">Commande {order.order_number}</p>
        </div>

        {/* Order summary */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5 text-orange-600" />
              <CardTitle className="text-lg">Résumé de la commande</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-gray-400" />
                <span className="text-gray-600">Restaurant</span>
              </div>
              <span className="font-medium">
                {order.organisation?.trade_name ??
                  order.organisation?.legal_name ??
                  '-'}
              </span>
            </div>
            <Separator />
            <div className="space-y-2">
              {order.items.map(item => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span>{item.product?.name ?? 'Produit'}</span>
                  <Badge variant="outline">× {item.quantity}</Badge>
                </div>
              ))}
            </div>
            <Separator />
            <div className="flex justify-between text-lg font-bold">
              <span>Total TTC</span>
              <span className="text-green-600">
                {formatCurrency(order.total_ttc)}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* CMR reminder */}
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-600" />
              <CardTitle className="text-lg text-blue-900">
                Rappel: Lettre de voiture (CMR)
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-blue-800 text-sm">
              Lors de la livraison, vous recevrez une lettre de voiture (CMR).
              Veuillez vérifier l&apos;état des marchandises et noter toute
              réserve <strong>avant de signer</strong>.
            </p>
            <p className="text-blue-700 text-sm mt-2">
              En cas de dommage visible, notez-le clairement sur le document et
              prenez des photos.
            </p>
          </CardContent>
        </Card>

        {/* Form */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Truck className="h-5 w-5 text-purple-600" />
              <CardTitle className="text-lg">
                Contact de réception sur place
              </CardTitle>
            </div>
            <CardDescription>
              Indiquez la personne qui réceptionnera la livraison
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DeliveryInfoForm
              form={form}
              setForm={setForm}
              isSubmitting={isSubmitting}
              submitError={submitError}
              onSubmit={handleSubmit}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

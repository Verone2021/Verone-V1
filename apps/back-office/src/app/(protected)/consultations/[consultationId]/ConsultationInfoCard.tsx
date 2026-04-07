'use client';

import type { ClientConsultation } from '@verone/consultations';
import { ConsultationImageGallery } from '@verone/consultations';
import { Card, CardContent } from '@verone/ui';
import { Mail, Phone, Building, User, Calendar, Package } from 'lucide-react';

interface ConsultationInfoCardProps {
  consultation: ClientConsultation;
  consultationId: string;
  clientName: string;
}

export function ConsultationInfoCard({
  consultation,
  consultationId,
  clientName,
}: ConsultationInfoCardProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-1">
      {/* Photos gallery */}
      <div className="lg:col-span-1">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center mb-3">
              <Package className="h-3 w-3 mr-2 text-gray-500" />
              <span className="text-sm font-semibold">Photos consultation</span>
            </div>
            <ConsultationImageGallery
              consultationId={consultationId}
              consultationTitle={clientName}
              consultationStatus={consultation.status}
              allowEdit
              className="w-full"
            />
          </CardContent>
        </Card>
      </div>

      {/* Client info */}
      <div className="lg:col-span-2">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center mb-3">
              <Building className="h-3 w-3 mr-2 text-gray-500" />
              <span className="text-sm font-semibold">Informations</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-1">
              <div className="space-y-1">
                <div>
                  <p className="text-xs text-gray-600">Client</p>
                  <p className="font-medium">{clientName}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Email client</p>
                  <div className="flex items-center">
                    <Mail className="h-3 w-3 text-gray-400 mr-2" />
                    <p className="font-medium">{consultation.client_email}</p>
                  </div>
                </div>
                {consultation.client_phone && (
                  <div>
                    <p className="text-xs text-gray-600">Téléphone</p>
                    <div className="flex items-center">
                      <Phone className="h-3 w-3 text-gray-400 mr-2" />
                      <p className="font-medium">{consultation.client_phone}</p>
                    </div>
                  </div>
                )}
                <div>
                  <p className="text-xs text-gray-600">Canal d&apos;origine</p>
                  <p className="font-medium capitalize">
                    {consultation.source_channel}
                  </p>
                </div>
              </div>

              <div className="space-y-1">
                <div>
                  <p className="text-xs text-gray-600">Créée le</p>
                  <div className="flex items-center">
                    <Calendar className="h-3 w-3 text-gray-400 mr-2" />
                    <p className="font-medium">
                      {new Date(consultation.created_at).toLocaleDateString(
                        'fr-FR'
                      )}
                    </p>
                  </div>
                </div>
                {consultation.tarif_maximum && (
                  <div>
                    <p className="text-xs text-gray-600">Budget maximum</p>
                    <p className="font-medium">{consultation.tarif_maximum}€</p>
                  </div>
                )}
                {consultation.estimated_response_date && (
                  <div>
                    <p className="text-xs text-gray-600">Réponse estimée</p>
                    <p className="font-medium">
                      {new Date(
                        consultation.estimated_response_date
                      ).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                )}
                {consultation.assigned_to && (
                  <div>
                    <p className="text-xs text-gray-600">Assignée à</p>
                    <div className="flex items-center">
                      <User className="h-3 w-3 text-gray-400 mr-2" />
                      <p className="font-medium">{consultation.assigned_to}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-1">
              <p className="text-xs text-gray-600 mb-1">Description</p>
              <p className="bg-gray-50 p-1 rounded">
                {consultation.descriptif}
              </p>
            </div>

            {consultation.notes_internes && (
              <div className="mt-1">
                <p className="text-xs text-gray-600 mb-1">Notes internes</p>
                <p className="bg-gray-50 p-1 rounded border-l-4 border-gray-300">
                  {consultation.notes_internes}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

import Image from 'next/image';

import { ButtonUnified } from '@verone/ui';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@verone/ui';
import { ArrowLeft, Eye, Send } from 'lucide-react';

import type {
  ConsultationFormData,
  UploadedImage,
} from '../use-create-consultation';

interface StepConfirmationProps {
  formData: ConsultationFormData;
  uploadedImages: UploadedImage[];
  loading: boolean;
  onSubmit: (e: React.FormEvent) => void;
  onBack: () => void;
}

export function StepConfirmation({
  formData,
  uploadedImages,
  loading,
  onSubmit,
  onBack,
}: StepConfirmationProps) {
  return (
    <Card className="border-black">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Eye className="h-5 w-5" />
          <span>Recapitulatif</span>
        </CardTitle>
        <CardDescription>
          Verifiez les informations avant de creer la consultation
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4">
          {/* Recap Client */}
          <div className="rounded-lg border p-4 space-y-2">
            <h4 className="text-sm font-semibold uppercase text-gray-500 tracking-wider">
              Client
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-gray-500">Email :</span>{' '}
                <span className="font-medium">{formData.client_email}</span>
              </div>
              {formData.client_phone && (
                <div>
                  <span className="text-gray-500">Tel :</span>{' '}
                  <span className="font-medium">{formData.client_phone}</span>
                </div>
              )}
            </div>
          </div>

          {/* Recap Demande */}
          <div className="rounded-lg border p-4 space-y-2">
            <h4 className="text-sm font-semibold uppercase text-gray-500 tracking-wider">
              Demande
            </h4>
            <p className="text-sm whitespace-pre-wrap">{formData.descriptif}</p>
            {uploadedImages.length > 0 && (
              <div className="flex gap-2 mt-2">
                {uploadedImages.map(img => (
                  <div
                    key={img.publicUrl}
                    className="relative w-16 h-16 rounded overflow-hidden border"
                  >
                    <Image
                      src={img.publicUrl}
                      alt={img.fileName}
                      fill
                      className="object-cover"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recap Parametres */}
          <div className="rounded-lg border p-4">
            <h4 className="text-sm font-semibold uppercase text-gray-500 tracking-wider mb-2">
              Parametres
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
              {formData.tarif_maximum && (
                <div>
                  <span className="text-gray-500">Budget :</span>{' '}
                  <span className="font-medium">
                    {formData.tarif_maximum}EUR
                  </span>
                </div>
              )}
              <div>
                <span className="text-gray-500">Priorite :</span>{' '}
                <span className="font-medium">{formData.priority_level}/5</span>
              </div>
              {formData.source_channel && (
                <div>
                  <span className="text-gray-500">Canal :</span>{' '}
                  <span className="font-medium">{formData.source_channel}</span>
                </div>
              )}
              {formData.estimated_response_date && (
                <div>
                  <span className="text-gray-500">Reponse :</span>{' '}
                  <span className="font-medium">
                    {formData.estimated_response_date}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-between pt-4 border-t">
            <ButtonUnified
              variant="outline"
              onClick={onBack}
              disabled={loading}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Modifier
            </ButtonUnified>
            <ButtonUnified
              type="submit"
              disabled={loading}
              variant="success"
              loading={loading}
            >
              <Send className="h-4 w-4 mr-2" />
              Creer la consultation
            </ButtonUnified>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

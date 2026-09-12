'use client';

import { useRouter } from 'next/navigation';

import { ButtonUnified, Card, CardContent } from '@verone/ui';
import { AlertCircle, ArrowLeft, Trash2 } from 'lucide-react';

interface ConsultationNotFoundStateProps {
  deletedChecked: boolean;
  deletedInfo: { deletedAt: string; clientLabel: string | null } | null;
}

export function ConsultationNotFoundState({
  deletedChecked,
  deletedInfo,
}: ConsultationNotFoundStateProps) {
  const router = useRouter();

  // Pendant la vérification DB de "supprimée", on garde un spinner discret
  if (!deletedChecked) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-black mx-auto mb-1" />
          <p className="text-gray-600">Vérification...</p>
        </div>
      </div>
    );
  }

  // Cas 1 : consultation supprimée (deleted_at NOT NULL)
  if (deletedInfo) {
    const deletedDate = new Date(deletedInfo.deletedAt).toLocaleDateString(
      'fr-FR',
      { day: '2-digit', month: 'long', year: 'numeric' }
    );
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md border-amber-200">
          <CardContent className="text-center p-6 space-y-3">
            <Trash2 className="h-10 w-10 text-amber-600 mx-auto" />
            <div>
              <h3 className="text-base font-semibold text-gray-900 mb-1">
                Consultation supprimée
              </h3>
              <p className="text-sm text-gray-600">
                {deletedInfo.clientLabel ? (
                  <>
                    La consultation de{' '}
                    <strong>{deletedInfo.clientLabel}</strong> a été supprimée
                    le <strong>{deletedDate}</strong>.
                  </>
                ) : (
                  <>
                    Cette consultation a été supprimée le{' '}
                    <strong>{deletedDate}</strong>.
                  </>
                )}
              </p>
            </div>
            <ButtonUnified
              onClick={() => router.push('/consultations')}
              variant="outline"
              className="w-full"
            >
              <ArrowLeft className="h-3 w-3 mr-2" />
              Retour aux consultations
            </ButtonUnified>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Cas 2 : consultation inexistante (mauvais ID, jamais créée)
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="max-w-md">
        <CardContent className="text-center p-6 space-y-3">
          <AlertCircle className="h-10 w-10 text-gray-400 mx-auto" />
          <div>
            <h3 className="text-base font-semibold text-gray-900 mb-1">
              Consultation introuvable
            </h3>
            <p className="text-sm text-gray-600">
              Cette consultation n&apos;existe pas dans le système. Vérifie le
              lien.
            </p>
          </div>
          <ButtonUnified
            onClick={() => router.push('/consultations')}
            variant="outline"
            className="w-full"
          >
            <ArrowLeft className="h-3 w-3 mr-2" />
            Retour aux consultations
          </ButtonUnified>
        </CardContent>
      </Card>
    </div>
  );
}

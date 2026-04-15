'use client';

import { useRouter } from 'next/navigation';

import { ConsultationSuggestions } from '@verone/consultations/components/suggestions';
import { Alert, AlertDescription, Badge } from '@verone/ui';
import { ButtonV2 } from '@verone/ui';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@verone/ui';
import { FileText, Clock, Link, ExternalLink, AlertCircle } from 'lucide-react';

interface LinkedConsultationDisplay {
  id: string;
  consultation_id: string;
  quantity?: number;
  proposed_price?: number | null;
  created_at?: string;
  consultation?: {
    id?: string;
    enseigne?: { name: string } | null;
    organisation?: {
      trade_name: string | null;
      legal_name: string | null;
    } | null;
    descriptif?: string;
    status?: string;
    priority_level?: number;
    created_at?: string;
  };
}

interface SourcingConsultationsSectionProps {
  linkedConsultations: LinkedConsultationDisplay[];
  consultationsLoading: boolean;
  assignedClientId: string | null;
  productId: string;
  onLinkToConsultation: (consultationId: string) => void;
}

export function SourcingConsultationsSection({
  linkedConsultations,
  consultationsLoading,
  assignedClientId,
  productId,
  onLinkToConsultation,
}: SourcingConsultationsSectionProps) {
  const router = useRouter();

  return (
    <>
      <Card className="border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center text-black">
            <FileText className="h-5 w-5 mr-2" />
            Consultations
            {linkedConsultations.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {linkedConsultations.length}
              </Badge>
            )}
          </CardTitle>
          <CardDescription>
            Consultations liées à ce produit sourcing
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {consultationsLoading ? (
            <div className="text-center py-4">
              <p className="text-sm text-gray-500">Chargement...</p>
            </div>
          ) : linkedConsultations.length > 0 ? (
            <div className="space-y-3">
              {linkedConsultations.map(item => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                >
                  <div className="flex items-center gap-3">
                    <Link className="h-4 w-4 text-blue-600" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {item.consultation?.enseigne?.name ??
                          item.consultation?.organisation?.trade_name ??
                          item.consultation?.organisation?.legal_name ??
                          'Consultation'}
                      </p>
                      <p className="text-xs text-gray-500 line-clamp-1">
                        {item.consultation?.descriptif}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge
                          variant="outline"
                          className={
                            item.consultation?.status === 'en_cours'
                              ? 'border-blue-300 text-blue-600'
                              : item.consultation?.status === 'terminee'
                                ? 'border-green-300 text-green-600'
                                : 'border-gray-300 text-gray-600'
                          }
                        >
                          {item.consultation?.status?.replace('_', ' ')}
                        </Badge>
                        <span className="text-xs text-gray-400 flex items-center">
                          <Clock className="h-3 w-3 mr-1" />
                          {new Date(
                            item.consultation?.created_at ?? ''
                          ).toLocaleDateString('fr-FR')}
                        </span>
                      </div>
                    </div>
                  </div>
                  <ButtonV2
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      router.push(`/consultations/${item.consultation_id}`)
                    }
                  >
                    <ExternalLink className="h-3 w-3 mr-1" />
                    Voir
                  </ButtonV2>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 text-center py-2">
              Aucune consultation liée
            </p>
          )}

          {assignedClientId && (
            <div className="pt-2 border-t border-gray-200">
              <ConsultationSuggestions
                clientId={assignedClientId}
                _productId={productId}
                onLinkToConsultation={onLinkToConsultation}
                className="bg-blue-50 border-blue-200"
              />
            </div>
          )}
        </CardContent>
      </Card>

      <Alert className="border-blue-200 bg-blue-50">
        <AlertCircle className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-800">
          <strong>Workflow sourcing :</strong> Les produits en sourcing doivent
          être validés avant d'apparaître dans le catalogue. Si un échantillon
          est requis, utilisez d'abord l'action "Demander un échantillon" avant
          la validation finale.
        </AlertDescription>
      </Alert>
    </>
  );
}

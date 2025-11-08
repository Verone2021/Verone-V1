'use client';

import { useState, useEffect } from 'react';

import { AlertCircle, Clock, Users, ArrowRight, Link } from 'lucide-react';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { ButtonV2 } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useConsultations } from '@/shared/modules/common/hooks';
import { useToast } from '@/shared/modules/common/hooks';

interface ConsultationSuggestionsProps {
  clientId?: string;
  productId?: string;
  onLinkToConsultation?: (consultationId: string) => void;
  className?: string;
}

export function ConsultationSuggestions({
  clientId,
  productId,
  onLinkToConsultation,
  className,
}: ConsultationSuggestionsProps) {
  const { toast } = useToast();
  const { consultations, fetchConsultations } = useConsultations();
  const [relevantConsultations, setRelevantConsultations] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (clientId) {
      loadRelevantConsultations();
    }
  }, [clientId]);

  const loadRelevantConsultations = async () => {
    setLoading(true);
    try {
      await fetchConsultations();

      // Filtrer les consultations du client spécifique
      const clientConsultations = consultations.filter(consultation => {
        // Si on a un client ID, filtrer par client
        if (clientId) {
          // TODO: Ajouter une relation client_id dans consultations ou filtrer par organisation_name
          // Pour l'instant, on montre toutes les consultations actives
          return (
            consultation.status === 'en_attente' ||
            consultation.status === 'en_cours'
          );
        }
        return false;
      });

      // Trier par priorité et date
      const sorted = clientConsultations.sort((a, b) => {
        // D'abord par niveau de priorité (plus élevé = plus urgent)
        if (a.priority_level !== b.priority_level) {
          return b.priority_level - a.priority_level;
        }
        // Puis par date de création (plus récent en premier)
        return (
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
      });

      setRelevantConsultations(sorted.slice(0, 3)); // Max 3 suggestions
    } catch (error) {
      console.error('Erreur chargement consultations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLinkToConsultation = (consultationId: string) => {
    if (onLinkToConsultation) {
      onLinkToConsultation(consultationId);
    }

    toast({
      title: 'Suggestion enregistrée',
      description: 'Ce produit pourrait répondre à cette consultation',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'en_attente':
        return 'bg-gray-100 text-gray-900';
      case 'en_cours':
        return 'bg-blue-100 text-blue-800';
      case 'terminee':
        return 'bg-green-100 text-green-800';
      case 'annulee':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityLabel = (level: number) => {
    switch (level) {
      case 5:
        return { label: 'Très urgent', color: 'text-red-600' };
      case 4:
        return { label: 'Urgent', color: 'text-black' };
      case 3:
        return { label: 'Normal+', color: 'text-blue-600' };
      case 2:
        return { label: 'Normal', color: 'text-gray-600' };
      case 1:
        return { label: 'Faible', color: 'text-gray-400' };
      default:
        return { label: 'Normal', color: 'text-gray-600' };
    }
  };

  if (!clientId || loading) {
    return null;
  }

  if (relevantConsultations.length === 0) {
    return (
      <Alert className={className}>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Aucune consultation active trouvée pour ce client.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center text-lg">
          <Users className="h-5 w-5 mr-2 text-blue-600" />
          Consultations suggérées
        </CardTitle>
        <CardDescription>
          Ce produit pourrait répondre aux consultations suivantes de ce client
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {relevantConsultations.map(consultation => {
          const priority = getPriorityLabel(consultation.priority_level);
          const daysSinceCreation = Math.floor(
            (new Date().getTime() -
              new Date(consultation.created_at).getTime()) /
              (1000 * 60 * 60 * 24)
          );

          return (
            <div
              key={consultation.id}
              className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 space-y-2">
                  {/* En-tête consultation */}
                  <div className="flex items-center space-x-2">
                    <h4 className="font-medium text-gray-900">
                      {consultation.organisation_name}
                    </h4>
                    <Badge className={getStatusColor(consultation.status)}>
                      {consultation.status.replace('_', ' ')}
                    </Badge>
                    {consultation.priority_level > 2 && (
                      <Badge variant="outline" className={priority.color}>
                        {priority.label}
                      </Badge>
                    )}
                  </div>

                  {/* Description */}
                  <p className="text-sm text-gray-600 line-clamp-2">
                    {consultation.descriptif}
                  </p>

                  {/* Métadonnées */}
                  <div className="flex items-center space-x-4 text-xs text-gray-500">
                    <div className="flex items-center">
                      <Clock className="h-3 w-3 mr-1" />
                      Il y a {daysSinceCreation} jour
                      {daysSinceCreation > 1 ? 's' : ''}
                    </div>
                    {consultation.tarif_maximum && (
                      <div>Budget max : {consultation.tarif_maximum}€</div>
                    )}
                    {consultation.estimated_response_date && (
                      <div>
                        Réponse prévue :{' '}
                        {new Date(
                          consultation.estimated_response_date
                        ).toLocaleDateString('fr-FR')}
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center space-x-2">
                  <ButtonV2
                    variant="outline"
                    size="sm"
                    onClick={() => handleLinkToConsultation(consultation.id)}
                  >
                    <Link className="h-3 w-3 mr-1" />
                    Associer
                  </ButtonV2>
                </div>
              </div>
            </div>
          );
        })}

        {/* Aide */}
        <Alert>
          <ArrowRight className="h-4 w-4" />
          <AlertDescription>
            <div className="text-sm">
              <strong>Conseil :</strong> Associer ce produit à une consultation
              permet un meilleur suivi commercial et aide à personnaliser la
              proposition client.
            </div>
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}

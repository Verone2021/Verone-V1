'use client';

import type { ClientConsultation } from '@verone/consultations';
import { Badge } from '@verone/ui';
import { ButtonUnified } from '@verone/ui';
import { ArrowLeft } from 'lucide-react';

import {
  getStatusColor,
  getStatusIcon,
  getPriorityColor,
  getPriorityLabel,
} from './helpers';

interface ConsultationHeaderProps {
  consultation: ClientConsultation;
  clientName: string;
  onBack: () => void;
}

export function ConsultationHeader({
  consultation,
  clientName,
  onBack,
}: ConsultationHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-2">
      <div className="flex items-center space-x-4">
        <ButtonUnified
          variant="ghost"
          onClick={onBack}
          className="flex items-center text-gray-600 hover:text-black"
        >
          <ArrowLeft className="h-3 w-3 mr-2" />
          Retour
        </ButtonUnified>
        <div>
          <h1 className="text-xs font-bold text-black">
            Consultation: {clientName}
          </h1>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <Badge
          variant="outline"
          className={getStatusColor(consultation.status)}
        >
          {getStatusIcon(consultation.status)}
          <span className="ml-1 capitalize">
            {consultation.status.replace('_', ' ')}
          </span>
        </Badge>
        <Badge
          variant="outline"
          className={getPriorityColor(consultation.priority_level)}
        >
          Priorité: {getPriorityLabel(consultation.priority_level)}
        </Badge>
        {consultation.validated_at && (
          <Badge className="bg-green-600 text-white">
            Validée le{' '}
            {new Date(consultation.validated_at).toLocaleDateString('fr-FR')}
          </Badge>
        )}
        {consultation.archived_at && (
          <Badge variant="outline" className="border-gray-400 text-gray-700">
            Archivée le{' '}
            {new Date(consultation.archived_at).toLocaleDateString('fr-FR')}
          </Badge>
        )}
      </div>
    </div>
  );
}

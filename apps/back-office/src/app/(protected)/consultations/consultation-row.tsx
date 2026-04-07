'use client';

import { useState } from 'react';

import Image from 'next/image';

import { type ClientConsultation } from '@verone/consultations';
import { useConsultationImages } from '@verone/consultations';
import { Badge } from '@verone/ui';
import { ButtonUnified } from '@verone/ui';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@verone/ui';
import {
  Eye,
  CheckCircle,
  Clock,
  AlertCircle,
  Mail,
  Calendar,
  XCircle,
  Camera,
  MoreVertical,
  Archive,
  ArchiveRestore,
  Trash2,
} from 'lucide-react';

import { ConsultationImageViewerModal } from '@/components/business/consultation-image-viewer-modal';

import { getClientName } from './use-consultations-page';

function getPriorityLabel(level: number): string {
  switch (level) {
    case 5:
      return 'Très urgent';
    case 4:
      return 'Urgent';
    case 3:
      return 'Normal+';
    case 2:
      return 'Normal';
    case 1:
      return 'Faible';
    default:
      return 'Normal';
  }
}

// ============================================================================
// ConsultationPhotoModal
// ============================================================================

interface ConsultationPhotoModalProps {
  consultationId: string;
  consultationTitle: string;
  isOpen: boolean;
  onClose: () => void;
}

export function ConsultationPhotoModal({
  consultationId,
  consultationTitle,
  isOpen,
  onClose,
}: ConsultationPhotoModalProps) {
  const { images } = useConsultationImages({
    consultationId,
    autoFetch: true,
  });

  const [selectedImageIndex] = useState(0);

  if (!isOpen) return null;

  return (
    <ConsultationImageViewerModal
      isOpen={isOpen}
      onClose={onClose}
      images={images}
      initialImageIndex={selectedImageIndex}
      consultationTitle={consultationTitle}
      allowEdit={false}
    />
  );
}

// ============================================================================
// ConsultationRow
// ============================================================================

export interface ConsultationRowProps {
  consultation: ClientConsultation;
  onOpenPhotoModal: (id: string, title: string) => void;
  onViewDetails: () => void;
  onArchive: () => void;
  onUnarchive: () => void;
  onDelete: () => void;
}

export function ConsultationRow({
  consultation,
  onOpenPhotoModal,
  onViewDetails,
  onArchive,
  onUnarchive,
  onDelete,
}: ConsultationRowProps) {
  const { primaryImage, hasImages, loading } = useConsultationImages({
    consultationId: consultation.id,
    autoFetch: true,
  });

  return (
    <div className="border rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-4">
        {/* Miniature photo cliquable */}
        <div className="flex-shrink-0">
          {loading ? (
            <div className="w-12 h-12 bg-gray-100 animate-pulse rounded" />
          ) : hasImages && primaryImage ? (
            <button
              onClick={() =>
                onOpenPhotoModal(consultation.id, getClientName(consultation))
              }
              className="relative w-12 h-12 overflow-hidden rounded border border-gray-200 hover:border-black transition-colors group"
              title="Cliquer pour voir toutes les photos"
            >
              <Image
                src={primaryImage.public_url ?? '/placeholder-consultation.svg'}
                alt={`Photo ${getClientName(consultation)}`}
                fill
                className="object-cover group-hover:scale-110 transition-transform"
                sizes="48px"
              />
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all flex items-center justify-center">
                <Eye className="h-4 w-4 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </button>
          ) : (
            <div className="w-12 h-12 bg-gray-100 rounded border border-gray-200 flex items-center justify-center">
              <Camera className="h-5 w-5 text-gray-400" />
            </div>
          )}
        </div>

        {/* Contenu consultation */}
        <div className="flex-1 space-y-2">
          <div className="flex items-center space-x-4">
            <h3 className="text-lg font-semibold">
              {getClientName(consultation)}
            </h3>
            <Badge
              variant="outline"
              className={
                consultation.status === 'en_attente'
                  ? 'border-gray-200 text-gray-800'
                  : consultation.status === 'en_cours'
                    ? 'border-blue-200 text-blue-700'
                    : consultation.status === 'terminee'
                      ? 'border-green-200 text-green-700'
                      : 'border-gray-200 text-gray-700'
              }
            >
              {consultation.status === 'en_attente' && (
                <Clock className="h-3 w-3 mr-1" />
              )}
              {consultation.status === 'en_cours' && (
                <AlertCircle className="h-3 w-3 mr-1" />
              )}
              {consultation.status === 'terminee' && (
                <CheckCircle className="h-3 w-3 mr-1" />
              )}
              {consultation.status === 'annulee' && (
                <XCircle className="h-3 w-3 mr-1" />
              )}
              {consultation.status.replace('_', ' ')}
            </Badge>
            <Badge
              variant="outline"
              className={
                consultation.priority_level >= 4
                  ? 'border-red-200 text-red-700'
                  : consultation.priority_level === 3
                    ? 'border-blue-200 text-blue-700'
                    : 'border-gray-200 text-gray-700'
              }
            >
              {getPriorityLabel(consultation.priority_level)}
            </Badge>
          </div>

          <p className="text-gray-600 text-sm line-clamp-2">
            {consultation.descriptif}
          </p>

          <div className="flex items-center space-x-4 text-sm text-gray-500">
            <div className="flex items-center">
              <Mail className="h-4 w-4 mr-1" />
              {consultation.client_email}
            </div>
            <div className="flex items-center">
              <Calendar className="h-4 w-4 mr-1" />
              {new Date(consultation.created_at).toLocaleDateString('fr-FR')}
            </div>
            {consultation.tarif_maximum && (
              <div className="flex items-center">
                <span>Budget: {consultation.tarif_maximum}€</span>
              </div>
            )}
          </div>
        </div>

        {/* Boutons actions */}
        <div className="flex items-center space-x-2">
          {consultation.archived_at && (
            <Badge
              variant="outline"
              className="border-gray-400 text-gray-500 text-xs"
            >
              Archivée
            </Badge>
          )}
          <ButtonUnified variant="outline" size="sm" onClick={onViewDetails}>
            <Eye className="h-4 w-4 mr-1" />
            Voir détails
          </ButtonUnified>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <ButtonUnified variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreVertical className="h-4 w-4" />
              </ButtonUnified>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {!consultation.archived_at ? (
                <DropdownMenuItem onClick={onArchive}>
                  <Archive className="h-4 w-4 mr-2" />
                  Archiver
                </DropdownMenuItem>
              ) : (
                <>
                  <DropdownMenuItem onClick={onUnarchive}>
                    <ArchiveRestore className="h-4 w-4 mr-2" />
                    Désarchiver
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={onDelete}
                    className="text-red-600 focus:text-red-600"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Supprimer
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}

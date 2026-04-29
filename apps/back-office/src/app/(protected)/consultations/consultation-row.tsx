'use client';

import { useState } from 'react';

import { type ClientConsultation } from '@verone/consultations';
import { useConsultationImages } from '@verone/consultations';
import { Badge, CloudflareImage } from '@verone/ui';
import { ButtonV2 } from '@verone/ui';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@verone/ui';
import {
  Eye,
  Clock,
  AlertCircle,
  XCircle,
  Camera,
  CheckCircle,
  MoreHorizontal,
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

  const clientName = getClientName(consultation);

  return (
    <tr className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors">
      {/* Photo */}
      <td className="p-3">
        <div className="flex-shrink-0 w-10 h-10 rounded-lg overflow-hidden border border-gray-200 bg-gray-50">
          {loading ? (
            <div className="w-full h-full bg-gray-100 animate-pulse" />
          ) : hasImages && primaryImage ? (
            <button
              onClick={() => onOpenPhotoModal(consultation.id, clientName)}
              className="relative w-10 h-10 overflow-hidden group"
              title="Cliquer pour voir toutes les photos"
            >
              <CloudflareImage
                cloudflareId={primaryImage.cloudflare_image_id}
                fallbackSrc={
                  primaryImage.public_url ?? '/placeholder-consultation.svg'
                }
                alt={`Photo ${clientName}`}
                width={40}
                height={40}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform"
              />
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all flex items-center justify-center">
                <Eye className="h-3 w-3 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </button>
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Camera className="h-4 w-4 text-gray-300" />
            </div>
          )}
        </div>
      </td>

      {/* Client */}
      <td className="p-3">
        <button
          onClick={onViewDetails}
          className="text-sm font-medium text-gray-900 hover:text-blue-600 hover:underline truncate block max-w-[200px] text-left"
        >
          {clientName}
        </button>
      </td>

      {/* Email */}
      <td className="p-3">
        <span className="text-xs text-gray-500 truncate block max-w-[200px]">
          {consultation.client_email}
        </span>
      </td>

      {/* Statut */}
      <td className="p-3">
        <Badge
          variant="outline"
          className={
            consultation.status === 'en_attente'
              ? 'border-gray-200 text-gray-800'
              : consultation.status === 'en_cours'
                ? 'border-blue-200 text-blue-700'
                : consultation.status === 'terminee'
                  ? 'border-green-200 text-green-700'
                  : 'border-red-200 text-red-700'
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
      </td>

      {/* Priorité */}
      <td className="p-3">
        <Badge
          variant="outline"
          className={
            consultation.priority_level >= 5
              ? 'border-red-200 text-red-700'
              : consultation.priority_level === 4
                ? 'border-orange-200 text-orange-700'
                : consultation.priority_level === 3
                  ? 'border-blue-200 text-blue-700'
                  : 'border-gray-200 text-gray-700'
          }
        >
          {getPriorityLabel(consultation.priority_level)}
        </Badge>
      </td>

      {/* Date */}
      <td className="p-3">
        <span className="text-xs text-gray-500">
          {new Date(consultation.created_at).toLocaleDateString('fr-FR')}
        </span>
      </td>

      {/* Actions */}
      <td className="p-3">
        <div className="flex items-center justify-end gap-1">
          <ButtonV2 variant="outline" size="sm" onClick={onViewDetails}>
            <Eye className="h-3 w-3" />
          </ButtonV2>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <ButtonV2 variant="outline" size="sm">
                <MoreHorizontal className="h-3 w-3" />
              </ButtonV2>
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
      </td>
    </tr>
  );
}

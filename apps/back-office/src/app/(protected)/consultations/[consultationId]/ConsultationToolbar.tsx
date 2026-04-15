'use client';

import type { ClientConsultation } from '@verone/consultations';
import { ButtonUnified } from '@verone/ui';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@verone/ui';
import {
  Edit,
  ChevronDown,
  MoreHorizontal,
  Mail,
  FileText,
  CheckCircle,
  Archive,
  ArchiveRestore,
  Trash2,
  Loader2,
  ShoppingCart,
} from 'lucide-react';

import { getStatusIcon, statusOptions } from './helpers';

interface ConsultationToolbarProps {
  consultation: ClientConsultation;
  consultationItemsCount: number;
  emailPdfLoading: boolean;
  pdfLoading: boolean;
  creatingOrder: boolean;
  onEdit: () => void;
  onStatusChange: (status: ClientConsultation['status']) => void;
  onValidate: () => void;
  onArchive: () => void;
  onUnarchive: () => void;
  onDelete: () => void;
  onEmail: () => void;
  onPdf: () => void;
  onMarginReport?: () => void;
  onCreateQuote: () => void;
  onCreateOrder: () => void;
}

export function ConsultationToolbar({
  consultation,
  consultationItemsCount,
  emailPdfLoading,
  pdfLoading,
  creatingOrder,
  onEdit,
  onStatusChange,
  onValidate,
  onArchive,
  onUnarchive,
  onDelete,
  onEmail,
  onPdf,
  onMarginReport,
  onCreateQuote,
  onCreateOrder,
}: ConsultationToolbarProps) {
  return (
    <div className="flex items-center space-x-2">
      {/* Modifier */}
      <ButtonUnified variant="outline" size="sm" onClick={onEdit}>
        <Edit className="h-3 w-3 mr-2" />
        Modifier
      </ButtonUnified>

      {/* Changer statut dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <ButtonUnified variant="outline" size="sm">
            Changer statut
            <ChevronDown className="h-3 w-3 ml-2" />
          </ButtonUnified>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          {statusOptions.map(opt => (
            <DropdownMenuItem
              key={opt.value}
              disabled={consultation.status === opt.value}
              onClick={() => {
                void Promise.resolve(onStatusChange(opt.value)).catch(error => {
                  console.error(
                    '[ConsultationToolbar] Status change failed:',
                    error
                  );
                });
              }}
            >
              {getStatusIcon(opt.value)}
              <span className="ml-2">{opt.label}</span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Plus d'actions dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <ButtonUnified variant="outline" size="sm">
            <MoreHorizontal className="h-3 w-3 mr-2" />
            Plus
          </ButtonUnified>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          {/* Valider */}
          {!consultation.validated_at && !consultation.archived_at && (
            <DropdownMenuItem
              onClick={() => {
                void Promise.resolve(onValidate()).catch(error => {
                  console.error(
                    '[ConsultationToolbar] Validate failed:',
                    error
                  );
                });
              }}
            >
              <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
              Valider la consultation
            </DropdownMenuItem>
          )}
          {/* Archiver */}
          {!consultation.archived_at && (
            <DropdownMenuItem
              onClick={() => {
                void Promise.resolve(onArchive()).catch(error => {
                  console.error('[ConsultationToolbar] Archive failed:', error);
                });
              }}
            >
              <Archive className="h-4 w-4 mr-2" />
              Archiver
            </DropdownMenuItem>
          )}
          {/* Désarchiver */}
          {consultation.archived_at && (
            <DropdownMenuItem
              onClick={() => {
                void Promise.resolve(onUnarchive()).catch(error => {
                  console.error(
                    '[ConsultationToolbar] Unarchive failed:',
                    error
                  );
                });
              }}
            >
              <ArchiveRestore className="h-4 w-4 mr-2 text-blue-600" />
              Désarchiver
            </DropdownMenuItem>
          )}
          {/* Supprimer — ouvre le modal de confirmation */}
          {consultation.archived_at && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-red-600 focus:text-red-600"
                onClick={onDelete}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Supprimer définitivement
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Envoyer par email */}
      <ButtonUnified
        variant="outline"
        size="sm"
        disabled={emailPdfLoading}
        onClick={onEmail}
      >
        <Mail className="h-3 w-3 mr-2" />
        {emailPdfLoading ? 'Chargement...' : 'Envoyer par email'}
      </ButtonUnified>

      {/* Résumé PDF */}
      <ButtonUnified
        variant="outline"
        size="sm"
        disabled={pdfLoading}
        onClick={onPdf}
      >
        <FileText className="h-3 w-3 mr-2" />
        {pdfLoading ? 'Chargement...' : 'Résumé PDF'}
      </ButtonUnified>

      {/* Rapport marges (interne) */}
      {onMarginReport && consultationItemsCount > 0 && (
        <ButtonUnified variant="outline" size="sm" onClick={onMarginReport}>
          <FileText className="h-3 w-3 mr-2" />
          Rapport marges
        </ButtonUnified>
      )}

      {/* Creer un devis */}
      <ButtonUnified
        variant="default"
        size="sm"
        disabled={consultationItemsCount === 0}
        onClick={onCreateQuote}
      >
        <FileText className="h-3 w-3 mr-2" />
        Creer un devis
      </ButtonUnified>

      {/* Creer une commande — uniquement si consultation terminee */}
      <ButtonUnified
        variant="default"
        size="sm"
        disabled={
          creatingOrder ||
          consultationItemsCount === 0 ||
          consultation.status !== 'terminee'
        }
        title={
          consultation.status !== 'terminee'
            ? 'La consultation doit être terminée pour créer une commande'
            : undefined
        }
        onClick={() => {
          void Promise.resolve(onCreateOrder()).catch(error => {
            console.error('[ConsultationToolbar] Create order failed:', error);
          });
        }}
      >
        {creatingOrder ? (
          <Loader2 className="h-3 w-3 mr-2 animate-spin" />
        ) : (
          <ShoppingCart className="h-3 w-3 mr-2" />
        )}
        {creatingOrder ? 'Creation...' : 'Creer une commande'}
      </ButtonUnified>
    </div>
  );
}

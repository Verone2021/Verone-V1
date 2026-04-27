'use client';

import type { ClientConsultation } from '@verone/consultations';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@verone/ui';
import {
  Edit,
  MoreHorizontal,
  Mail,
  FileText,
  CheckCircle,
  Undo2,
  Archive,
  ArchiveRestore,
  Trash2,
  Loader2,
  ShoppingCart,
  BarChart2,
  ChevronDown,
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
  onUnvalidate: () => void;
  onArchive: () => void;
  onUnarchive: () => void;
  onDelete: () => void;
  onEmail: () => void;
  onPdf: () => void;
  onMarginReport?: () => void;
  onCreateQuote: () => void;
  onCreateOrder: () => void;
}

const btnBase =
  'inline-flex items-center gap-1.5 px-2 py-1.5 text-sm font-medium rounded-lg transition-colors h-8';
const btnGhost = `${btnBase} text-zinc-600 hover:bg-zinc-50`;
const btnOutline = `${btnBase} border border-zinc-200 text-zinc-700 hover:bg-zinc-50`;
const btnPrimary = `${btnBase} bg-blue-600 text-white hover:bg-blue-700 shadow-sm`;

export function ConsultationToolbar({
  consultation,
  consultationItemsCount,
  emailPdfLoading,
  pdfLoading,
  creatingOrder,
  onEdit,
  onStatusChange,
  onValidate,
  onUnvalidate,
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
    <div className="flex items-center justify-between gap-2 flex-wrap">
      {/* Groupe gauche — actions secondaires */}
      <div className="flex items-center gap-1">
        {/* Modifier */}
        <button type="button" onClick={onEdit} className={btnGhost}>
          <Edit className="h-3.5 w-3.5" />
          <span>Modifier</span>
        </button>

        {/* Email */}
        <button
          type="button"
          onClick={onEmail}
          disabled={emailPdfLoading}
          className={btnGhost}
        >
          <Mail className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">
            {emailPdfLoading ? 'Envoi...' : 'Email'}
          </span>
        </button>

        {/* Résumé PDF */}
        <button
          type="button"
          onClick={onPdf}
          disabled={pdfLoading}
          className={btnGhost}
        >
          <FileText className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">
            {pdfLoading ? 'Chargement...' : 'PDF'}
          </span>
        </button>

        {/* Rapport marges */}
        {onMarginReport && consultationItemsCount > 0 && (
          <button type="button" onClick={onMarginReport} className={btnGhost}>
            <BarChart2 className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Marges</span>
          </button>
        )}

        {/* Overflow — statut + actions dangereuses */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className={btnGhost}
              aria-label="Plus d'actions"
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-52">
            {/* Changer statut */}
            <DropdownMenu>
              <DropdownMenuTrigger className="flex w-full items-center px-2 py-1.5 text-sm text-zinc-700 hover:bg-zinc-50 rounded-sm gap-2 cursor-default">
                <ChevronDown className="h-3.5 w-3.5 text-zinc-400" />
                Changer statut
              </DropdownMenuTrigger>
              <DropdownMenuContent side="right" className="w-44">
                {statusOptions.map(opt => (
                  <DropdownMenuItem
                    key={opt.value}
                    disabled={consultation.status === opt.value}
                    onClick={() => {
                      void Promise.resolve(onStatusChange(opt.value)).catch(
                        err => {
                          console.error(
                            '[ConsultationToolbar] Status change failed:',
                            err
                          );
                        }
                      );
                    }}
                  >
                    {getStatusIcon(opt.value)}
                    <span className="ml-2">{opt.label}</span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenuSeparator />

            {/* Valider */}
            {!consultation.validated_at && !consultation.archived_at && (
              <DropdownMenuItem
                onClick={() => {
                  void Promise.resolve(onValidate()).catch(err => {
                    console.error(
                      '[ConsultationToolbar] Validate failed:',
                      err
                    );
                  });
                }}
              >
                <CheckCircle className="h-4 w-4 mr-2 text-emerald-600" />
                Valider la consultation
              </DropdownMenuItem>
            )}

            {/* Dévalider — permet de reprendre l'édition prix/quantité après une validation prématurée */}
            {consultation.validated_at && !consultation.archived_at && (
              <DropdownMenuItem
                onClick={() => {
                  void Promise.resolve(onUnvalidate()).catch(err => {
                    console.error(
                      '[ConsultationToolbar] Unvalidate failed:',
                      err
                    );
                  });
                }}
              >
                <Undo2 className="h-4 w-4 mr-2 text-amber-600" />
                Dévalider pour modifier
              </DropdownMenuItem>
            )}

            {/* Archiver */}
            {!consultation.archived_at && (
              <DropdownMenuItem
                onClick={() => {
                  void Promise.resolve(onArchive()).catch(err => {
                    console.error('[ConsultationToolbar] Archive failed:', err);
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
                  void Promise.resolve(onUnarchive()).catch(err => {
                    console.error(
                      '[ConsultationToolbar] Unarchive failed:',
                      err
                    );
                  });
                }}
              >
                <ArchiveRestore className="h-4 w-4 mr-2 text-blue-600" />
                Désarchiver
              </DropdownMenuItem>
            )}

            {/* Supprimer */}
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
      </div>

      {/* Groupe droit — CTAs principaux */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={consultationItemsCount === 0}
          onClick={onCreateQuote}
          className={btnOutline}
        >
          <FileText className="h-3.5 w-3.5" />
          <span>Créer devis</span>
        </button>

        <button
          type="button"
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
            void Promise.resolve(onCreateOrder()).catch(err => {
              console.error('[ConsultationToolbar] Create order failed:', err);
            });
          }}
          className={btnPrimary}
        >
          {creatingOrder ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <ShoppingCart className="h-3.5 w-3.5" />
          )}
          <span>{creatingOrder ? 'Création...' : 'Commander'}</span>
        </button>
      </div>
    </div>
  );
}

'use client';

/**
 * Table principale de la clôture comptable [BO-COMPTA-001]
 *
 * Affiche les lignes présentes ET manquantes, avec signaux et actions :
 * - Aperçu PDF
 * - Déposer une pièce manquante
 * - Corriger TVA + PCG
 * - Marquer ignoré
 * Actions inline, réutilise ResponsiveDataView pour mobile/desktop.
 */

import { useCallback, useState } from 'react';

import { getPcgCategory } from '@verone/finance';
import {
  Badge,
  Button,
  ResponsiveDataView,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@verone/ui';
import { createClient } from '@verone/utils/supabase/client';
import { Edit2, Eye, EyeOff, FileText, Upload } from 'lucide-react';
import { toast } from 'sonner';

import type { ClotureRow } from '../../_shared-comptable/types';
import { ClotureRowSignals } from '../../_shared-comptable/cloture-row-signals';
import { ClotureUploadDialog } from '../../_shared-comptable/cloture-upload-dialog';
import { ClotureVatPcgDialog } from '../../_shared-comptable/cloture-vat-pcg-dialog';

interface ClotureTableProps {
  rows: ClotureRow[];
  isLoading: boolean;
  onRefresh: () => void;
}

function formatCurrency(v: number | null): string {
  if (v == null) return '—';
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  }).format(v);
}

function formatDate(d: string | null): string {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
  });
}

function DirectionBadge({
  direction,
  docType,
}: {
  direction: string;
  docType: string;
}) {
  if (
    docType === 'supplier_credit_note' ||
    docType === 'customer_credit_note'
  ) {
    return (
      <Badge
        className="text-[10px] py-0 bg-purple-100 text-purple-700"
        variant="outline"
      >
        Avoir
      </Badge>
    );
  }
  return direction === 'inbound' ? (
    <Badge
      className="text-[10px] py-0 bg-orange-100 text-orange-700"
      variant="outline"
    >
      Achat
    </Badge>
  ) : (
    <Badge
      className="text-[10px] py-0 bg-blue-100 text-blue-700"
      variant="outline"
    >
      Vente
    </Badge>
  );
}

export function ClotureTable({
  rows,
  isLoading,
  onRefresh,
}: ClotureTableProps) {
  const [vatPcgRow, setVatPcgRow] = useState<ClotureRow | null>(null);
  const [vatPcgOpen, setVatPcgOpen] = useState(false);
  const [uploadRow, setUploadRow] = useState<ClotureRow | null>(null);
  const [uploadOpen, setUploadOpen] = useState(false);

  const handleOpenVatPcg = useCallback((row: ClotureRow) => {
    setVatPcgRow(row);
    setVatPcgOpen(true);
  }, []);

  const handleOpenUpload = useCallback((row: ClotureRow) => {
    setUploadRow(row);
    setUploadOpen(true);
  }, []);

  const handleOpenPdf = useCallback((row: ClotureRow) => {
    if (row.pdf_url) {
      window.open(row.pdf_url, '_blank');
    } else if (row.local_pdf_path) {
      // Construire l'URL via la route attachments
      const attachmentId =
        row.local_pdf_path.split('/').pop()?.replace('.pdf', '') ?? '';
      window.open(`/api/qonto/attachments/${attachmentId}`, '_blank');
    }
  }, []);

  const handleToggleIgnore = useCallback(
    async (row: ClotureRow) => {
      try {
        const supabase = createClient();
        const newIgnoredAt = row.ignored_at ? null : new Date().toISOString();
        const { error } = await supabase
          .from('bank_transactions')
          .update({ ignored_at: newIgnoredAt })
          .eq('id', row.id);
        if (error) throw error;
        toast.success(newIgnoredAt ? 'Ligne ignorée' : 'Ligne réactivée');
        onRefresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Erreur');
      }
    },
    [onRefresh]
  );

  // Rendu d'une ligne de tableau (desktop)
  const renderTableRow = useCallback(
    (row: ClotureRow) => {
      const hasPdf = !!(row.pdf_url ?? row.local_pdf_path);
      const pcgLabel = row.category_pcg
        ? (getPcgCategory(row.category_pcg)?.label ?? row.category_pcg)
        : null;

      return (
        <TableRow
          key={`${row.id}-${row.kind}`}
          className={row.signals.ignored ? 'opacity-50' : undefined}
        >
          {/* Date */}
          <TableCell className="w-[80px] text-xs text-muted-foreground">
            {formatDate(row.document_date)}
          </TableCell>

          {/* Type */}
          <TableCell className="w-[80px]">
            <DirectionBadge
              direction={row.document_direction}
              docType={row.document_type}
            />
          </TableCell>

          {/* Partenaire + numéro (colonne principale) */}
          <TableCell className="min-w-[160px]">
            <p className="font-medium text-sm truncate max-w-[200px]">
              {row.partner_name ?? '—'}
            </p>
            {row.document_number && (
              <p className="text-xs text-muted-foreground">
                {row.document_number}
              </p>
            )}
          </TableCell>

          {/* Montant TTC */}
          <TableCell className="w-[110px] text-right text-sm tabular-nums">
            {formatCurrency(row.total_ttc)}
          </TableCell>

          {/* TVA */}
          <TableCell className="w-[70px] hidden lg:table-cell text-xs text-center">
            {row.vat_rate != null ? (
              <span className={row.signals.vatMissing ? 'text-orange-600' : ''}>
                {row.vat_rate}%
              </span>
            ) : (
              <span className="text-orange-500">—</span>
            )}
          </TableCell>

          {/* PCG */}
          <TableCell className="w-[100px] hidden xl:table-cell text-xs">
            {pcgLabel ? (
              <span
                className="truncate block max-w-[90px]"
                title={`${row.category_pcg} — ${pcgLabel}`}
              >
                {row.category_pcg}
              </span>
            ) : (
              <span className="text-red-500">—</span>
            )}
          </TableCell>

          {/* Signaux */}
          <TableCell className="hidden md:table-cell">
            <ClotureRowSignals signals={row.signals} />
          </TableCell>

          {/* Actions */}
          <TableCell className="w-[120px]">
            <div className="flex items-center gap-1 justify-end">
              {/* Aperçu PDF */}
              {hasPdf && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9"
                  title="Voir la pièce"
                  onClick={() => handleOpenPdf(row)}
                >
                  <Eye className="h-4 w-4" />
                </Button>
              )}

              {/* Déposer une pièce */}
              {row.transaction_id && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9"
                  title={hasPdf ? 'Remplacer la pièce' : 'Déposer une pièce'}
                  onClick={() => handleOpenUpload(row)}
                >
                  <Upload className="h-4 w-4" />
                </Button>
              )}

              {/* Corriger TVA + PCG */}
              {row.transaction_id && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9"
                  title="Corriger TVA et code comptable"
                  onClick={() => handleOpenVatPcg(row)}
                >
                  <Edit2 className="h-4 w-4" />
                </Button>
              )}

              {/* Ignorer / Réactiver */}
              {row.transaction_id && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 text-muted-foreground hover:text-foreground"
                  title={
                    row.signals.ignored
                      ? 'Réactiver cette ligne'
                      : 'Ignorer cette ligne'
                  }
                  onClick={() => {
                    void handleToggleIgnore(row).catch(err => {
                      console.error(
                        '[ClotureTable] toggle ignore failed:',
                        err
                      );
                    });
                  }}
                >
                  <EyeOff className="h-4 w-4" />
                </Button>
              )}
            </div>
          </TableCell>
        </TableRow>
      );
    },
    [handleOpenPdf, handleOpenUpload, handleOpenVatPcg, handleToggleIgnore]
  );

  // Rendu d'une carte (mobile)
  const renderCard = useCallback(
    (row: ClotureRow) => {
      const hasPdf = !!(row.pdf_url ?? row.local_pdf_path);
      return (
        <div
          key={`${row.id}-${row.kind}`}
          className="border rounded-lg p-3 space-y-2 bg-white"
        >
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <DirectionBadge
                  direction={row.document_direction}
                  docType={row.document_type}
                />
                <span className="text-xs text-muted-foreground">
                  {formatDate(row.document_date)}
                </span>
              </div>
              <p className="font-medium text-sm truncate mt-0.5">
                {row.partner_name ?? row.document_number ?? '—'}
              </p>
            </div>
            <p className="text-sm font-semibold flex-shrink-0 tabular-nums">
              {formatCurrency(row.total_ttc)}
            </p>
          </div>

          <ClotureRowSignals signals={row.signals} />

          <div className="flex items-center gap-1 pt-1 border-t">
            {hasPdf && (
              <Button
                variant="ghost"
                size="sm"
                className="h-9 gap-1 text-xs"
                onClick={() => handleOpenPdf(row)}
              >
                <Eye className="h-3.5 w-3.5" />
                Voir
              </Button>
            )}
            {row.transaction_id && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-9 gap-1 text-xs"
                  onClick={() => handleOpenUpload(row)}
                >
                  <Upload className="h-3.5 w-3.5" />
                  Pièce
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-9 gap-1 text-xs"
                  onClick={() => handleOpenVatPcg(row)}
                >
                  <Edit2 className="h-3.5 w-3.5" />
                  TVA/PCG
                </Button>
              </>
            )}
          </div>
        </div>
      );
    },
    [handleOpenPdf, handleOpenUpload, handleOpenVatPcg]
  );

  return (
    <>
      <ResponsiveDataView<ClotureRow>
        data={rows}
        loading={isLoading}
        emptyMessage={
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-2">
            <FileText className="h-10 w-10 opacity-30" />
            <p>Aucune ligne pour cette sélection</p>
          </div>
        }
        renderTable={tableRows => (
          <div className="w-full overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px]">Date</TableHead>
                  <TableHead className="w-[80px]">Type</TableHead>
                  <TableHead className="min-w-[160px]">Partenaire</TableHead>
                  <TableHead className="w-[110px] text-right">TTC</TableHead>
                  <TableHead className="w-[70px] hidden lg:table-cell text-center">
                    TVA
                  </TableHead>
                  <TableHead className="w-[100px] hidden xl:table-cell">
                    PCG
                  </TableHead>
                  <TableHead className="hidden md:table-cell">
                    Signaux
                  </TableHead>
                  <TableHead className="w-[120px] text-right">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>{tableRows.map(row => renderTableRow(row))}</TableBody>
            </Table>
          </div>
        )}
        renderCard={renderCard}
      />

      {/* Dialogs */}
      <ClotureVatPcgDialog
        row={vatPcgRow}
        open={vatPcgOpen}
        onOpenChange={open => {
          setVatPcgOpen(open);
          if (!open) setVatPcgRow(null);
        }}
        onSaved={onRefresh}
      />

      <ClotureUploadDialog
        row={uploadRow}
        open={uploadOpen}
        onOpenChange={open => {
          setUploadOpen(open);
          if (!open) setUploadRow(null);
        }}
        onUploadComplete={onRefresh}
      />
    </>
  );
}

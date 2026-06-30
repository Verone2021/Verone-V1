'use client';

/**
 * Section « justificatifs manquants » actionnable de la Bibliothèque [BO-COMPTA-001]
 *
 * Chaque ligne manquante affiche son signal de statut + des boutons pour
 * déposer la pièce et corriger la TVA / le code comptable, directement.
 */

import { Badge, Button } from '@verone/ui';
import { AlertCircle, Edit2, Upload } from 'lucide-react';

import { ClotureRowSignals } from '../../_shared-comptable/cloture-row-signals';
import type { ClotureRow } from '../../_shared-comptable/types';

interface MissingDocumentsSectionProps {
  /** Lignes déjà filtrées sur kind === 'missing' */
  rows: ClotureRow[];
  onUpload: (row: ClotureRow) => void;
  onEditVatPcg: (row: ClotureRow) => void;
}

function formatMoney(v: number | null): string {
  if (v == null) return '—';
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  }).format(v);
}

function formatDate(d: string | null): string {
  if (!d) return '';
  return new Date(d).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
  });
}

export function MissingDocumentsSection({
  rows,
  onUpload,
  onEditVatPcg,
}: MissingDocumentsSectionProps) {
  if (rows.length === 0) return null;

  return (
    <div className="mt-6 border-t pt-4">
      <div className="flex items-center gap-2 mb-3 px-1">
        <AlertCircle className="h-4 w-4 text-amber-500" />
        <p className="text-sm font-medium text-amber-700">
          {rows.length} justificatif{rows.length > 1 ? 's' : ''} manquant
          {rows.length > 1 ? 's' : ''}
        </p>
      </div>

      <div className="space-y-1">
        {rows.map(row => (
          <div
            key={`${row.id}-${row.kind}`}
            className="flex items-center justify-between gap-3 px-3 py-2 rounded-md bg-amber-50 border border-amber-100 text-sm"
          >
            {/* Infos pièce */}
            <div className="flex items-center gap-3 min-w-0">
              <Badge
                variant="outline"
                className="text-[10px] px-1.5 py-0 bg-amber-100 text-amber-700 border-amber-200 flex-shrink-0"
              >
                {row.document_direction === 'inbound' ? 'Achat' : 'Vente'}
              </Badge>
              <span className="font-medium truncate">
                {row.partner_name ?? '—'}
              </span>
              {row.document_number && (
                <span className="text-muted-foreground truncate hidden md:inline">
                  {row.document_number}
                </span>
              )}
              <span className="text-muted-foreground hidden lg:inline">
                {formatDate(row.document_date)}
              </span>
            </div>

            {/* Statut + montant + actions */}
            <div className="flex items-center gap-3 flex-shrink-0">
              <div className="hidden sm:block">
                <ClotureRowSignals signals={row.signals} />
              </div>
              <span className="font-medium tabular-nums">
                {formatMoney(row.total_ttc)}
              </span>
              {row.transaction_id && (
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9"
                    title="Déposer la pièce"
                    onClick={() => onUpload(row)}
                  >
                    <Upload className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9"
                    title="Corriger TVA / code comptable"
                    onClick={() => onEditVatPcg(row)}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

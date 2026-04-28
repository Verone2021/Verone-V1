'use client';

/**
 * SupplierPoCompactCard — col 2 du dashboard. Affiche le fournisseur unique
 * du produit + la dernière PO reçue (ref, date, montant, statut).
 * Inclut également les champs fournisseur : référence produit, URL page
 * fournisseur, et MOQ.
 */

import { useState, useCallback } from 'react';

import Link from 'next/link';

import { Badge, Input } from '@verone/ui';
import { formatPrice, cn } from '@verone/utils';
import { Building2, Check, ExternalLink, Info, Pencil, X } from 'lucide-react';

interface LastPo {
  id: string;
  reference: string | null;
  purchasedAt: string | null;
  total: number | null;
  status: string | null;
}

interface SupplierPoCompactCardProps {
  supplierId: string | null;
  supplierName: string | null;
  supplierSiret: string | null;
  lastPo: LastPo | null;
  supplierReference: string | null;
  supplierPageUrl: string | null;
  supplierMoq: number | null;
  onUpdateSupplierFields?: (updates: {
    supplier_reference?: string | null;
    supplier_page_url?: string | null;
    supplier_moq?: number | null;
  }) => Promise<void>;
}

// Champ texte inline compact réutilisable dans cette card
interface InlineRowTextProps {
  label: string;
  value: string;
  placeholder?: string;
  onSave: (value: string) => void;
}

function InlineRowText({
  label,
  value,
  placeholder,
  onSave,
}: InlineRowTextProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  const handleSave = useCallback(() => {
    onSave(draft.trim());
    setEditing(false);
  }, [draft, onSave]);

  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-neutral-500 text-xs shrink-0">{label}</span>
      {editing ? (
        <div className="flex items-center gap-1 flex-1 justify-end">
          <Input
            autoFocus
            value={draft}
            placeholder={placeholder}
            onChange={e => setDraft(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') handleSave();
              if (e.key === 'Escape') {
                setDraft(value);
                setEditing(false);
              }
            }}
            className="h-6 text-xs px-1.5 w-28"
          />
          <button
            onClick={handleSave}
            className="h-11 w-11 md:h-6 md:w-6 flex items-center justify-center rounded text-green-600 hover:bg-green-50"
            aria-label="Valider"
          >
            <Check className="h-3 w-3" />
          </button>
          <button
            onClick={() => {
              setDraft(value);
              setEditing(false);
            }}
            className="h-11 w-11 md:h-6 md:w-6 flex items-center justify-center rounded text-neutral-400 hover:bg-neutral-100"
            aria-label="Annuler"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      ) : (
        <button
          onClick={() => {
            setDraft(value);
            setEditing(true);
          }}
          className={cn(
            'group flex items-center gap-1 text-xs text-right',
            value ? 'text-neutral-900 font-mono' : 'text-neutral-400 italic'
          )}
        >
          {value || (placeholder ?? '—')}
          <Pencil className="h-2.5 w-2.5 text-neutral-300 group-hover:text-neutral-500 transition-colors flex-shrink-0" />
        </button>
      )}
    </div>
  );
}

// Champ number inline compact
interface InlineRowNumberProps {
  label: string;
  value: number | null;
  onSave: (value: number | null) => void;
}

function InlineRowNumber({ label, value, onSave }: InlineRowNumberProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(value ?? ''));

  const handleSave = useCallback(() => {
    const parsed = parseInt(draft, 10);
    onSave(isNaN(parsed) ? null : parsed);
    setEditing(false);
  }, [draft, onSave]);

  const displayText =
    value != null ? `${value} unité${value > 1 ? 's' : ''}` : '1 unité';

  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-neutral-500 text-xs shrink-0">{label}</span>
      {editing ? (
        <div className="flex items-center gap-1 flex-1 justify-end">
          <Input
            autoFocus
            type="number"
            min={1}
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') handleSave();
              if (e.key === 'Escape') {
                setDraft(String(value ?? ''));
                setEditing(false);
              }
            }}
            className="h-6 text-xs px-1.5 w-20"
          />
          <button
            onClick={handleSave}
            className="h-11 w-11 md:h-6 md:w-6 flex items-center justify-center rounded text-green-600 hover:bg-green-50"
            aria-label="Valider"
          >
            <Check className="h-3 w-3" />
          </button>
          <button
            onClick={() => {
              setDraft(String(value ?? ''));
              setEditing(false);
            }}
            className="h-11 w-11 md:h-6 md:w-6 flex items-center justify-center rounded text-neutral-400 hover:bg-neutral-100"
            aria-label="Annuler"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      ) : (
        <button
          onClick={() => {
            setDraft(String(value ?? ''));
            setEditing(true);
          }}
          className="group flex items-center gap-1 text-xs text-neutral-900 tabular-nums"
        >
          {displayText}
          <Pencil className="h-2.5 w-2.5 text-neutral-300 group-hover:text-neutral-500 transition-colors flex-shrink-0" />
        </button>
      )}
    </div>
  );
}

export function SupplierPoCompactCard({
  supplierId,
  supplierName,
  supplierSiret,
  lastPo,
  supplierReference,
  supplierPageUrl,
  supplierMoq,
  onUpdateSupplierFields,
}: SupplierPoCompactCardProps) {
  return (
    <section className="bg-white rounded-lg border border-neutral-200 p-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold text-neutral-900">
          Fournisseur · Dernière PO
        </h3>
        <span
          className="text-[10px] text-neutral-400 inline-flex items-center gap-1"
          title="1 produit = 1 fournisseur unique"
        >
          <Info className="h-3 w-3" />1 · 1
        </span>
      </div>

      {supplierId ? (
        <>
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded bg-neutral-100 flex items-center justify-center shrink-0">
              <Building2 className="h-5 w-5 text-neutral-400" />
            </div>
            <div className="min-w-0 flex-1">
              <Link
                href={`/contacts-organisations/suppliers/${supplierId}`}
                className="text-sm font-medium text-neutral-900 hover:underline truncate block"
              >
                {supplierName ?? 'Fournisseur inconnu'}
              </Link>
              {supplierSiret && (
                <p className="text-[11px] text-neutral-500 font-mono">
                  SIRET {supplierSiret}
                </p>
              )}
            </div>
          </div>

          {/* Champs fournisseur produit */}
          <div className="mt-3 pt-3 border-t border-neutral-100 space-y-1.5">
            <InlineRowText
              label="Réf fournisseur"
              value={supplierReference ?? ''}
              placeholder="—"
              onSave={val => {
                void onUpdateSupplierFields?.({
                  supplier_reference: val || null,
                }).catch(err => {
                  console.error(
                    '[SupplierPoCompactCard] save ref failed:',
                    err
                  );
                });
              }}
            />
            <InlineRowNumber
              label="MOQ"
              value={supplierMoq}
              onSave={val => {
                void onUpdateSupplierFields?.({
                  supplier_moq: val,
                }).catch(err => {
                  console.error(
                    '[SupplierPoCompactCard] save moq failed:',
                    err
                  );
                });
              }}
            />
            <div className="flex items-center justify-between gap-2">
              <span className="text-neutral-500 text-xs shrink-0">
                Page fournisseur
              </span>
              {supplierPageUrl ? (
                <a
                  href={supplierPageUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-600 hover:text-blue-800 inline-flex items-center gap-1 truncate max-w-[140px]"
                  title={supplierPageUrl}
                >
                  Voir chez le fournisseur
                  <ExternalLink className="h-3 w-3 flex-shrink-0" />
                </a>
              ) : (
                <span className="text-xs text-neutral-400 italic">
                  Pas d&apos;URL fournisseur
                </span>
              )}
            </div>
          </div>
        </>
      ) : (
        <p className="text-sm text-neutral-400 italic">
          Aucun fournisseur assigné
        </p>
      )}

      {lastPo && (
        <div className="mt-3 pt-3 border-t border-neutral-100 space-y-1.5 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-neutral-500 text-xs">Ref PO</span>
            <span className="font-mono text-xs text-neutral-900">
              {lastPo.reference ?? '—'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-neutral-500 text-xs">Date</span>
            <span className="text-xs text-neutral-900 tabular-nums">
              {lastPo.purchasedAt
                ? new Date(lastPo.purchasedAt).toLocaleDateString('fr-FR')
                : '—'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-neutral-500 text-xs">Montant</span>
            <span className="text-xs text-neutral-900 font-semibold tabular-nums">
              {lastPo.total != null ? formatPrice(lastPo.total) : '—'}
            </span>
          </div>
          {lastPo.status && (
            <div className="flex items-center justify-between">
              <span className="text-neutral-500 text-xs">Statut</span>
              <Badge variant="outline" className="text-[10px]">
                {lastPo.status}
              </Badge>
            </div>
          )}
        </div>
      )}

      {supplierId && (
        <Link
          href={`/contacts-organisations/suppliers/${supplierId}`}
          className="mt-3 text-xs text-neutral-600 underline hover:text-neutral-900 inline-flex items-center gap-1"
        >
          Voir la fiche fournisseur
          <ExternalLink className="h-3 w-3" />
        </Link>
      )}
    </section>
  );
}

'use client';

/**
 * SupplierPoCompactCard — col 2 du dashboard. Affiche le fournisseur unique
 * du produit + la dernière PO reçue (ref, date, montant, statut).
 * Champs fournisseur produit éditables : référence produit + URL page
 * fournisseur. Le MOQ s'édite uniquement depuis l'onglet Stock
 * (Paramètres stock) pour éviter la duplication.
 * Affiche aussi le drapeau pays + site internet du fournisseur.
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
  supplierWebsite: string | null;
  supplierCountry: string | null;
  lastPo: LastPo | null;
  supplierReference: string | null;
  supplierPageUrl: string | null;
  onUpdateSupplierFields?: (updates: {
    supplier_reference?: string | null;
    supplier_page_url?: string | null;
  }) => Promise<void>;
}

/** Convertit un code pays ISO 3166-1 alpha-2 en emoji drapeau. */
function countryCodeToFlag(code: string | null): string | null {
  if (code?.length !== 2) return null;
  const upper = code.toUpperCase();
  // Décale chaque lettre A-Z vers la zone des Regional Indicator Symbols
  return String.fromCodePoint(
    ...upper.split('').map(c => 0x1f1e6 + c.charCodeAt(0) - 65)
  );
}

/** Normalise une URL : ajoute https:// si manquant. */
function normalizeUrl(url: string): string {
  if (!url) return url;
  if (/^https?:\/\//i.test(url)) return url;
  return `https://${url}`;
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

export function SupplierPoCompactCard({
  supplierId,
  supplierName,
  supplierWebsite,
  supplierCountry,
  lastPo,
  supplierReference,
  supplierPageUrl,
  onUpdateSupplierFields,
}: SupplierPoCompactCardProps) {
  const flag = countryCodeToFlag(supplierCountry);
  const websiteHref = supplierWebsite ? normalizeUrl(supplierWebsite) : null;
  const websiteLabel = supplierWebsite
    ? supplierWebsite.replace(/^https?:\/\//i, '').replace(/\/$/, '')
    : null;
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
                className="text-sm font-medium text-neutral-900 hover:underline flex items-center gap-1.5"
              >
                {flag && (
                  <span
                    className="text-base leading-none shrink-0"
                    aria-label={`Pays : ${supplierCountry}`}
                    title={supplierCountry ?? undefined}
                  >
                    {flag}
                  </span>
                )}
                <span className="truncate">
                  {supplierName ?? 'Fournisseur inconnu'}
                </span>
              </Link>
              {websiteHref && websiteLabel && (
                <a
                  href={websiteHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1 mt-0.5 max-w-full"
                  title={websiteHref}
                >
                  <span className="truncate">{websiteLabel}</span>
                  <ExternalLink className="h-3 w-3 flex-shrink-0" />
                </a>
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
            <InlineRowText
              label="Page fournisseur"
              value={supplierPageUrl ?? ''}
              placeholder="—"
              onSave={val => {
                const trimmed = val.trim();
                const stored = trimmed ? normalizeUrl(trimmed) : null;
                void onUpdateSupplierFields?.({
                  supplier_page_url: stored,
                }).catch(err => {
                  console.error(
                    '[SupplierPoCompactCard] save page url failed:',
                    err
                  );
                });
              }}
            />
            {supplierPageUrl && (
              <div className="flex items-center justify-end">
                <a
                  href={normalizeUrl(supplierPageUrl)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] text-blue-600 hover:text-blue-800 inline-flex items-center gap-1"
                  title={supplierPageUrl}
                >
                  Voir la page produit
                  <ExternalLink className="h-3 w-3 flex-shrink-0" />
                </a>
              </div>
            )}
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

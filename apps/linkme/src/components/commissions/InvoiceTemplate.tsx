/**
 * InvoiceTemplate
 * Modèle de facture pré-rempli pour les commissions affiliés
 *
 * Conforme aux exigences légales françaises 2025 pour factures d'apporteur d'affaires
 * Libellé légal : "Commission sur ventes - Apport d'affaires"
 *
 * @module InvoiceTemplate
 * @since 2025-12-11
 */

'use client';

import { useMemo, useRef, useState } from 'react';

import { Copy, FileText, CheckCircle2 } from 'lucide-react';

import type {
  CommissionItem,
  AffiliateInvoiceInfo,
} from '../../types/analytics';
import {
  formatCurrency,
  formatDateFR,
  VERONE_LEGAL_INFO,
} from '../../types/analytics';

interface InvoiceTemplateProps {
  /** Informations de l'affilié émetteur */
  affiliate: AffiliateInvoiceInfo;
  /** Commissions à inclure dans la facture */
  commissions: CommissionItem[];
  /** Taux de TVA (défaut: 0.20 = 20%) */
  taxRate?: number;
  /** Numéro de facture suggéré */
  suggestedInvoiceNumber?: string;
  /** Afficher les actions (copier, télécharger) */
  showActions?: boolean;
}

/**
 * Composant InvoiceTemplate - Affiche un modèle de facture pré-rempli
 */
export function InvoiceTemplate({
  affiliate,
  commissions,
  taxRate = 0.2,
  suggestedInvoiceNumber,
  showActions = true,
}: InvoiceTemplateProps) {
  const invoiceRef = useRef<HTMLDivElement>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Note: suggestedInvoiceNumber n'est plus utilisé car le numéro est à compléter par le client
  void suggestedInvoiceNumber;

  // Calculs des montants
  const totals = useMemo(() => {
    const totalHT = commissions.reduce(
      (sum, c) => sum + (c.affiliateCommission || 0),
      0
    );
    const tva = totalHT * taxRate;
    const totalTTC = totalHT + tva;
    return { totalHT, tva, totalTTC };
  }, [commissions, taxRate]);

  // Copier la désignation (libellé + détail commandes)
  const handleCopyDesignation = async () => {
    const lines = [
      "Commission sur ventes - Apport d'affaires",
      '',
      ...commissions.map(
        c =>
          `• Commande #${c.orderNumber} - ${c.selectionName || 'Sélection'} : ${formatCurrency(c.affiliateCommission)}`
      ),
    ];
    try {
      await navigator.clipboard.writeText(lines.join('\n'));
      setCopiedField('designation');
      setTimeout(() => setCopiedField(null), 2000);
    } catch {
      console.error('Erreur copie');
    }
  };

  // Copier le montant TTC
  const handleCopyMontant = async () => {
    try {
      await navigator.clipboard.writeText(formatCurrency(totals.totalTTC));
      setCopiedField('montant');
      setTimeout(() => setCopiedField(null), 2000);
    } catch {
      console.error('Erreur copie');
    }
  };

  // Copier le destinataire (Vérone)
  const handleCopyDestinataire = async () => {
    const lines = [
      VERONE_LEGAL_INFO.name,
      VERONE_LEGAL_INFO.address,
      `${VERONE_LEGAL_INFO.postalCode} ${VERONE_LEGAL_INFO.city}`,
      `SIRET : ${VERONE_LEGAL_INFO.siret}`,
    ];
    try {
      await navigator.clipboard.writeText(lines.join('\n'));
      setCopiedField('destinataire');
      setTimeout(() => setCopiedField(null), 2000);
    } catch {
      console.error('Erreur copie');
    }
  };

  return (
    <div className="space-y-4">
      {/* Actions - Boutons de copie */}
      {showActions && (
        <div className="flex flex-wrap items-center gap-2 justify-end print:hidden">
          <button
            onClick={() => {
              void handleCopyDestinataire().catch(error => {
                console.error(
                  '[InvoiceTemplate] Copy destinataire failed:',
                  error
                );
              });
            }}
            className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            {copiedField === 'destinataire' ? (
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
            {copiedField === 'destinataire' ? 'Copié !' : 'Copier destinataire'}
          </button>
          <button
            onClick={() => {
              void handleCopyDesignation().catch(error => {
                console.error(
                  '[InvoiceTemplate] Copy designation failed:',
                  error
                );
              });
            }}
            className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            {copiedField === 'designation' ? (
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            ) : (
              <FileText className="h-4 w-4" />
            )}
            {copiedField === 'designation' ? 'Copié !' : 'Copier désignation'}
          </button>
          <button
            onClick={() => {
              void handleCopyMontant().catch(error => {
                console.error('[InvoiceTemplate] Copy montant failed:', error);
              });
            }}
            className="flex items-center gap-2 px-3 py-1.5 text-sm text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors font-medium"
          >
            {copiedField === 'montant' ? (
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
            {copiedField === 'montant' ? 'Copié !' : 'Copier montant TTC'}
          </button>
        </div>
      )}

      {/* Template visuel */}
      <div
        ref={invoiceRef}
        className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm font-mono text-sm print:shadow-none print:border-none"
      >
        {/* Header */}
        <div className="text-center border-b-2 border-gray-800 pb-4 mb-6">
          <h2 className="text-xl font-bold text-gray-900 tracking-wide">
            FACTURE DE COMMISSION
          </h2>
          <p className="text-xs text-gray-500 mt-1">Apport d&apos;affaires</p>
        </div>

        {/* Infos facture */}
        <div className="flex justify-between mb-6">
          <div>
            <p className="text-xs text-gray-500">N° Facture</p>
            <p className="font-semibold text-orange-500 italic">
              [À compléter]
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500">Date</p>
            <p className="font-semibold text-orange-500 italic">
              [À compléter]
            </p>
          </div>
        </div>

        {/* Deux colonnes : Émetteur / Destinataire */}
        <div className="grid grid-cols-2 gap-6 mb-6">
          {/* Émetteur */}
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <p className="text-xs font-semibold text-gray-500 uppercase mb-2">
              Émetteur
            </p>
            <p className="font-semibold text-gray-900">{affiliate.name}</p>
            <p className="text-gray-600 text-xs">{affiliate.email}</p>
            {affiliate.address ? (
              <p className="text-gray-600 text-xs mt-1">{affiliate.address}</p>
            ) : (
              <p className="text-orange-500 text-xs mt-1 italic">
                [Adresse à compléter]
              </p>
            )}
            {affiliate.siret ? (
              <p className="text-gray-600 text-xs">SIRET : {affiliate.siret}</p>
            ) : (
              <p className="text-gray-400 text-xs italic">
                SIRET : [Si applicable]
              </p>
            )}
          </div>

          {/* Destinataire */}
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <p className="text-xs font-semibold text-blue-600 uppercase mb-2">
              Destinataire
            </p>
            <p className="font-semibold text-gray-900">
              {VERONE_LEGAL_INFO.name}
            </p>
            <p className="text-gray-600 text-xs">{VERONE_LEGAL_INFO.address}</p>
            <p className="text-gray-600 text-xs">
              {VERONE_LEGAL_INFO.postalCode} {VERONE_LEGAL_INFO.city}
            </p>
            <p className="text-gray-600 text-xs">
              SIRET : {VERONE_LEGAL_INFO.siret}
            </p>
          </div>
        </div>

        {/* Tableau des lignes */}
        <div className="border border-gray-200 rounded-lg overflow-hidden mb-6">
          <table className="w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">
                  Désignation
                </th>
                <th className="px-4 py-2 text-right text-xs font-semibold text-gray-700">
                  Montant HT
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              <tr>
                <td
                  colSpan={2}
                  className="px-4 py-2 bg-gray-50 text-xs font-medium text-gray-700"
                >
                  Commission sur ventes - Apport d&apos;affaires (Compte 7082)
                </td>
              </tr>
              {commissions.map(c => (
                <tr key={c.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2 text-xs text-gray-600">
                    <span className="text-gray-400">•</span> Commande #
                    {c.orderNumber}
                    {c.selectionName && (
                      <span className="text-gray-400 ml-1">
                        ({c.selectionName})
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-2 text-xs text-right font-medium text-gray-900">
                    {formatCurrency(c.affiliateCommission)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totaux */}
        <div className="flex justify-end">
          <div className="w-64 space-y-1">
            <div className="flex justify-between py-1 border-b border-gray-200">
              <span className="text-xs text-gray-600">Total HT</span>
              <span className="text-sm font-medium">
                {formatCurrency(totals.totalHT)}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-gray-200">
              <span className="text-xs text-gray-600">
                TVA {(taxRate * 100).toFixed(0)}%
              </span>
              <span className="text-sm font-medium">
                {formatCurrency(totals.tva)}
              </span>
            </div>
            <div className="flex justify-between py-2 bg-emerald-50 px-2 rounded">
              <span className="text-sm font-bold text-emerald-800">
                TOTAL TTC
              </span>
              <span className="text-lg font-bold text-emerald-600">
                {formatCurrency(totals.totalTTC)}
              </span>
            </div>
          </div>
        </div>

        {/* Coordonnées bancaires */}
        <div className="mt-6 pt-4 border-t border-gray-200">
          <p className="text-xs font-semibold text-gray-500 uppercase mb-2">
            Coordonnées bancaires pour le virement
          </p>
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-gray-500">IBAN : </span>
              {affiliate.iban ? (
                <span className="font-mono">{affiliate.iban}</span>
              ) : (
                <span className="text-orange-500 italic">[À compléter]</span>
              )}
            </div>
            <div>
              <span className="text-gray-500">BIC : </span>
              {affiliate.bic ? (
                <span className="font-mono">{affiliate.bic}</span>
              ) : (
                <span className="text-orange-500 italic">[À compléter]</span>
              )}
            </div>
          </div>
        </div>

        {/* Note TVA */}
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-xs text-yellow-800">
            <strong>Note :</strong> Si vous êtes auto-entrepreneur en franchise
            de TVA, mentionnez sur votre facture :{' '}
            <em>&quot;TVA non applicable, art. 293 B du CGI&quot;</em> et
            indiquez 0,00 € pour la TVA.
          </p>
        </div>
      </div>
    </div>
  );
}

export default InvoiceTemplate;

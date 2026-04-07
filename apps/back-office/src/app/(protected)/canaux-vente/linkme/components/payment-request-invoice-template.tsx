'use client';

import { formatPrice } from '@verone/utils';
import { CheckCircle2, FileText, Copy } from 'lucide-react';

import {
  VERONE_LEGAL_INFO,
  type CommissionForModal,
} from './use-payment-request';

interface InvoiceTemplateTotals {
  totalHT: number;
  totalTTC: number;
}

interface PaymentRequestInvoiceTemplateProps {
  selectedCommissions: CommissionForModal[];
  affiliateName: string;
  totals: InvoiceTemplateTotals;
  copiedField: string | null;
  onCopyDestinataire: () => void;
  onCopyDesignation: () => void;
  onCopyMontant: () => void;
}

export function PaymentRequestInvoiceTemplate({
  selectedCommissions,
  affiliateName,
  totals,
  copiedField,
  onCopyDestinataire,
  onCopyDesignation,
  onCopyMontant,
}: PaymentRequestInvoiceTemplateProps) {
  return (
    <div className="space-y-4">
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
        <p className="text-sm text-yellow-800">
          <strong>Important :</strong> Ce modèle montre les informations que
          l&apos;affilié devra inclure dans sa facture. Vous pouvez copier ces
          informations pour les lui transmettre.
        </p>
      </div>

      {/* Actions de copie */}
      <div className="flex flex-wrap items-center gap-2 justify-end">
        <button
          onClick={onCopyDestinataire}
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
          onClick={onCopyDesignation}
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
          onClick={onCopyMontant}
          className="flex items-center gap-2 px-3 py-1.5 text-sm text-emerald-600 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors font-medium"
        >
          {copiedField === 'montant' ? (
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          ) : (
            <Copy className="h-4 w-4" />
          )}
          {copiedField === 'montant' ? 'Copié !' : 'Copier montant TTC'}
        </button>
      </div>

      {/* Template visuel */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm font-mono text-sm">
        {/* Header */}
        <div className="text-center border-b-2 border-gray-800 pb-4 mb-6">
          <h2 className="text-xl font-bold text-gray-900 tracking-wide">
            FACTURE DE COMMISSION
          </h2>
          <p className="text-xs text-gray-500 mt-1">Apport d&apos;affaires</p>
        </div>

        {/* Deux colonnes */}
        <div className="grid grid-cols-2 gap-6 mb-6">
          {/* Émetteur */}
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <p className="text-xs font-semibold text-gray-500 uppercase mb-2">
              Émetteur
            </p>
            <p className="font-semibold text-gray-900">{affiliateName}</p>
            <p className="text-orange-500 text-xs mt-1 italic">
              [Adresse à compléter par l&apos;affilié]
            </p>
            <p className="text-gray-400 text-xs italic">
              SIRET : [Si applicable]
            </p>
          </div>

          {/* Destinataire */}
          <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-200">
            <p className="text-xs font-semibold text-emerald-600 uppercase mb-2">
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
              {selectedCommissions.map(c => (
                <tr key={c.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2 text-xs text-gray-600">
                    <span className="text-gray-400">•</span> Commande #
                    {c.sales_order?.order_number ??
                      c.order_number ??
                      c.id.slice(0, 8)}
                  </td>
                  <td className="px-4 py-2 text-xs text-right font-medium text-gray-900">
                    {formatPrice(c.total_payout_ht ?? c.affiliate_commission)}
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
                {formatPrice(totals.totalHT)}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-gray-200">
              <span className="text-xs text-gray-600">TVA 20%</span>
              <span className="text-sm font-medium">
                {formatPrice(totals.totalTTC - totals.totalHT)}
              </span>
            </div>
            <div className="flex justify-between py-2 bg-emerald-50 px-2 rounded">
              <span className="text-sm font-bold text-emerald-800">
                TOTAL TTC
              </span>
              <span className="text-lg font-bold text-emerald-600">
                {formatPrice(totals.totalTTC)}
              </span>
            </div>
          </div>
        </div>

        {/* Note TVA */}
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-xs text-yellow-800">
            <strong>Note :</strong> Si l&apos;affilié est auto-entrepreneur en
            franchise de TVA, il doit mentionner sur sa facture :{' '}
            <em>&quot;TVA non applicable, art. 293 B du CGI&quot;</em> et
            indiquer 0,00 € pour la TVA.
          </p>
        </div>
      </div>
    </div>
  );
}

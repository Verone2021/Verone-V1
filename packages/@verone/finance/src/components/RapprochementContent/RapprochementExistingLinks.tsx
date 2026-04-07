'use client';

import { formatCurrency } from '@verone/utils';
import { Link2, Link2Off, Loader2 } from 'lucide-react';

import type { ExistingLink } from './types';

interface RapprochementExistingLinksProps {
  links: ExistingLink[];
  isDebitSide: boolean;
  unlinkingId: string | null;
  onUnlink: (linkId: string) => void;
}

export function RapprochementExistingLinks({
  links,
  isDebitSide,
  unlinkingId,
  onUnlink,
}: RapprochementExistingLinksProps) {
  if (links.length === 0) return null;

  return (
    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
      <div className="flex items-center gap-2 mb-2">
        <Link2 className="h-4 w-4 text-blue-600" />
        <span className="text-sm font-medium text-blue-800">
          Transactions liées ({links.length})
        </span>
      </div>
      <div className="space-y-1.5">
        {links.map(link => (
          <div
            key={link.id}
            className="flex items-center justify-between p-2 bg-white rounded border text-sm"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <Link2 className="h-3.5 w-3.5 text-blue-600 flex-shrink-0" />
                <span className="font-medium truncate">
                  {link.counterparty_name ?? link.transaction_label}
                </span>
                <span
                  className={`font-bold ${isDebitSide ? 'text-red-700' : 'text-blue-700'}`}
                >
                  {isDebitSide ? '-' : ''}
                  {formatCurrency(Math.abs(link.allocated_amount))}
                </span>
              </div>
              <div className="text-xs text-slate-500 ml-5.5 flex gap-2">
                <span>
                  {new Date(link.transaction_date).toLocaleDateString('fr-FR')}
                </span>
                {link.bank_provider && <span>{link.bank_provider}</span>}
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                void Promise.resolve(onUnlink(link.id)).catch(
                  (err: unknown) => {
                    console.error(
                      '[RapprochementExistingLinks] Unlink failed:',
                      err
                    );
                  }
                );
              }}
              disabled={unlinkingId === link.id}
              className="ml-2 p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
              title="Délier cette transaction"
            >
              {unlinkingId === link.id ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Link2Off className="h-3.5 w-3.5" />
              )}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

'use client';

import {
  CheckCircle2,
  Check,
  Package,
  Building2,
  FileText,
  X,
} from 'lucide-react';

import { formatAmount } from './utils';
import type { ExistingLink } from './types';

interface ExistingLinksPanelProps {
  existingLinks: ExistingLink[];
  totalAllocated: number;
  remainingAmount: number;
  onUnlink: (linkId: string) => Promise<void>;
}

export function ExistingLinksPanel({
  existingLinks,
  totalAllocated,
  remainingAmount,
  onUnlink,
}: ExistingLinksPanelProps) {
  if (existingLinks.length === 0) return null;

  return (
    <div className="p-2 bg-blue-50 border border-blue-200 rounded-lg">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-1.5">
          <CheckCircle2 className="h-3.5 w-3.5 text-blue-600" />
          <span className="text-xs font-medium text-blue-800">
            Deja rapproche ({existingLinks.length})
          </span>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <span className="font-semibold text-blue-700">
            {formatAmount(totalAllocated)}
          </span>
          {remainingAmount > 0.01 ? (
            <span className="font-bold text-amber-600">
              Reste: {formatAmount(remainingAmount)}
            </span>
          ) : (
            <span className="flex items-center gap-1 font-medium text-green-700">
              <Check className="h-3 w-3" /> Complet
            </span>
          )}
        </div>
      </div>
      <div className="max-h-[120px] overflow-y-auto space-y-0.5">
        {existingLinks.map(link => (
          <div
            key={link.id}
            className="flex items-center justify-between py-1 px-1.5 bg-white rounded border border-blue-100 text-xs"
          >
            <div className="flex items-center gap-1.5 min-w-0">
              {link.link_type === 'sales_order' && (
                <Package className="h-3 w-3 text-blue-500 shrink-0" />
              )}
              {link.link_type === 'purchase_order' && (
                <Building2 className="h-3 w-3 text-orange-500 shrink-0" />
              )}
              {link.link_type === 'document' && (
                <FileText className="h-3 w-3 text-slate-500 shrink-0" />
              )}
              <span className="font-medium truncate">
                {link.order_number
                  ? `#${link.order_number}`
                  : link.po_number
                    ? `#${link.po_number}`
                    : (link.document_number ?? 'Document')}
              </span>
              {link.partner_name && (
                <span className="text-slate-400 truncate hidden sm:inline">
                  {link.partner_name}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="font-semibold text-blue-700">
                {formatAmount(link.allocated_amount)}
              </span>
              <button
                type="button"
                onClick={e => {
                  e.stopPropagation();
                  void onUnlink(link.id).catch(err => {
                    console.error('[RapprochementModal] Unlink failed:', err);
                  });
                }}
                className="p-0.5 rounded hover:bg-red-100 transition-colors"
                title="Supprimer ce rapprochement"
              >
                <X className="h-3 w-3 text-red-500" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

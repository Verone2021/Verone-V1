'use client';

import { Button, Input, ScrollArea } from '@verone/ui';
import { Search, FileText, Check, RefreshCw, Plus } from 'lucide-react';

import { formatAmount, formatDate } from './utils';
import type { FinancialDocument } from './types';

interface DocumentsTabProps {
  filteredDocuments: FinancialDocument[];
  isLoading: boolean;
  selectedDocumentId: string | null;
  searchQuery: string;
  onSearchChange: (v: string) => void;
  onSelectDocument: (docId: string, remaining: number) => void;
  remainingAmount: number;
  allocatedAmount: string;
  onAllocatedAmountChange: (v: string) => void;
  isLinking: boolean;
  onLink: () => void;
}

export function DocumentsTab({
  filteredDocuments,
  isLoading,
  selectedDocumentId,
  searchQuery,
  onSearchChange,
  onSelectDocument,
  remainingAmount,
  allocatedAmount,
  onAllocatedAmountChange,
  isLinking,
  onLink,
}: DocumentsTabProps) {
  return (
    <>
      {/* Recherche */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input
          placeholder="Rechercher par référence, organisation..."
          value={searchQuery}
          onChange={e => onSearchChange(e.target.value)}
          className="pl-9"
        />
      </div>

      <ScrollArea className="h-[220px]">
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <RefreshCw className="h-6 w-6 animate-spin text-slate-400" />
          </div>
        ) : filteredDocuments.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            <FileText className="h-10 w-10 mx-auto mb-2 opacity-50" />
            <p>Aucun document disponible</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredDocuments.map(doc => {
              const remaining = doc.total_ttc - doc.amount_paid;
              return (
                <div
                  key={doc.id}
                  onClick={() => onSelectDocument(doc.id, remaining)}
                  className={`
                    p-3 rounded-lg border cursor-pointer transition-colors
                    ${selectedDocumentId === doc.id ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:border-slate-300'}
                  `}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {selectedDocumentId === doc.id ? (
                        <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                          <Check className="h-4 w-4 text-blue-600" />
                        </div>
                      ) : (
                        <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center">
                          <FileText className="h-4 w-4 text-slate-500" />
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-sm">
                          {doc.document_number}
                        </p>
                        <p className="text-xs text-slate-500">
                          {doc.partner_name ?? 'Sans partenaire'} -{' '}
                          {formatDate(doc.document_date)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="font-semibold text-sm">
                        {formatAmount(doc.total_ttc)}
                      </span>
                      {doc.amount_paid > 0 && (
                        <p className="text-xs text-slate-500">
                          Reste: {formatAmount(remaining)}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </ScrollArea>

      {selectedDocumentId && (
        <div className="pt-4 border-t mt-4 space-y-3">
          <div>
            <label className="text-sm text-slate-600">
              Montant à allouer (€)
            </label>
            <Input
              type="number"
              step="0.01"
              placeholder={String(remainingAmount.toFixed(2))}
              value={allocatedAmount}
              onChange={e => onAllocatedAmountChange(e.target.value)}
              className="mt-1"
            />
          </div>
          <Button className="w-full" onClick={onLink} disabled={isLinking}>
            {isLinking ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Liaison...
              </>
            ) : (
              <>
                <Plus className="h-4 w-4 mr-2" />
                Ajouter ce document
              </>
            )}
          </Button>
        </div>
      )}
    </>
  );
}

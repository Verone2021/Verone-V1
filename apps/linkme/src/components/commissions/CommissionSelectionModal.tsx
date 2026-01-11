/**
 * CommissionSelectionModal
 * Modal pour sélectionner les commissions à inclure dans une demande de versement
 *
 * Alternative à la sélection via le tableau - accessible depuis le banner
 *
 * @module CommissionSelectionModal
 * @since 2026-01-10
 */

'use client';

import { useState, useMemo } from 'react';

import { Banknote, X, Check, Inbox } from 'lucide-react';

import { useAffiliateCommissions } from '../../lib/hooks/use-affiliate-commissions';
import type { CommissionStatus } from '../../types/analytics';
import { formatCurrency } from '../../types/analytics';

// Helper pour vérifier si une commission est payable
const isPayableStatus = (status: CommissionStatus | null): boolean =>
  status === 'validated' || status === 'payable';

interface ICommissionSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (selectedIds: string[]) => void;
}

export function CommissionSelectionModal({
  isOpen,
  onClose,
  onConfirm,
}: ICommissionSelectionModalProps): JSX.Element | null {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Récupérer les commissions
  const { data: commissions, isLoading } = useAffiliateCommissions();

  // Filtrer uniquement les payables
  const payableCommissions = useMemo(
    () => (commissions ?? []).filter(c => isPayableStatus(c.status)),
    [commissions]
  );

  // Total sélectionné
  const selectedTotal = useMemo(() => {
    return payableCommissions
      .filter(c => selectedIds.has(c.id))
      .reduce((sum, c) => sum + c.affiliateCommissionTTC, 0);
  }, [payableCommissions, selectedIds]);

  // Handlers sélection
  const handleSelect = (id: string): void => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Sélectionner tout
  const handleSelectAll = (): void => {
    if (selectedIds.size === payableCommissions.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(payableCommissions.map(c => c.id)));
    }
  };

  // Confirmer
  const handleConfirm = (): void => {
    onConfirm(Array.from(selectedIds));
    setSelectedIds(new Set());
    onClose();
  };

  // Fermer et reset
  const handleClose = (): void => {
    setSelectedIds(new Set());
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[80vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-teal-50 to-cyan-50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-teal-100 rounded-xl">
              <Banknote className="h-5 w-5 text-teal-600" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-gray-900">
                Sélectionnez vos commissions
              </h2>
              <p className="text-xs text-gray-500">
                {payableCommissions.length} commission
                {payableCommissions.length > 1 ? 's' : ''} payable
                {payableCommissions.length > 1 ? 's' : ''}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="animate-pulse h-12 bg-gray-100 rounded-lg"
                />
              ))}
            </div>
          ) : payableCommissions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400">
              <Inbox className="h-12 w-12 mb-3 opacity-50" />
              <p className="text-sm font-medium">Aucune commission payable</p>
              <p className="text-xs mt-1">
                Les commissions deviennent payables quand les commandes sont
                payées
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {/* Select all */}
              <button
                onClick={handleSelectAll}
                className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <span className="text-sm font-medium text-gray-700">
                  {selectedIds.size === payableCommissions.length
                    ? 'Tout désélectionner'
                    : 'Tout sélectionner'}
                </span>
                <div
                  className={`
                    w-5 h-5 rounded border-2 flex items-center justify-center
                    ${
                      selectedIds.size === payableCommissions.length
                        ? 'bg-teal-600 border-teal-600'
                        : 'border-gray-300'
                    }
                  `}
                >
                  {selectedIds.size === payableCommissions.length && (
                    <Check className="w-3 h-3 text-white" strokeWidth={3} />
                  )}
                </div>
              </button>

              {/* Liste des commissions */}
              {payableCommissions.map(commission => {
                const isSelected = selectedIds.has(commission.id);
                const date = commission.createdAt
                  ? new Date(commission.createdAt).toLocaleDateString('fr-FR', {
                      day: '2-digit',
                      month: 'short',
                    })
                  : '';

                return (
                  <button
                    key={commission.id}
                    onClick={() => handleSelect(commission.id)}
                    className={`
                      w-full flex items-center justify-between p-3 rounded-lg
                      transition-all border
                      ${
                        isSelected
                          ? 'bg-teal-50 border-teal-200'
                          : 'bg-white border-gray-100 hover:bg-gray-50'
                      }
                    `}
                  >
                    <div className="flex flex-col items-start">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-900">
                          #{commission.orderNumber}
                        </span>
                        <span className="text-xs text-gray-400">{date}</span>
                      </div>
                      <span className="text-xs text-gray-500">
                        {commission.customerName ?? commission.selectionName}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-semibold text-emerald-600">
                        {formatCurrency(commission.affiliateCommissionTTC)}
                      </span>
                      <div
                        className={`
                          w-5 h-5 rounded border-2 flex items-center justify-center
                          ${
                            isSelected
                              ? 'bg-teal-600 border-teal-600'
                              : 'border-gray-300'
                          }
                        `}
                      >
                        {isSelected && (
                          <Check
                            className="w-3 h-3 text-white"
                            strokeWidth={3}
                          />
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-gray-100 bg-gray-50">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-gray-600">
              {selectedIds.size} commission{selectedIds.size > 1 ? 's' : ''}{' '}
              sélectionnée{selectedIds.size > 1 ? 's' : ''}
            </span>
            <span className="text-lg font-bold text-emerald-600">
              {formatCurrency(selectedTotal)}
            </span>
          </div>
          <button
            onClick={handleConfirm}
            disabled={selectedIds.size === 0}
            className={`
              w-full flex items-center justify-center gap-2 py-3 rounded-xl
              font-semibold transition-all
              ${
                selectedIds.size > 0
                  ? 'bg-gradient-to-r from-teal-600 to-cyan-600 text-white hover:from-teal-700 hover:to-cyan-700 shadow-md'
                  : 'bg-gray-200 text-gray-500 cursor-not-allowed'
              }
            `}
          >
            <Banknote className="h-5 w-5" />
            {selectedIds.size > 0
              ? `Demander versement (${formatCurrency(selectedTotal)})`
              : 'Sélectionnez des commissions'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default CommissionSelectionModal;

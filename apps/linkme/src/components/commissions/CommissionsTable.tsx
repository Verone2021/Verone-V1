/**
 * CommissionsTable
 * Tableau des commissions avec filtrage par statut, pagination et sélection multiple
 *
 * Permet la sélection des commissions payables pour demander un versement
 *
 * @module CommissionsTable
 * @since 2025-12-10
 * @updated 2026-01-10 - Ajout pagination, fix statut payable
 */

'use client';

import { useState, useMemo } from 'react';

import {
  Card,
  Tab,
  TabGroup,
  TabList,
  TabPanels,
  TabPanel,
} from '@tremor/react';
import {
  Inbox,
  Banknote,
  Check,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

import type { CommissionItem, CommissionStatus } from '../../types/analytics';
import {
  formatCurrency,
  COMMISSION_STATUS_LABELS,
} from '../../types/analytics';

// ============================================
// CONSTANTS
// ============================================
const ITEMS_PER_PAGE = 15;

// Helper pour vérifier si une commission est payable
const isPayableStatus = (status: CommissionStatus | null): boolean =>
  status === 'validated' || status === 'payable';

interface ICommissionsTableProps {
  commissions: CommissionItem[];
  isLoading?: boolean;
  onRequestPayment?: (selectedIds: string[]) => void;
}

// ============================================
// SUB-COMPONENTS
// ============================================

// Badge de statut
function StatusBadge({ status }: { status: CommissionStatus }): JSX.Element {
  const colorClasses: Record<string, string> = {
    pending: 'bg-orange-100 text-orange-700',
    validated: 'bg-teal-100 text-teal-700',
    payable: 'bg-teal-100 text-teal-700',
    requested: 'bg-blue-100 text-blue-700',
    paid: 'bg-emerald-100 text-emerald-700',
    cancelled: 'bg-gray-100 text-gray-700',
  };

  return (
    <span
      className={`
        inline-flex items-center px-2 py-0.5 rounded-full
        text-[10px] font-medium
        ${colorClasses[status] ?? colorClasses.pending}
      `}
    >
      {COMMISSION_STATUS_LABELS[status] ?? status}
    </span>
  );
}

// Checkbox personnalisée
function Checkbox({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}): JSX.Element {
  return (
    <button
      type="button"
      onClick={() => !disabled && onChange(!checked)}
      disabled={disabled}
      className={`
        w-4 h-4 rounded border-2 flex items-center justify-center
        transition-all duration-200
        ${disabled ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'}
        ${
          checked
            ? 'bg-teal-600 border-teal-600'
            : 'bg-white border-gray-300 hover:border-teal-400'
        }
      `}
    >
      {checked && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
    </button>
  );
}

// Ligne du tableau avec checkbox
function CommissionRow({
  commission,
  isSelected,
  onSelect,
  showCheckbox,
}: {
  commission: CommissionItem;
  isSelected: boolean;
  onSelect: (id: string, selected: boolean) => void;
  showCheckbox: boolean;
}): JSX.Element {
  const date = commission.createdAt
    ? new Date(commission.createdAt).toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    : '-';

  const isPayable = isPayableStatus(commission.status);

  return (
    <tr
      className={`
        hover:bg-gray-50 transition-colors
        ${isSelected ? 'bg-teal-50/50' : ''}
      `}
    >
      {/* Checkbox - visible seulement pour payables */}
      {showCheckbox && (
        <td className="px-3 py-2.5 w-10">
          {isPayable ? (
            <Checkbox
              checked={isSelected}
              onChange={checked => onSelect(commission.id, checked)}
            />
          ) : (
            <div className="w-4 h-4" />
          )}
        </td>
      )}
      <td className="px-3 py-2.5 text-xs text-gray-600">{date}</td>
      <td className="px-3 py-2.5 text-xs font-medium text-gray-900">
        #{commission.orderNumber}
      </td>
      <td className="px-3 py-2.5 text-xs text-gray-600 max-w-[150px] truncate">
        {commission.customerName ?? commission.selectionName}
      </td>
      <td className="px-3 py-2.5 text-xs text-gray-600">
        {formatCurrency(commission.orderAmountHT)}
      </td>
      <td className="px-3 py-2.5 text-xs font-semibold text-emerald-600">
        {formatCurrency(commission.affiliateCommissionTTC)}
      </td>
      <td className="px-3 py-2.5">
        <StatusBadge status={commission.status} />
      </td>
    </tr>
  );
}

// Skeleton row
function SkeletonRow({ showCheckbox }: { showCheckbox: boolean }): JSX.Element {
  return (
    <tr className="animate-pulse">
      {showCheckbox && (
        <td className="px-3 py-2.5">
          <div className="h-4 w-4 bg-gray-200 rounded" />
        </td>
      )}
      <td className="px-3 py-2.5">
        <div className="h-3 bg-gray-200 rounded w-16" />
      </td>
      <td className="px-3 py-2.5">
        <div className="h-3 bg-gray-200 rounded w-20" />
      </td>
      <td className="px-3 py-2.5">
        <div className="h-3 bg-gray-200 rounded w-24" />
      </td>
      <td className="px-3 py-2.5">
        <div className="h-3 bg-gray-200 rounded w-16" />
      </td>
      <td className="px-3 py-2.5">
        <div className="h-3 bg-gray-200 rounded w-14" />
      </td>
      <td className="px-3 py-2.5">
        <div className="h-4 bg-gray-200 rounded-full w-16" />
      </td>
    </tr>
  );
}

// Empty state
function EmptyState({ message }: { message: string }): JSX.Element {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-gray-400">
      <Inbox className="h-10 w-10 mb-3 opacity-50" />
      <p className="text-sm">{message}</p>
    </div>
  );
}

// Pagination component
function Pagination({
  currentPage,
  totalPages,
  totalItems,
  onPageChange,
}: {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  onPageChange: (page: number) => void;
}): JSX.Element {
  const startItem = (currentPage - 1) * ITEMS_PER_PAGE + 1;
  const endItem = Math.min(currentPage * ITEMS_PER_PAGE, totalItems);

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 bg-gray-50/50">
      <span className="text-xs text-gray-500">
        Affichage {startItem}-{endItem} sur {totalItems}
      </span>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className={`
            p-1.5 rounded-lg transition-colors
            ${
              currentPage === 1
                ? 'text-gray-300 cursor-not-allowed'
                : 'text-gray-600 hover:bg-gray-100'
            }
          `}
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        {/* Page numbers */}
        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
          let pageNum: number;
          if (totalPages <= 5) {
            pageNum = i + 1;
          } else if (currentPage <= 3) {
            pageNum = i + 1;
          } else if (currentPage >= totalPages - 2) {
            pageNum = totalPages - 4 + i;
          } else {
            pageNum = currentPage - 2 + i;
          }

          return (
            <button
              key={pageNum}
              onClick={() => onPageChange(pageNum)}
              className={`
                w-8 h-8 text-xs rounded-lg transition-colors
                ${
                  currentPage === pageNum
                    ? 'bg-teal-600 text-white font-semibold'
                    : 'text-gray-600 hover:bg-gray-100'
                }
              `}
            >
              {pageNum}
            </button>
          );
        })}

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className={`
            p-1.5 rounded-lg transition-colors
            ${
              currentPage === totalPages
                ? 'text-gray-300 cursor-not-allowed'
                : 'text-gray-600 hover:bg-gray-100'
            }
          `}
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

export function CommissionsTable({
  commissions,
  isLoading,
  onRequestPayment,
}: ICommissionsTableProps): JSX.Element {
  const [selectedTab, setSelectedTab] = useState(0);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);

  // Reset page when tab changes
  const handleTabChange = (index: number): void => {
    setSelectedTab(index);
    setCurrentPage(1);
  };

  // Filtrer les commissions par onglet
  const filterByStatus = (
    status: CommissionStatus | 'all'
  ): CommissionItem[] => {
    if (status === 'all') return commissions;
    // Pour 'validated', inclure aussi 'payable'
    if (status === 'validated') {
      return commissions.filter(c => isPayableStatus(c.status));
    }
    return commissions.filter(c => c.status === status);
  };

  const tabs: { label: string; status: CommissionStatus | 'all' }[] = [
    { label: 'Toutes', status: 'all' },
    { label: 'Payables', status: 'validated' },
    { label: 'En attente', status: 'pending' },
    { label: 'Payées', status: 'paid' },
  ];

  // Compter par statut (inclut 'payable' dans validated)
  const counts = useMemo(
    () => ({
      all: commissions.length,
      pending: commissions.filter(c => c.status === 'pending').length,
      validated: commissions.filter(c => isPayableStatus(c.status)).length,
      paid: commissions.filter(c => c.status === 'paid').length,
    }),
    [commissions]
  );

  // Commissions payables (éligibles au versement) - inclut 'validated' ET 'payable'
  const payableCommissions = useMemo(
    () => commissions.filter(c => isPayableStatus(c.status)),
    [commissions]
  );

  // Total sélectionné
  const selectedTotal = useMemo(() => {
    return commissions
      .filter(c => selectedIds.has(c.id))
      .reduce((sum, c) => sum + c.affiliateCommissionTTC, 0);
  }, [commissions, selectedIds]);

  // Handlers sélection
  const handleSelect = (id: string, selected: boolean): void => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (selected) {
        next.add(id);
      } else {
        next.delete(id);
      }
      return next;
    });
  };

  // Sélectionner toutes les commissions payables (cross-page)
  const handleSelectAll = (checked: boolean): void => {
    if (checked) {
      setSelectedIds(new Set(payableCommissions.map(c => c.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  // Vérifier si toutes les payables sont sélectionnées
  const allPayableSelected =
    payableCommissions.length > 0 &&
    payableCommissions.every(c => selectedIds.has(c.id));

  // Afficher checkbox seulement si des commissions payables existent
  const showCheckbox = payableCommissions.length > 0;

  // Handler demande versement
  const handleRequestPayment = (): void => {
    if (onRequestPayment && selectedIds.size > 0) {
      onRequestPayment(Array.from(selectedIds));
    }
  };

  return (
    <Card className="p-0 overflow-hidden">
      {/* Header avec titre et bouton CTA */}
      <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h3 className="text-base font-semibold text-gray-900">
          Demandez vos commissions
        </h3>

        {/* Bouton CTA - TOUJOURS visible si commissions payables existent */}
        {payableCommissions.length > 0 && (
          <button
            onClick={handleRequestPayment}
            disabled={selectedIds.size === 0}
            className={`
              flex items-center justify-center gap-2 px-5 py-2.5
              text-sm font-semibold rounded-xl
              shadow-md transition-all duration-200
              ${
                selectedIds.size > 0
                  ? 'bg-gradient-to-r from-linkme-turquoise to-linkme-royal text-white hover:shadow-lg hover:scale-[1.02]'
                  : 'bg-gray-100 text-gray-500 cursor-not-allowed'
              }
            `}
          >
            <Banknote className="h-5 w-5" />
            {selectedIds.size > 0 ? (
              <>
                Demander versement ({selectedIds.size})
                <span className="ml-1 px-2 py-0.5 bg-white/20 rounded-lg text-xs">
                  {formatCurrency(selectedTotal)}
                </span>
              </>
            ) : (
              'Sélectionnez des commissions'
            )}
          </button>
        )}
      </div>

      <TabGroup index={selectedTab} onIndexChange={handleTabChange}>
        <TabList className="px-4 pt-2 border-b border-gray-100">
          {tabs.map((tab, idx) => (
            <Tab
              key={tab.status}
              className={`
                px-3 py-2 text-xs font-medium rounded-t-lg
                transition-colors duration-200
                ${
                  selectedTab === idx
                    ? 'bg-teal-50 text-teal-600 border-b-2 border-teal-600'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }
              `}
            >
              {tab.label}
              <span
                className={`
                  ml-1.5 px-1.5 py-0.5 rounded-full text-[10px]
                  ${
                    selectedTab === idx
                      ? 'bg-teal-100 text-teal-600'
                      : 'bg-gray-100 text-gray-500'
                  }
                `}
              >
                {counts[tab.status]}
              </span>
            </Tab>
          ))}
        </TabList>

        <TabPanels>
          {tabs.map(tab => {
            const filtered = filterByStatus(tab.status);
            const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
            const paginatedItems = filtered.slice(
              (currentPage - 1) * ITEMS_PER_PAGE,
              currentPage * ITEMS_PER_PAGE
            );
            const showSelectAllForTab =
              showCheckbox &&
              (tab.status === 'all' || tab.status === 'validated');

            return (
              <TabPanel key={tab.status}>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        {/* Header checkbox - sélectionner tous les payables */}
                        {showCheckbox && (
                          <th className="px-3 py-2 w-10">
                            {showSelectAllForTab && (
                              <Checkbox
                                checked={allPayableSelected}
                                onChange={handleSelectAll}
                              />
                            )}
                          </th>
                        )}
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">
                          Date
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">
                          Commande
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">
                          Client
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">
                          CA HT
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">
                          Commission
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">
                          Statut
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {isLoading ? (
                        Array.from({ length: 5 }).map((_, i) => (
                          <SkeletonRow key={i} showCheckbox={showCheckbox} />
                        ))
                      ) : paginatedItems.length === 0 ? (
                        <tr>
                          <td colSpan={showCheckbox ? 7 : 6}>
                            <EmptyState message="Aucune commission pour ce filtre" />
                          </td>
                        </tr>
                      ) : (
                        paginatedItems.map(commission => (
                          <CommissionRow
                            key={commission.id}
                            commission={commission}
                            isSelected={selectedIds.has(commission.id)}
                            onSelect={handleSelect}
                            showCheckbox={showCheckbox}
                          />
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {!isLoading && filtered.length > ITEMS_PER_PAGE && (
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    totalItems={filtered.length}
                    onPageChange={setCurrentPage}
                  />
                )}
              </TabPanel>
            );
          })}
        </TabPanels>
      </TabGroup>

      {/* Footer sticky - Résumé sélection */}
      {selectedIds.size > 0 && (
        <div className="sticky bottom-0 bg-gradient-to-r from-teal-50 to-cyan-50 border-t border-teal-100 p-3">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-4">
              <span className="text-teal-700 font-medium">
                {selectedIds.size} commission
                {selectedIds.size > 1 ? 's' : ''} sélectionnée
                {selectedIds.size > 1 ? 's' : ''}
              </span>
              <button
                onClick={() => setSelectedIds(new Set())}
                className="text-teal-600 hover:text-teal-800 text-xs underline"
              >
                Tout désélectionner
              </button>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-gray-600">Total TTC :</span>
              <span className="text-lg font-bold text-emerald-600">
                {formatCurrency(selectedTotal)}
              </span>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}

export default CommissionsTable;

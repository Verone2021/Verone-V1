/**
 * CommissionsTable
 * Tableau des commissions avec filtrage par statut, pagination, sélection multiple
 * et lignes expandables avec detail produit
 *
 * @module CommissionsTable
 * @since 2025-12-10
 * @updated 2026-03-05 - Lignes expandables + tab "Mes Demandes"
 */

'use client';

import {
  Card,
  Tab,
  TabGroup,
  TabList,
  TabPanels,
  TabPanel,
} from '@tremor/react';
import { Banknote } from 'lucide-react';

import { formatCurrency } from '../../types/analytics';
import { PaymentRequestsPanel } from './PaymentRequestsPanel';
import { CommissionsTableHead } from './CommissionsTableHead';
import {
  CommissionRow,
  SkeletonRow,
  EmptyState,
  Pagination,
} from './commissions-table.sub-components';
import { useCommissionsTable } from './use-commissions-table';
import type { ICommissionsTableProps } from './commissions-table.types';
import { ITEMS_PER_PAGE } from './commissions-table.types';

export function CommissionsTable({
  commissions,
  isLoading,
  onRequestPayment,
  paymentRequestsCount = 0,
}: ICommissionsTableProps): JSX.Element {
  const {
    selectedTab,
    selectedIds,
    currentPage,
    setCurrentPage,
    expandedId,
    setExpandedId,
    sortField,
    sortDirection,
    handleTabChange,
    handleSort,
    tabs,
    counts,
    payableCommissions,
    selectedTotal,
    handleSelect,
    handleSelectAll,
    allPayableSelected,
    showCheckbox,
    isRequestsTab,
    getPaginatedData,
    clearSelection,
  } = useCommissionsTable(commissions, paymentRequestsCount);

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
        {payableCommissions.length > 0 && !isRequestsTab && (
          <button
            onClick={handleRequestPayment}
            disabled={selectedIds.size === 0}
            className={`flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-xl shadow-md transition-all duration-200 ${selectedIds.size > 0 ? 'bg-gradient-to-r from-linkme-turquoise to-linkme-royal text-white hover:shadow-lg hover:scale-[1.02]' : 'bg-gray-100 text-gray-500 cursor-not-allowed'}`}
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
              'Selectionnez des commissions'
            )}
          </button>
        )}
      </div>

      <TabGroup index={selectedTab} onIndexChange={handleTabChange}>
        <TabList className="px-4 pt-2 border-b border-gray-100">
          {tabs.map((tab, idx) => (
            <Tab
              key={tab.status}
              className={`px-3 py-2 text-xs font-medium rounded-t-lg transition-colors duration-200 ${selectedTab === idx ? 'bg-teal-50 text-teal-600 border-b-2 border-teal-600' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
            >
              {tab.icon && (
                <tab.icon className="inline-block h-3 w-3 mr-1 -mt-0.5" />
              )}
              {tab.label}
              <span
                className={`ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] ${selectedTab === idx ? 'bg-teal-100 text-teal-600' : 'bg-gray-100 text-gray-500'}`}
              >
                {counts[tab.status as keyof typeof counts]}
              </span>
            </Tab>
          ))}
        </TabList>

        <TabPanels>
          {tabs.map(tab => {
            if (tab.status === 'requests') {
              return (
                <TabPanel key={tab.status}>
                  <div className="p-4">
                    <PaymentRequestsPanel />
                  </div>
                </TabPanel>
              );
            }

            const { filtered, totalPages, paginatedItems } = getPaginatedData(
              tab.status as 'all' | 'validated' | 'pending' | 'paid'
            );
            const showSelectAllForTab =
              showCheckbox &&
              (tab.status === 'all' || tab.status === 'validated');
            const colCount = showCheckbox ? 10 : 9;

            return (
              <TabPanel key={tab.status}>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <CommissionsTableHead
                      showCheckbox={showCheckbox}
                      showSelectAll={showSelectAllForTab}
                      allPayableSelected={allPayableSelected}
                      onSelectAll={handleSelectAll}
                      sortField={sortField}
                      sortDirection={sortDirection}
                      onSort={handleSort}
                    />
                    <tbody className="divide-y divide-gray-100">
                      {isLoading ? (
                        Array.from({ length: 5 }).map((_, i) => (
                          <SkeletonRow key={i} showCheckbox={showCheckbox} />
                        ))
                      ) : paginatedItems.length === 0 ? (
                        <tr>
                          <td colSpan={colCount}>
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
                            isExpanded={expandedId === commission.id}
                            onToggleExpand={() =>
                              setExpandedId(prev =>
                                prev === commission.id ? null : commission.id
                              )
                            }
                          />
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
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

      {/* Footer sticky */}
      {selectedIds.size > 0 && !isRequestsTab && (
        <div className="sticky bottom-0 bg-gradient-to-r from-teal-50 to-cyan-50 border-t border-teal-100 p-3">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-4">
              <span className="text-teal-700 font-medium">
                {selectedIds.size} commission
                {selectedIds.size > 1 ? 's' : ''} selectionnee
                {selectedIds.size > 1 ? 's' : ''}
              </span>
              <button
                onClick={clearSelection}
                className="text-teal-600 hover:text-teal-800 text-xs underline"
              >
                Tout deselectionner
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

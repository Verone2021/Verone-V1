'use client';

import {
  Badge,
  ButtonV2,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Table,
  TableBody,
} from '@verone/ui';
import { Wallet, Banknote, CheckCircle } from 'lucide-react';

import { TABS_CONFIG } from '../constants';
import type { TabType } from '../types';
import type { CommissionsPageState } from '../hooks/use-commissions-page';
import { CommissionsFilters } from './CommissionsFilters';
import { CommissionsPagination } from './CommissionsPagination';
import { CommissionsTableHeader } from './CommissionsTableHeader';
import { CommissionsTableRow } from './CommissionsTableRow';

interface CommissionsTabContentProps {
  tab: TabType;
  state: CommissionsPageState;
}

export function CommissionsTabContent({
  tab,
  state,
}: CommissionsTabContentProps) {
  const config = TABS_CONFIG[tab];
  const allTabCommissions = state.filteredByTab[tab];
  const totalPages = Math.max(
    1,
    Math.ceil(allTabCommissions.length / state.pageSize)
  );
  const safePage = Math.min(state.currentPage, totalPages - 1);
  const tabCommissions = allTabCommissions.slice(
    safePage * state.pageSize,
    safePage * state.pageSize + state.pageSize
  );
  const showCheckboxes = tab === 'payables' || tab === 'en_cours';
  const colCount = showCheckboxes ? 10 : 9;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              {config.label}
              <Badge variant="outline">
                {state.tabCounts[tab].count} commande
                {state.tabCounts[tab].count > 1 ? 's' : ''}
              </Badge>
            </CardTitle>
            <CardDescription>{config.description}</CardDescription>
          </div>
          {tab === 'payables' && state.selectedIds.length > 0 && (
            <ButtonV2
              onClick={state.openPaymentModal}
              disabled={state.processing}
            >
              <Banknote className="h-4 w-4 mr-2" />
              Payer ({state.selectedIds.length})
            </ButtonV2>
          )}
          {tab === 'en_cours' && state.selectedIds.length > 0 && (
            <ButtonV2
              onClick={() => {
                void state.handleMarkPaid(state.selectedIds).catch(error => {
                  console.error(
                    '[CommissionsPage] handleMarkPaid failed:',
                    error
                  );
                });
              }}
              disabled={state.processing}
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Marquer payé ({state.selectedIds.length})
            </ButtonV2>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <CommissionsFilters
          searchTerm={state.searchTerm}
          onSearchChange={v => {
            state.setSearchTerm(v);
            state.setCurrentPage(0);
          }}
          filterYear={state.filterYear}
          onYearChange={v => {
            state.setFilterYear(v);
            state.setCurrentPage(0);
          }}
          availableYears={state.availableYears}
          typeFilter={state.typeFilter}
          onTypeChange={v => {
            state.setTypeFilter(v);
            state.setCurrentPage(0);
          }}
          enseigneFilter={state.enseigneFilter}
          onEnseigneChange={v => {
            state.setEnseigneFilter(v);
            state.setCurrentPage(0);
          }}
          enseignes={state.enseignes}
          affiliateFilter={state.affiliateFilter}
          onAffiliateChange={v => {
            state.setAffiliateFilter(v);
            state.setCurrentPage(0);
          }}
          affiliates={state.affiliates}
          hasActiveFilters={state.hasActiveFilters}
          onReset={state.resetFilters}
        />

        {tabCommissions.length === 0 ? (
          <div className="text-center py-12">
            <Wallet className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Aucune commission</h3>
            <p className="text-muted-foreground">{config.description}</p>
          </div>
        ) : (
          <Table>
            <CommissionsTableHeader
              showCheckboxes={showCheckboxes}
              tabCommissions={tabCommissions}
              selectedIds={state.selectedIds}
              toggleSelectAll={state.toggleSelectAll}
              sortColumn={state.sortColumn}
              sortDirection={state.sortDirection}
              onSort={state.handleSort}
            />
            <TableBody>
              {tabCommissions.map(commission => (
                <CommissionsTableRow
                  key={commission.id}
                  commission={commission}
                  showCheckboxes={showCheckboxes}
                  selectedIds={state.selectedIds}
                  expandedId={state.expandedId}
                  colCount={colCount}
                  onToggleSelect={state.toggleSelect}
                  onToggleExpand={state.setExpandedId}
                />
              ))}
            </TableBody>
          </Table>
        )}

        {allTabCommissions.length > 0 && (
          <CommissionsPagination
            totalCount={allTabCommissions.length}
            pageSize={state.pageSize}
            safePage={safePage}
            totalPages={totalPages}
            onPageSizeChange={size => {
              state.setPageSize(size);
              state.setCurrentPage(0);
            }}
            onPrev={() => state.setCurrentPage(p => Math.max(0, p - 1))}
            onNext={() =>
              state.setCurrentPage(p => Math.min(totalPages - 1, p + 1))
            }
          />
        )}
      </CardContent>
    </Card>
  );
}

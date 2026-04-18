'use client';

import {
  Badge,
  ButtonV2,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@verone/ui';
import { Banknote, CheckCircle } from 'lucide-react';

import { TABS_CONFIG } from '../constants';
import type { TabType } from '../types';
import type { CommissionsPageState } from '../hooks/use-commissions-page';
import { CommissionsFilters } from './CommissionsFilters';
import { CommissionsPagination } from './CommissionsPagination';
import { CommissionsResponsiveTable } from './CommissionsResponsiveTable';

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

        <CommissionsResponsiveTable
          tabCommissions={tabCommissions}
          showCheckboxes={showCheckboxes}
          selectedIds={state.selectedIds}
          expandedId={state.expandedId}
          colCount={colCount}
          sortColumn={state.sortColumn}
          sortDirection={state.sortDirection}
          toggleSelect={state.toggleSelect}
          setExpandedId={state.setExpandedId}
          toggleSelectAll={state.toggleSelectAll}
          handleSort={state.handleSort}
          emptyDescription={config.description}
        />

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

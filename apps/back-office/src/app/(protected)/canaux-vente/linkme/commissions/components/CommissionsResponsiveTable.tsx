'use client';

import { ResponsiveDataView, Table, TableBody } from '@verone/ui';

import type { Commission, SortColumn, SortDirection } from '../types';
import {
  CommissionMobileCard,
  CommissionsEmptyMessage,
} from './CommissionMobileCard';
import { CommissionsTableHeader } from './CommissionsTableHeader';
import { CommissionsTableRow } from './CommissionsTableRow';

interface CommissionsResponsiveTableProps {
  tabCommissions: Commission[];
  showCheckboxes: boolean;
  selectedIds: string[];
  expandedId: string | null;
  colCount: number;
  sortColumn: SortColumn;
  sortDirection: SortDirection;
  toggleSelect: (id: string) => void;
  setExpandedId: (id: string | null) => void;
  toggleSelectAll: (list: Commission[]) => void;
  handleSort: (column: SortColumn) => void;
  emptyDescription: string;
}

export function CommissionsResponsiveTable({
  tabCommissions,
  showCheckboxes,
  selectedIds,
  expandedId,
  colCount,
  sortColumn,
  sortDirection,
  toggleSelect,
  setExpandedId,
  toggleSelectAll,
  handleSort,
  emptyDescription,
}: CommissionsResponsiveTableProps): React.ReactElement {
  return (
    <ResponsiveDataView<Commission>
      data={tabCommissions}
      emptyMessage={<CommissionsEmptyMessage description={emptyDescription} />}
      renderTable={items => (
        <Table>
          <CommissionsTableHeader
            showCheckboxes={showCheckboxes}
            tabCommissions={items}
            selectedIds={selectedIds}
            toggleSelectAll={toggleSelectAll}
            sortColumn={sortColumn}
            sortDirection={sortDirection}
            onSort={handleSort}
          />
          <TableBody>
            {items.map(commission => (
              <CommissionsTableRow
                key={commission.id}
                commission={commission}
                showCheckboxes={showCheckboxes}
                selectedIds={selectedIds}
                expandedId={expandedId}
                colCount={colCount}
                onToggleSelect={toggleSelect}
                onToggleExpand={setExpandedId}
              />
            ))}
          </TableBody>
        </Table>
      )}
      renderCard={(commission, _idx) => (
        <CommissionMobileCard
          commission={commission}
          showCheckboxes={showCheckboxes}
          selectedIds={selectedIds}
          expandedId={expandedId}
          onToggleSelect={toggleSelect}
          onToggleExpand={setExpandedId}
        />
      )}
    />
  );
}

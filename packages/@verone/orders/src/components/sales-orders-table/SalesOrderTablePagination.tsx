'use client';

import { ButtonUnified } from '@verone/ui';

interface ISalesOrderTablePaginationProps {
  filteredCount: number;
  currentPage: number;
  totalPages: number;
  itemsPerPage: 10 | 20;
  onPageChange: (page: number) => void;
  onItemsPerPageChange: (count: 10 | 20) => void;
}

export function SalesOrderTablePagination({
  filteredCount,
  currentPage,
  totalPages,
  itemsPerPage,
  onPageChange,
  onItemsPerPageChange,
}: ISalesOrderTablePaginationProps): React.ReactNode {
  return (
    <div className="flex items-center justify-between mt-4 pt-4 border-t">
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-600">Afficher</span>
        <div className="flex gap-1">
          <ButtonUnified
            variant={itemsPerPage === 10 ? 'default' : 'outline'}
            size="sm"
            onClick={() => {
              onItemsPerPageChange(10);
              onPageChange(1);
            }}
          >
            10
          </ButtonUnified>
          <ButtonUnified
            variant={itemsPerPage === 20 ? 'default' : 'outline'}
            size="sm"
            onClick={() => {
              onItemsPerPageChange(20);
              onPageChange(1);
            }}
          >
            20
          </ButtonUnified>
        </div>
        <span className="text-sm text-gray-600">par page</span>
      </div>

      <div className="flex items-center gap-4">
        <span className="text-sm text-gray-600">
          {(currentPage - 1) * itemsPerPage + 1}-
          {Math.min(currentPage * itemsPerPage, filteredCount)} sur{' '}
          {filteredCount}
        </span>
        <div className="flex gap-1">
          <ButtonUnified
            variant="outline"
            size="sm"
            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
          >
            Precedent
          </ButtonUnified>
          <ButtonUnified
            variant="outline"
            size="sm"
            onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
          >
            Suivant
          </ButtonUnified>
        </div>
      </div>
    </div>
  );
}

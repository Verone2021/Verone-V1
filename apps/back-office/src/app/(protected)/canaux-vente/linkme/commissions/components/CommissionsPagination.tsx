'use client';

import { ButtonV2 } from '@verone/ui';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface CommissionsPaginationProps {
  totalCount: number;
  pageSize: number;
  safePage: number;
  totalPages: number;
  onPageSizeChange: (size: number) => void;
  onPrev: () => void;
  onNext: () => void;
}

export function CommissionsPagination({
  totalCount,
  pageSize,
  safePage,
  totalPages,
  onPageSizeChange,
  onPrev,
  onNext,
}: CommissionsPaginationProps) {
  return (
    <div className="flex items-center justify-between mt-4 pt-4 border-t">
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Afficher</span>
        <ButtonV2
          variant={pageSize === 10 ? 'default' : 'outline'}
          size="sm"
          onClick={() => onPageSizeChange(10)}
        >
          10
        </ButtonV2>
        <ButtonV2
          variant={pageSize === 20 ? 'default' : 'outline'}
          size="sm"
          onClick={() => onPageSizeChange(20)}
        >
          20
        </ButtonV2>
        <span className="text-sm text-muted-foreground">par page</span>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">
          {safePage * pageSize + 1}–
          {Math.min((safePage + 1) * pageSize, totalCount)} sur {totalCount}
        </span>
        <ButtonV2
          variant="outline"
          size="sm"
          onClick={onPrev}
          disabled={safePage === 0}
        >
          <ChevronLeft className="h-4 w-4" />
        </ButtonV2>
        <ButtonV2
          variant="outline"
          size="sm"
          onClick={onNext}
          disabled={safePage >= totalPages - 1}
        >
          <ChevronRight className="h-4 w-4" />
        </ButtonV2>
      </div>
    </div>
  );
}

'use client';

import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from '@verone/ui';
import { cn } from '@verone/utils';

interface CataloguePaginationProps {
  currentPage: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  onNext: () => void;
  onPrevious: () => void;
  onGoTo: (page: number) => void;
}

export function CataloguePagination({
  currentPage,
  totalPages,
  hasNextPage,
  hasPreviousPage,
  onNext,
  onPrevious,
  onGoTo,
}: CataloguePaginationProps) {
  if (totalPages <= 1) return null;

  const pageNumbers = Array.from(
    { length: Math.min(5, totalPages) },
    (_, i) => {
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
      return pageNum;
    }
  );

  return (
    <div className="mt-8 pb-4">
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              onClick={() => hasPreviousPage && onPrevious()}
              className={cn(
                'cursor-pointer',
                !hasPreviousPage && 'pointer-events-none opacity-50'
              )}
            />
          </PaginationItem>

          {currentPage > 2 && (
            <>
              <PaginationItem>
                <PaginationLink
                  onClick={() => onGoTo(1)}
                  isActive={currentPage === 1}
                >
                  1
                </PaginationLink>
              </PaginationItem>
              {currentPage > 3 && (
                <PaginationItem>
                  <PaginationEllipsis />
                </PaginationItem>
              )}
            </>
          )}

          {pageNumbers.map(pageNum => {
            if (pageNum < 1 || pageNum > totalPages) return null;
            if (pageNum === 1 && currentPage > 2) return null;
            if (pageNum === totalPages && currentPage < totalPages - 1)
              return null;

            return (
              <PaginationItem key={pageNum}>
                <PaginationLink
                  onClick={() => onGoTo(pageNum)}
                  isActive={currentPage === pageNum}
                  className="cursor-pointer"
                >
                  {pageNum}
                </PaginationLink>
              </PaginationItem>
            );
          })}

          {currentPage < totalPages - 1 && (
            <>
              {currentPage < totalPages - 2 && (
                <PaginationItem>
                  <PaginationEllipsis />
                </PaginationItem>
              )}
              <PaginationItem>
                <PaginationLink
                  onClick={() => onGoTo(totalPages)}
                  isActive={currentPage === totalPages}
                >
                  {totalPages}
                </PaginationLink>
              </PaginationItem>
            </>
          )}

          <PaginationItem>
            <PaginationNext
              onClick={() => hasNextPage && onNext()}
              className={cn(
                'cursor-pointer',
                !hasNextPage && 'pointer-events-none opacity-50'
              )}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  );
}

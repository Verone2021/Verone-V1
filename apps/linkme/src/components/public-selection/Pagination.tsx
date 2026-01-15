'use client';

import {
  Pagination as BasePagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@verone/ui';

interface IPaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  branding: {
    primary_color: string;
    secondary_color: string;
    accent_color: string;
    text_color: string;
  };
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  branding,
}: IPaginationProps) {
  // Don't render if only 1 page
  if (totalPages <= 1) return null;

  const handlePageClick = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      onPageChange(page);
      // Scroll to top of catalogue
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Calculate page numbers to display
  const getPageNumbers = () => {
    const pages: (number | 'ellipsis')[] = [];
    const showEllipsis = totalPages > 7;

    if (!showEllipsis) {
      // Show all pages if 7 or fewer
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);

      if (currentPage <= 3) {
        // Near the start
        pages.push(2, 3, 4, 'ellipsis', totalPages);
      } else if (currentPage >= totalPages - 2) {
        // Near the end
        pages.push(
          'ellipsis',
          totalPages - 3,
          totalPages - 2,
          totalPages - 1,
          totalPages
        );
      } else {
        // In the middle
        pages.push(
          'ellipsis',
          currentPage - 1,
          currentPage,
          currentPage + 1,
          'ellipsis',
          totalPages
        );
      }
    }

    return pages;
  };

  const pages = getPageNumbers();

  return (
    <BasePagination className="mt-8">
      <PaginationContent>
        {/* Previous button */}
        <PaginationItem>
          <PaginationPrevious
            onClick={() => handlePageClick(currentPage - 1)}
            style={{
              opacity: currentPage === 1 ? 0.5 : 1,
              pointerEvents: currentPage === 1 ? 'none' : 'auto',
              color: branding.text_color,
            }}
          />
        </PaginationItem>

        {/* Page numbers */}
        {pages.map((page, index) => (
          <PaginationItem key={`page-${index}`}>
            {page === 'ellipsis' ? (
              <PaginationEllipsis />
            ) : (
              <PaginationLink
                onClick={() => handlePageClick(page)}
                isActive={currentPage === page}
                style={{
                  backgroundColor:
                    currentPage === page
                      ? branding.primary_color
                      : 'transparent',
                  color: currentPage === page ? '#ffffff' : branding.text_color,
                  borderColor:
                    currentPage === page ? branding.primary_color : '#e5e7eb',
                }}
              >
                {page}
              </PaginationLink>
            )}
          </PaginationItem>
        ))}

        {/* Next button */}
        <PaginationItem>
          <PaginationNext
            onClick={() => handlePageClick(currentPage + 1)}
            style={{
              opacity: currentPage === totalPages ? 0.5 : 1,
              pointerEvents: currentPage === totalPages ? 'none' : 'auto',
              color: branding.text_color,
            }}
          />
        </PaginationItem>
      </PaginationContent>
    </BasePagination>
  );
}

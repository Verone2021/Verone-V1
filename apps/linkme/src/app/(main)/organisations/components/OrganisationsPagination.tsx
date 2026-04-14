'use client';

/**
 * OrganisationsPagination - Pagination pour la page organisations
 *
 * @module OrganisationsPagination
 * @since 2026-04-14
 */

import { ChevronLeft, ChevronRight } from 'lucide-react';

interface OrganisationsPaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function OrganisationsPagination({
  currentPage,
  totalPages,
  onPageChange,
}: OrganisationsPaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-2 mt-6">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        <ChevronLeft className="h-4 w-4" />
        Précédent
      </button>

      <div className="flex items-center gap-1">
        {currentPage > 2 && (
          <>
            <button
              onClick={() => onPageChange(1)}
              className="w-8 h-8 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              1
            </button>
            {currentPage > 3 && <span className="px-1 text-gray-400">...</span>}
          </>
        )}

        {Array.from({ length: totalPages }, (_, i) => i + 1)
          .filter(
            page =>
              page >= currentPage - 1 &&
              page <= currentPage + 1 &&
              page >= 1 &&
              page <= totalPages
          )
          .map(page => (
            <button
              key={page}
              onClick={() => onPageChange(page)}
              className={`w-8 h-8 text-sm font-medium rounded-lg transition-colors ${
                page === currentPage
                  ? 'bg-linkme-turquoise text-white'
                  : 'text-gray-600 bg-white border border-gray-200 hover:bg-gray-50'
              }`}
            >
              {page}
            </button>
          ))}

        {currentPage < totalPages - 1 && (
          <>
            {currentPage < totalPages - 2 && (
              <span className="px-1 text-gray-400">...</span>
            )}
            <button
              onClick={() => onPageChange(totalPages)}
              className="w-8 h-8 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              {totalPages}
            </button>
          </>
        )}
      </div>

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        Suivant
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}

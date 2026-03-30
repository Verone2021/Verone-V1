'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@verone/ui';
import { Badge } from '@verone/ui';
import { ButtonV2 } from '@verone/ui';
import { cn } from '@verone/utils';
import { ChevronLeft, ChevronRight, LayoutGrid, Table } from 'lucide-react';

interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  pageSize: number;
}

interface MovementsContentHeaderProps {
  title: string;
  hasFilters: boolean;
  loading: boolean;
  total: number;
  pagination: PaginationInfo;
  viewMode: 'table' | 'cards';
  onViewModeChange: (mode: 'table' | 'cards') => void;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: string) => void;
}

export function MovementsContentHeader({
  title,
  hasFilters,
  loading,
  total,
  pagination,
  viewMode,
  onViewModeChange,
  onPageChange,
  onPageSizeChange,
}: MovementsContentHeaderProps) {
  const rangeStart = (pagination.currentPage - 1) * pagination.pageSize + 1;
  const rangeEnd = Math.min(
    pagination.currentPage * pagination.pageSize,
    total
  );

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <h2 className="text-lg font-semibold text-black">{title}</h2>
        {hasFilters && (
          <Badge variant="outline" className="border-black text-black">
            Filtré
          </Badge>
        )}
        <span className="text-sm text-gray-500">
          {loading ? (
            'Chargement...'
          ) : total === 0 ? (
            'Aucun mouvement'
          ) : (
            <>
              {rangeStart}-{rangeEnd} sur {total}
            </>
          )}
        </span>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center border border-gray-300 rounded-md">
          <ButtonV2
            variant={viewMode === 'table' ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => onViewModeChange('table')}
            className={cn(
              'rounded-r-none',
              viewMode === 'table'
                ? 'bg-black text-white hover:bg-black/90'
                : 'text-gray-600 hover:bg-gray-100'
            )}
          >
            <Table className="h-4 w-4" />
          </ButtonV2>
          <ButtonV2
            variant={viewMode === 'cards' ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => onViewModeChange('cards')}
            className={cn(
              'rounded-l-none',
              viewMode === 'cards'
                ? 'bg-black text-white hover:bg-black/90'
                : 'text-gray-600 hover:bg-gray-100'
            )}
          >
            <LayoutGrid className="h-4 w-4" />
          </ButtonV2>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">Afficher:</span>
          <Select
            value={pagination.pageSize.toString()}
            onValueChange={onPageSizeChange}
          >
            <SelectTrigger className="w-20 h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="25">25</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {pagination.totalPages > 1 && (
          <div className="flex items-center gap-2">
            <ButtonV2
              variant="outline"
              size="sm"
              onClick={() => onPageChange(pagination.currentPage - 1)}
              disabled={pagination.currentPage === 1 || loading}
              className="h-8 w-8 p-0"
            >
              <ChevronLeft className="h-4 w-4" />
            </ButtonV2>

            <span className="text-sm text-gray-500">
              {pagination.currentPage}/{pagination.totalPages}
            </span>

            <ButtonV2
              variant="outline"
              size="sm"
              onClick={() => onPageChange(pagination.currentPage + 1)}
              disabled={
                pagination.currentPage === pagination.totalPages || loading
              }
              className="h-8 w-8 p-0"
            >
              <ChevronRight className="h-4 w-4" />
            </ButtonV2>
          </div>
        )}
      </div>
    </div>
  );
}

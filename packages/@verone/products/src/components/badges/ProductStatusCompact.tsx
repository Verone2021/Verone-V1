'use client';

import { useState, useRef, useEffect } from 'react';

import { Settings, ChevronDown } from 'lucide-react';

import { Badge } from '@verone/ui';
import { cn } from '@verone/utils';
import {
  useProductStatus,
  PRODUCT_STATUS_OPTIONS,
  type ProductStatus,
} from '@verone/products/hooks';

interface ProductStatusCompactProps {
  product: {
    id: string;
    product_status: ProductStatus;
  };
  onUpdate: (updatedData: Partial<{ product_status: ProductStatus }>) => void;
  className?: string;
}

/**
 * Version compacte du statut commercial (60px height)
 * Affichage : Label + badge cliquable + dropdown inline
 * Éditable - Inline edit avec dropdown overlay
 */
export function ProductStatusCompact({
  product,
  onUpdate,
  className,
}: ProductStatusCompactProps) {
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { currentStatus, isSaving, error, saveStatus, getStatusOption } =
    useProductStatus({
      productId: product.id,
      initialStatus: product.product_status,
      onUpdate: newStatus => {
        onUpdate({ product_status: newStatus });
        setShowDropdown(false);
      },
    });

  const currentOption = getStatusOption(currentStatus);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    }
    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () =>
        document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showDropdown]);

  return (
    <div className={cn('relative', className)} ref={dropdownRef}>
      {/* Main container */}
      <div
        className={cn(
          'flex items-center justify-between h-[60px] px-3 py-2',
          'bg-white rounded-lg border border-gray-200 shadow-sm',
          'hover:shadow-md transition-shadow duration-200',
          'cursor-pointer',
          showDropdown && 'ring-2 ring-blue-500 ring-opacity-50'
        )}
        onClick={() => setShowDropdown(!showDropdown)}
      >
        {/* Label avec icône */}
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-blue-50">
            <Settings className="h-3.5 w-3.5 text-blue-600" />
          </div>
          <span className="text-sm font-medium text-gray-900">
            Statut commercial
          </span>
        </div>

        {/* Badge compact avec dropdown indicator */}
        <div className="flex items-center gap-1">
          <Badge
            variant={currentOption.variant}
            className="text-[10px] px-2 py-0.5 font-medium"
          >
            <span className="mr-1.5">{currentOption.icon}</span>
            {currentOption.label}
          </Badge>
          <ChevronDown
            className={cn(
              'h-3 w-3 text-gray-400 transition-transform duration-200',
              showDropdown && 'rotate-180'
            )}
          />
        </div>
      </div>

      {/* Dropdown menu */}
      {showDropdown && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg border border-gray-200 shadow-lg z-50 py-1 overflow-hidden">
          {PRODUCT_STATUS_OPTIONS.map(option => (
            <button
              key={option.value}
              onClick={e => {
                e.stopPropagation();
                saveStatus(option.value);
              }}
              disabled={isSaving}
              className={cn(
                'w-full px-3 py-2 text-left text-sm transition-colors',
                'hover:bg-gray-50 flex items-center gap-2',
                currentStatus === option.value && 'bg-blue-50',
                isSaving && 'cursor-not-allowed opacity-50'
              )}
            >
              <span className="text-base">{option.icon}</span>
              <div className="flex-1">
                <p className="font-medium text-gray-900">{option.label}</p>
                <p className="text-xs text-gray-500">{option.description}</p>
              </div>
              {currentStatus === option.value && (
                <div className="h-2 w-2 rounded-full bg-blue-500" />
              )}
            </button>
          ))}
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="absolute top-full left-0 right-0 mt-1 px-2 py-1 bg-red-50 border border-red-200 rounded text-xs text-red-600">
          {error}
        </div>
      )}
    </div>
  );
}

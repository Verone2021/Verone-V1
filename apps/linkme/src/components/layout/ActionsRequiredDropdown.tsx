'use client';

/**
 * ActionsRequiredDropdown
 *
 * Bouton de notification avec dropdown listant les éléments à compléter:
 * - Organisations sans ownership_type
 * - Sélections non publiées
 * - Commandes en brouillon
 * - Commissions en attente
 *
 * @module ActionsRequiredDropdown
 * @since 2026-01-12
 */

import { useEffect, useRef, useState } from 'react';

import Link from 'next/link';

import { cn } from '@verone/ui';
import {
  AlertCircle,
  Building2,
  ChevronRight,
  Package,
  ShoppingCart,
  User,
  Wallet,
} from 'lucide-react';

import {
  useIncompleteItems,
  type IncompleteItem,
} from '@/lib/hooks/use-incomplete-items';

// ============================================
// CONSTANTS
// ============================================

const ICON_MAP = {
  building: Building2,
  package: Package,
  'shopping-cart': ShoppingCart,
  wallet: Wallet,
  user: User,
} as const;

const PRIORITY_COLORS = {
  high: 'bg-red-100 text-red-700 border-red-200',
  medium: 'bg-orange-100 text-orange-700 border-orange-200',
  low: 'bg-blue-100 text-blue-700 border-blue-200',
} as const;

// ============================================
// COMPONENT
// ============================================

export function ActionsRequiredDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { items, totalCount, highPriorityCount, hasItems } =
    useIncompleteItems();

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Don't render if no items
  if (!hasItems) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Button with badge */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'relative flex items-center gap-2 px-3 py-2 rounded-lg transition-colors',
          isOpen ? 'bg-orange-100' : 'hover:bg-gray-100'
        )}
        aria-label={`${totalCount} actions requises`}
        aria-expanded={isOpen}
      >
        <AlertCircle className="h-5 w-5 text-orange-500" />
        <span className="hidden md:inline text-sm font-medium text-gray-700">
          Notifications
        </span>

        {/* Counter badge */}
        <span
          className={cn(
            'flex items-center justify-center min-w-[20px] h-5 px-1.5 text-xs font-bold rounded-full',
            highPriorityCount > 0
              ? 'bg-red-500 text-white'
              : 'bg-orange-500 text-white'
          )}
        >
          {totalCount}
        </span>
      </button>

      {/* Dropdown menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-gray-200 z-50 overflow-hidden">
          {/* Header */}
          <div className="px-4 py-3 bg-gray-50 border-b">
            <h3 className="font-semibold text-gray-900">Actions requises</h3>
            <p className="text-xs text-gray-500 mt-0.5">
              {totalCount} élément{totalCount > 1 ? 's' : ''} à compléter
            </p>
          </div>

          {/* Items list */}
          <div className="max-h-80 overflow-y-auto divide-y divide-gray-100">
            {items.map(item => (
              <IncompleteItemRow
                key={item.id}
                item={item}
                onClose={() => setIsOpen(false)}
              />
            ))}
          </div>

          {/* Footer */}
          <div className="px-4 py-3 bg-gray-50 border-t">
            <Link
              href="/organisations?tab=incomplete"
              onClick={() => setIsOpen(false)}
              className="text-sm text-linkme-turquoise hover:underline font-medium"
            >
              Voir tout
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================
// SUB-COMPONENT
// ============================================

function IncompleteItemRow({
  item,
  onClose,
}: {
  item: IncompleteItem;
  onClose: () => void;
}) {
  const Icon = ICON_MAP[item.icon];

  return (
    <Link
      href={item.route}
      onClick={onClose}
      className="flex items-start gap-3 p-3 hover:bg-gray-50 transition-colors"
    >
      <div
        className={cn(
          'flex items-center justify-center w-10 h-10 rounded-lg border',
          PRIORITY_COLORS[item.priority]
        )}
      >
        <Icon className="h-5 w-5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-gray-900 text-sm truncate">
          {item.title}
        </p>
        <p className="text-xs text-gray-500 mt-0.5">{item.description}</p>
      </div>
      <ChevronRight className="h-4 w-4 text-gray-400 mt-3 flex-shrink-0" />
    </Link>
  );
}

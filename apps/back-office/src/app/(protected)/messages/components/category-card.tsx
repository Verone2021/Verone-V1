'use client';

import Link from 'next/link';

import { cn } from '@verone/utils';
import { ArrowRight, CheckCircle } from 'lucide-react';

import type { CategoryConfig } from './constants';

interface CategoryCardProps {
  config: CategoryConfig;
  count: number;
  children: React.ReactNode;
}

export function CategoryCard({ config, count, children }: CategoryCardProps) {
  const Icon = config.icon;

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-2.5 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className={cn('h-4 w-4', config.color)} />
          <h2 className="text-sm font-semibold text-gray-900">
            {config.label}
          </h2>
          {count > 0 && (
            <span className="text-[10px] px-1.5 py-0.5 bg-red-100 text-red-700 rounded-full font-medium">
              {count}
            </span>
          )}
        </div>
        <Link
          href={config.actionUrl}
          className="text-xs text-gray-500 hover:text-gray-900 flex items-center gap-1"
        >
          Voir tout <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      {/* Content */}
      <div className="divide-y divide-gray-50">{children}</div>
    </div>
  );
}

export function EmptyState({ config: _config }: { config: CategoryConfig }) {
  return (
    <div className="px-4 py-5 text-center">
      <CheckCircle className="h-7 w-7 text-green-300 mx-auto mb-1.5" />
      <p className="text-xs text-gray-400">Tout est a jour</p>
    </div>
  );
}

interface MoreItemsLinkProps {
  count: number;
  href: string;
}

export function MoreItemsLink({ count, href }: MoreItemsLinkProps) {
  if (count <= 5) return null;
  return (
    <Link
      href={href}
      className="block px-4 py-2 text-center text-xs text-gray-500 hover:text-gray-900 hover:bg-gray-50 border-t border-gray-50"
    >
      +{count - 5} autres a traiter &rarr;
    </Link>
  );
}

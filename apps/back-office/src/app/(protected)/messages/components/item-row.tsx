'use client';

import Link from 'next/link';

import { cn } from '@verone/utils';
import { ArrowRight } from 'lucide-react';

interface ItemRowProps {
  href: string;
  title: string;
  subtitle: string;
  meta?: string;
  borderColor?: string;
  actions?: React.ReactNode;
}

export function ItemRow({
  href,
  title,
  subtitle,
  meta,
  borderColor = 'border-gray-200',
  actions,
}: ItemRowProps) {
  return (
    <div className="group flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors">
      <Link
        href={href}
        className={cn(
          'flex-1 flex items-start gap-3 min-w-0',
          'border-l-2 pl-3',
          borderColor
        )}
      >
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-gray-900 truncate">{title}</p>
          <p className="text-xs text-gray-500 truncate">{subtitle}</p>
        </div>
        {meta && (
          <span className="text-[10px] text-gray-400 flex-shrink-0 mt-0.5">
            {meta}
          </span>
        )}
      </Link>

      {/* Actions inline (hover reveal) */}
      <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
        {actions}
        <Link href={href} className="text-gray-300 hover:text-gray-600">
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
}

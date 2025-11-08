'use client';

import Link from 'next/link';

import { cn } from '@verone/utils';
import { ChevronRight, Home } from 'lucide-react';

interface BreadcrumbItem {
  label: string;
  href?: string;
  active?: boolean;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

export function Breadcrumb({ items, className }: BreadcrumbProps) {
  return (
    <nav
      className={cn(
        'flex items-center space-x-2 text-sm text-gray-600',
        className
      )}
    >
      <Link
        href="/dashboard"
        className="flex items-center hover:text-black transition-colors"
      >
        <Home className="h-4 w-4" />
      </Link>

      {items.map((item, index) => (
        <div key={index} className="flex items-center space-x-2">
          <ChevronRight className="h-4 w-4 text-gray-400" />
          {item.href && !item.active ? (
            <Link
              href={item.href}
              className="hover:text-black transition-colors"
            >
              {item.label}
            </Link>
          ) : (
            <span
              className={cn(
                item.active ? 'text-black font-medium' : 'text-gray-600'
              )}
            >
              {item.label}
            </span>
          )}
        </div>
      ))}
    </nav>
  );
}

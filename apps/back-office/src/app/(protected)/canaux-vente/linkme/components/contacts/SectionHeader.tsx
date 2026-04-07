'use client';

import { ChevronDown, Check } from 'lucide-react';

import { cn } from '@verone/ui';

interface SectionHeaderProps {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  isComplete?: boolean;
  isOpen: boolean;
  onToggle: () => void;
}

export function SectionHeader({
  icon,
  title,
  subtitle,
  isComplete = false,
  isOpen,
  onToggle,
}: SectionHeaderProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="w-full flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors"
    >
      <div className="flex items-center gap-3">
        <div
          className={cn(
            'w-8 h-8 rounded-full flex items-center justify-center',
            isComplete
              ? 'bg-green-100 text-green-600'
              : 'bg-gray-100 text-gray-500'
          )}
        >
          {isComplete ? <Check className="h-4 w-4" /> : icon}
        </div>
        <div className="text-left">
          <h4 className="font-medium text-gray-900 text-sm">{title}</h4>
          {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
        </div>
      </div>
      <ChevronDown
        className={cn(
          'h-4 w-4 text-gray-400 transition-transform',
          isOpen && 'rotate-180'
        )}
      />
    </button>
  );
}

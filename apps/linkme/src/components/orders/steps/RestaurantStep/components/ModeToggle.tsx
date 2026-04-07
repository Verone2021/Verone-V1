'use client';

import { cn } from '@verone/ui';
import { Store, Plus } from 'lucide-react';

interface ModeToggleProps {
  mode: 'existing' | 'new';
  onModeChange: (mode: 'existing' | 'new') => void;
}

export function ModeToggle({ mode, onModeChange }: ModeToggleProps) {
  return (
    <div className="flex gap-4">
      <button
        type="button"
        onClick={() => onModeChange('existing')}
        className={cn(
          'flex-1 flex items-center justify-center gap-3 p-4 rounded-xl border-2 transition-all',
          mode === 'existing'
            ? 'border-linkme-turquoise bg-linkme-turquoise/5'
            : 'border-gray-200 hover:border-gray-300'
        )}
      >
        <Store
          className={cn(
            'h-5 w-5',
            mode === 'existing' ? 'text-linkme-turquoise' : 'text-gray-400'
          )}
        />
        <span
          className={cn(
            'font-medium',
            mode === 'existing' ? 'text-linkme-turquoise' : 'text-gray-600'
          )}
        >
          Restaurant existant
        </span>
      </button>

      <button
        type="button"
        onClick={() => onModeChange('new')}
        className={cn(
          'flex-1 flex items-center justify-center gap-3 p-4 rounded-xl border-2 transition-all',
          mode === 'new'
            ? 'border-linkme-turquoise bg-linkme-turquoise/5'
            : 'border-gray-200 hover:border-gray-300'
        )}
      >
        <Plus
          className={cn(
            'h-5 w-5',
            mode === 'new' ? 'text-linkme-turquoise' : 'text-gray-400'
          )}
        />
        <span
          className={cn(
            'font-medium',
            mode === 'new' ? 'text-linkme-turquoise' : 'text-gray-600'
          )}
        >
          Nouveau restaurant
        </span>
      </button>
    </div>
  );
}

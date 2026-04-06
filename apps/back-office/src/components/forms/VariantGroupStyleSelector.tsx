'use client';

import { cn } from '@verone/utils';

import { DECORATIVE_STYLES } from './variant-group-form.types';

interface VariantGroupStyleSelectorProps {
  style: string;
  onStyleChange: (value: string) => void;
}

export function VariantGroupStyleSelector({
  style,
  onStyleChange,
}: VariantGroupStyleSelectorProps) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {DECORATIVE_STYLES.map(styleOption => {
          const isSelected = style === styleOption.value;
          return (
            <button
              key={styleOption.value}
              type="button"
              onClick={() => onStyleChange(isSelected ? '' : styleOption.value)}
              className={cn(
                'flex flex-col items-center gap-2 p-4 rounded-lg border-2 text-center transition-all',
                isSelected
                  ? 'border-black bg-black text-white shadow-md'
                  : 'border-gray-300 hover:border-gray-400 hover:shadow-sm'
              )}
            >
              <div className="text-2xl mb-1">{styleOption.icon}</div>
              <div className="space-y-1">
                <div className="font-medium text-sm">{styleOption.label}</div>
                <div
                  className={cn(
                    'text-xs',
                    isSelected ? 'text-gray-200' : 'text-gray-500'
                  )}
                >
                  {styleOption.description}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

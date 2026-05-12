'use client';

import { cn } from '@verone/utils';

import { useActiveStyleOptions } from '@/hooks/use-style-options';

interface VariantGroupStyleSelectorProps {
  style: string;
  onStyleChange: (value: string) => void;
}

export function VariantGroupStyleSelector({
  style,
  onStyleChange,
}: VariantGroupStyleSelectorProps) {
  const { styleOptions, isLoading } = useActiveStyleOptions();

  if (isLoading) {
    return (
      <p className="text-xs text-gray-400 italic py-2">
        Chargement des styles…
      </p>
    );
  }

  if (styleOptions.length === 0) {
    return (
      <p className="text-xs text-gray-400 italic py-2">
        Aucun style disponible.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {styleOptions.map(styleOption => {
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
              <div className="font-medium text-sm">{styleOption.label}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

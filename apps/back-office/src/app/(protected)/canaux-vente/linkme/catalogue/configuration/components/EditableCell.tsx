'use client';

import { useState } from 'react';

import { Input } from '@verone/ui';
import { cn, formatPrice } from '@verone/utils';

export function EditableCell({
  value,
  onChange,
  type = 'price',
  min = 0,
  max = 100,
  step = 0.01,
  disabled = false,
  hasChange = false,
}: {
  value: number | null;
  onChange: (value: number | null) => void;
  type?: 'price' | 'percent';
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
  hasChange?: boolean;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [localValue, setLocalValue] = useState<string>(
    value !== null
      ? type === 'percent'
        ? (value * 100).toFixed(1)
        : value.toFixed(2)
      : ''
  );

  const handleBlur = () => {
    setIsEditing(false);
    const numValue = parseFloat(localValue);
    if (isNaN(numValue)) {
      onChange(null);
    } else {
      const finalValue = type === 'percent' ? numValue / 100 : numValue;
      onChange(Math.max(min, Math.min(max, finalValue)));
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleBlur();
    }
    if (e.key === 'Escape') {
      setLocalValue(
        value !== null
          ? type === 'percent'
            ? (value * 100).toFixed(1)
            : value.toFixed(2)
          : ''
      );
      setIsEditing(false);
    }
  };

  if (disabled) {
    return (
      <span className="text-gray-500 font-mono text-sm">
        {value !== null
          ? type === 'percent'
            ? `${(value * 100).toFixed(1)}%`
            : formatPrice(value)
          : '-'}
      </span>
    );
  }

  if (isEditing) {
    return (
      <div className="flex items-center gap-1">
        <Input
          type="number"
          value={localValue}
          onChange={e => setLocalValue(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          step={type === 'percent' ? 0.1 : step}
          min={type === 'percent' ? min * 100 : min}
          max={type === 'percent' ? max * 100 : max}
          className="w-24 h-8 text-sm font-mono"
          autoFocus
        />
        {type === 'percent' && <span className="text-gray-400">%</span>}
      </div>
    );
  }

  return (
    <button
      onClick={() => setIsEditing(true)}
      className={cn(
        'px-2 py-1 rounded text-sm font-mono transition-colors text-left min-w-[80px]',
        hasChange
          ? 'bg-amber-100 text-amber-800 ring-1 ring-amber-300'
          : 'hover:bg-gray-100'
      )}
    >
      {value !== null
        ? type === 'percent'
          ? `${(value * 100).toFixed(1)}%`
          : formatPrice(value)
        : '-'}
    </button>
  );
}

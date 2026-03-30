'use client';

import type React from 'react';
import type { LucideIcon } from 'lucide-react';
import { Input } from '@verone/ui';

interface ProfileFieldRowProps {
  icon: LucideIcon;
  label: React.ReactNode;
  displayValue: React.ReactNode;
  isEditing: boolean;
  inputProps?: React.InputHTMLAttributes<HTMLInputElement> & {
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  };
  hint?: string;
  error?: string;
  readOnly?: boolean;
}

export function ProfileFieldRow({
  icon: Icon,
  label,
  displayValue,
  isEditing,
  inputProps,
  hint,
  error,
  readOnly = false,
}: ProfileFieldRowProps) {
  return (
    <div className="flex items-center space-x-2.5">
      <Icon className="h-3.5 w-3.5 text-neutral-400" />
      <div className="flex-1">
        <p className="text-[11px] mb-1 text-neutral-600">{label}</p>
        {isEditing && !readOnly && inputProps ? (
          <Input {...inputProps} className="border-neutral-300" />
        ) : (
          <div className="font-medium text-xs text-neutral-900">
            {displayValue}
          </div>
        )}
        {isEditing && hint && (
          <p className="text-xs mt-1 text-neutral-500">{hint}</p>
        )}
        {error && <p className="text-xs mt-1 text-danger-500">{error}</p>}
      </div>
    </div>
  );
}

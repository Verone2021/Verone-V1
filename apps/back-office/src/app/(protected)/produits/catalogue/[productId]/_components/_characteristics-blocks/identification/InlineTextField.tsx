'use client';

import { useState, useCallback } from 'react';

import { Input } from '@verone/ui';
import { cn } from '@verone/utils';
import { Pencil, Check, X } from 'lucide-react';

export interface InlineTextFieldProps {
  label: string;
  value: string;
  placeholder?: string;
  mono?: boolean;
  readOnly?: boolean;
  onSave: (value: string) => void;
}

export function InlineTextField({
  label,
  value,
  placeholder,
  mono = false,
  readOnly = false,
  onSave,
}: InlineTextFieldProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  const handleSave = useCallback(() => {
    onSave(draft.trim());
    setEditing(false);
  }, [draft, onSave]);

  return (
    <div className="bg-neutral-50 rounded border border-neutral-200 p-2 flex flex-col gap-1">
      <span className="text-[9px] uppercase tracking-wide text-neutral-400 font-medium">
        {label}
      </span>
      {readOnly ? (
        <span className="text-xs text-neutral-700">{value || '—'}</span>
      ) : editing ? (
        <div className="flex items-center gap-1">
          <Input
            autoFocus
            value={draft}
            placeholder={placeholder}
            onChange={e => setDraft(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') handleSave();
              if (e.key === 'Escape') {
                setDraft(value);
                setEditing(false);
              }
            }}
            className={cn('h-6 text-xs px-1.5 flex-1', mono && 'font-mono')}
          />
          <button
            onClick={handleSave}
            className="h-11 w-11 md:h-7 md:w-7 flex items-center justify-center rounded text-green-600 hover:bg-green-50"
            aria-label="Valider"
          >
            <Check className="h-2.5 w-2.5" />
          </button>
          <button
            onClick={() => {
              setDraft(value);
              setEditing(false);
            }}
            className="h-11 w-11 md:h-7 md:w-7 flex items-center justify-center rounded text-neutral-400 hover:bg-neutral-100"
            aria-label="Annuler"
          >
            <X className="h-2.5 w-2.5" />
          </button>
        </div>
      ) : (
        <button
          onClick={() => {
            setDraft(value);
            setEditing(true);
          }}
          className="group flex items-center gap-1 text-left"
        >
          <span
            className={cn(
              'text-xs text-neutral-700 flex-1 truncate',
              mono && 'font-mono',
              !value && 'text-neutral-400 italic'
            )}
          >
            {value.length > 0 ? value : (placeholder ?? '—')}
          </span>
          <Pencil className="h-2.5 w-2.5 text-neutral-300 group-hover:text-neutral-500 transition-colors flex-shrink-0" />
        </button>
      )}
    </div>
  );
}

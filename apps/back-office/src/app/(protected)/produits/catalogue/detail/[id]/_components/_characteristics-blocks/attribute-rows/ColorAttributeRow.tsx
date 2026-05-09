'use client';

import { useState, useCallback } from 'react';

import { cn } from '@verone/utils';
import { DynamicColorSelector } from '@verone/ui-business';
import { Pencil, Check, X } from 'lucide-react';

export interface ColorAttributeRowProps {
  attrKey: string;
  label: string;
  value: string;
  onSave: (key: string, value: string) => void;
}

export function ColorAttributeRow({
  attrKey,
  label,
  value,
  onSave,
}: ColorAttributeRowProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  const handleConfirm = useCallback(() => {
    onSave(attrKey, draft);
    setEditing(false);
  }, [attrKey, draft, onSave]);

  return (
    <div className="group flex items-center gap-2 py-1.5 border-b border-neutral-100 last:border-0">
      <span className="w-32 flex-shrink-0 text-[10px] uppercase tracking-wide text-neutral-500 font-medium">
        {label}
      </span>
      {editing ? (
        <div className="flex items-center gap-1 flex-1 min-w-0">
          <div className="flex-1 min-w-0">
            <DynamicColorSelector value={draft} onChange={setDraft} />
          </div>
          <button
            onClick={handleConfirm}
            className="h-11 w-11 md:h-7 md:w-7 flex-shrink-0 flex items-center justify-center rounded text-green-600 hover:bg-green-50"
            aria-label="Valider"
          >
            <Check className="h-3 w-3" />
          </button>
          <button
            onClick={() => {
              setDraft(value);
              setEditing(false);
            }}
            className="h-11 w-11 md:h-7 md:w-7 flex-shrink-0 flex items-center justify-center rounded text-neutral-400 hover:bg-neutral-100"
            aria-label="Annuler"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-1.5 flex-1 min-w-0">
          <span
            className={cn(
              'flex-1 text-xs truncate',
              value ? 'text-neutral-900' : 'text-neutral-400 italic'
            )}
          >
            {value || '—'}
          </span>
          <button
            onClick={() => {
              setDraft(value);
              setEditing(true);
            }}
            className="opacity-0 group-hover:opacity-100 h-11 w-11 md:h-7 md:w-7 flex items-center justify-center rounded text-neutral-400 hover:bg-neutral-100 transition-opacity"
            aria-label={`Modifier ${label}`}
          >
            <Pencil className="h-3 w-3" />
          </button>
        </div>
      )}
    </div>
  );
}

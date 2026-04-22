'use client';

import { useState, useCallback } from 'react';

import { Input } from '@verone/ui';
import { cn } from '@verone/utils';
import { Pencil, Check, X } from 'lucide-react';

export interface AttributeRowProps {
  attrKey: string;
  label: string;
  value: string;
  onSave: (key: string, value: string) => void;
  onDelete?: (key: string) => void;
  isCustom?: boolean;
}

export function AttributeRow({
  attrKey,
  label,
  value,
  onSave,
  onDelete,
  isCustom = false,
}: AttributeRowProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  const handleSave = useCallback(() => {
    onSave(attrKey, draft.trim());
    setEditing(false);
  }, [attrKey, draft, onSave]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') handleSave();
      if (e.key === 'Escape') {
        setDraft(value);
        setEditing(false);
      }
    },
    [handleSave, value]
  );

  return (
    <div className="group flex items-center gap-2 py-1.5 border-b border-neutral-100 last:border-0">
      <span className="w-32 flex-shrink-0 text-[10px] uppercase tracking-wide text-neutral-500 font-medium">
        {label}
      </span>
      {editing ? (
        <div className="flex items-center gap-1 flex-1">
          <Input
            autoFocus
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onKeyDown={handleKeyDown}
            className="h-6 text-xs px-1.5 flex-1"
          />
          <button
            onClick={handleSave}
            className="h-11 w-11 md:h-7 md:w-7 flex items-center justify-center rounded text-green-600 hover:bg-green-50"
            aria-label="Valider"
          >
            <Check className="h-3 w-3" />
          </button>
          <button
            onClick={() => {
              setDraft(value);
              setEditing(false);
            }}
            className="h-11 w-11 md:h-7 md:w-7 flex items-center justify-center rounded text-neutral-400 hover:bg-neutral-100"
            aria-label="Annuler"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-1.5 flex-1 min-w-0">
          <span
            className={cn(
              'flex-1 text-xs truncate tabular-nums',
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
          {isCustom && onDelete && (
            <button
              onClick={() => onDelete(attrKey)}
              className="opacity-0 group-hover:opacity-100 h-11 w-11 md:h-7 md:w-7 flex items-center justify-center rounded text-red-400 hover:bg-red-50 transition-opacity"
              aria-label={`Supprimer ${label}`}
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}

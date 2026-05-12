'use client';

/**
 * AttributeSelect — Dropdown inline pour les attributs de variantes.
 * Affiche une liste d'options + option "Autre..." custom si allowCustom.
 * Design : popover compact, pencil on hover, charte Verone.
 */

import { useState, useCallback, useRef, useEffect } from 'react';

import { Input } from '@verone/ui';
import { cn } from '@verone/utils';
import { Check, ChevronDown, X } from 'lucide-react';

export interface AttributeSelectOption {
  value: string;
  label: string;
}

interface AttributeSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: AttributeSelectOption[];
  allowCustom?: boolean;
  placeholder?: string;
  disabled?: boolean;
}

export function AttributeSelect({
  value,
  onChange,
  options,
  allowCustom = false,
  placeholder = '—',
  disabled = false,
}: AttributeSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [customMode, setCustomMode] = useState(false);
  const [customDraft, setCustomDraft] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Fermer si clic extérieur
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
        setSearch('');
        setCustomMode(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const filteredOptions = options.filter(opt =>
    opt.label.toLowerCase().includes(search.toLowerCase())
  );

  const displayLabel =
    options.find(o => o.value === value)?.label ?? (value || placeholder);
  const isCustomValue = value !== '' && !options.find(o => o.value === value);

  const handleSelect = useCallback(
    (optValue: string) => {
      onChange(optValue);
      setOpen(false);
      setSearch('');
      setCustomMode(false);
    },
    [onChange]
  );

  const handleCustomSave = useCallback(() => {
    const trimmed = customDraft.trim();
    if (!trimmed) return;
    onChange(trimmed);
    setCustomDraft('');
    setCustomMode(false);
    setOpen(false);
  }, [customDraft, onChange]);

  const handleClear = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onChange('');
    },
    [onChange]
  );

  if (disabled) {
    return (
      <span className="text-xs text-neutral-500 italic">{displayLabel}</span>
    );
  }

  return (
    <div ref={containerRef} className="relative">
      {/* Trigger row — wrapper div to allow Clear as sibling button (HTML interdit button-in-button) */}
      <div
        className={cn(
          'group flex items-center gap-1 w-full min-w-0',
          'rounded px-1 py-0.5 hover:bg-neutral-100 transition-colors'
        )}
      >
        <button
          type="button"
          onClick={() => {
            if (!open) {
              setOpen(true);
              setSearch('');
              setCustomMode(false);
              setTimeout(() => inputRef.current?.focus(), 50);
            } else {
              setOpen(false);
            }
          }}
          className="flex-1 flex items-center gap-1 min-w-0 text-left"
        >
          <span
            className={cn(
              'flex-1 text-xs truncate',
              value ? 'text-neutral-900' : 'text-neutral-400 italic',
              isCustomValue && 'text-violet-700'
            )}
          >
            {displayLabel}
          </span>
          <ChevronDown
            className={cn(
              'h-2.5 w-2.5 flex-shrink-0 text-neutral-400 transition-transform',
              open && 'rotate-180'
            )}
          />
        </button>
        {value && (
          <button
            type="button"
            onClick={handleClear}
            className="opacity-0 group-hover:opacity-100 h-4 w-4 flex items-center justify-center rounded text-neutral-400 hover:text-red-400 transition-opacity flex-shrink-0"
            aria-label="Effacer"
          >
            <X className="h-2.5 w-2.5" />
          </button>
        )}
      </div>

      {/* Popover */}
      {open && (
        <div className="absolute left-0 top-full mt-1 z-50 w-48 bg-white rounded-lg border border-neutral-200 shadow-sm overflow-hidden">
          {/* Search */}
          <div className="p-1.5 border-b border-neutral-100">
            <Input
              ref={inputRef}
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher..."
              className="h-6 text-xs px-1.5"
              onKeyDown={e => {
                if (e.key === 'Escape') {
                  setOpen(false);
                  setSearch('');
                }
              }}
            />
          </div>

          {/* Options list */}
          <div className="max-h-40 overflow-y-auto">
            {filteredOptions.length === 0 && !allowCustom && (
              <div className="px-2 py-2 text-[10px] text-neutral-400 italic">
                Aucun résultat
              </div>
            )}
            {filteredOptions.map(opt => (
              <button
                key={opt.value}
                type="button"
                onClick={() => handleSelect(opt.value)}
                className={cn(
                  'w-full flex items-center gap-2 px-2 py-1.5 text-xs text-left hover:bg-neutral-50 transition-colors',
                  opt.value === value && 'bg-indigo-50 text-indigo-700'
                )}
              >
                <span className="flex-1 truncate">{opt.label}</span>
                {opt.value === value && (
                  <Check className="h-3 w-3 flex-shrink-0 text-indigo-600" />
                )}
              </button>
            ))}
          </div>

          {/* Option "Autre..." custom */}
          {allowCustom && !customMode && (
            <div className="border-t border-neutral-100">
              <button
                type="button"
                onClick={() => {
                  setCustomMode(true);
                  setCustomDraft(isCustomValue ? value : '');
                }}
                className="w-full flex items-center gap-1.5 px-2 py-1.5 text-xs text-neutral-500 hover:bg-neutral-50 transition-colors"
              >
                Autre...
              </button>
            </div>
          )}
          {allowCustom && customMode && (
            <div className="border-t border-neutral-100 p-1.5 flex items-center gap-1">
              <Input
                autoFocus
                value={customDraft}
                onChange={e => setCustomDraft(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') handleCustomSave();
                  if (e.key === 'Escape') setCustomMode(false);
                }}
                placeholder="Valeur personnalisée"
                className="h-6 text-xs px-1.5 flex-1"
              />
              <button
                type="button"
                onClick={handleCustomSave}
                disabled={!customDraft.trim()}
                className="h-6 w-6 flex items-center justify-center rounded text-green-600 hover:bg-green-50 disabled:opacity-40"
                aria-label="Valider"
              >
                <Check className="h-3 w-3" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

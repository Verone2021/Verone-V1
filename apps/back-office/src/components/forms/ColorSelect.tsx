'use client';

import { useEffect, useRef, useState } from 'react';

import { cn } from '@verone/utils';
import { ChevronDown, Search, X } from 'lucide-react';

import { useActiveColorOptions } from '@/hooks/use-color-options';

interface ColorSelectProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function ColorSelect({
  value,
  onChange,
  placeholder = 'Rechercher une couleur…',
  className,
  disabled = false,
}: ColorSelectProps) {
  const { colorOptions, isLoading } = useActiveColorOptions();
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const selected = colorOptions.find(c => c.name === value) ?? null;

  const filtered = colorOptions.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
        setSearch('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Focus search when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => searchRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const handleSelect = (name: string) => {
    onChange(name);
    setIsOpen(false);
    setSearch('');
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
      setSearch('');
    }
  };

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      {/* Trigger */}
      <button
        type="button"
        disabled={disabled || isLoading}
        onClick={() => !disabled && setIsOpen(o => !o)}
        onKeyDown={handleKeyDown}
        className={cn(
          'flex w-full items-center justify-between gap-2 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm transition-colors',
          'hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-1',
          disabled && 'cursor-not-allowed opacity-50'
        )}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span className="flex items-center gap-2 min-w-0">
          {selected ? (
            <>
              <span
                className="inline-block h-4 w-4 flex-shrink-0 rounded-full border border-gray-300"
                style={{ backgroundColor: selected.hex_code }}
                aria-hidden
              />
              <span className="truncate">{selected.name}</span>
            </>
          ) : (
            <span className="text-gray-400 truncate">
              {isLoading ? 'Chargement…' : placeholder}
            </span>
          )}
        </span>
        <span className="flex items-center gap-1 flex-shrink-0">
          {value && !disabled && (
            <span
              onClick={handleClear}
              className="rounded p-0.5 hover:bg-gray-100 cursor-pointer"
              role="button"
              aria-label="Effacer la couleur"
            >
              <X className="h-3 w-3 text-gray-400" />
            </span>
          )}
          <ChevronDown
            className={cn(
              'h-4 w-4 text-gray-400 transition-transform',
              isOpen && 'rotate-180'
            )}
          />
        </span>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 mt-1 w-full rounded-md border border-gray-200 bg-white shadow-lg">
          <div className="flex items-center gap-2 border-b border-gray-100 px-3 py-2">
            <Search className="h-3.5 w-3.5 flex-shrink-0 text-gray-400" />
            <input
              ref={searchRef}
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher…"
              className="w-full text-sm outline-none placeholder:text-gray-400"
            />
          </div>

          <ul
            role="listbox"
            className="max-h-56 overflow-y-auto py-1"
            aria-label="Couleurs disponibles"
          >
            {filtered.length === 0 ? (
              <li className="px-3 py-2 text-sm text-gray-400 italic">
                Aucune couleur trouvée
              </li>
            ) : (
              filtered.map(c => (
                <li
                  key={c.id}
                  role="option"
                  aria-selected={c.name === value}
                  onClick={() => handleSelect(c.name)}
                  className={cn(
                    'flex cursor-pointer items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50',
                    c.name === value && 'bg-black text-white hover:bg-gray-800'
                  )}
                >
                  <span
                    className="inline-block h-4 w-4 flex-shrink-0 rounded-full border border-gray-300"
                    style={{ backgroundColor: c.hex_code }}
                    aria-hidden
                  />
                  <span className="truncate">{c.name}</span>
                  <code
                    className={cn(
                      'ml-auto text-xs font-mono flex-shrink-0',
                      c.name === value ? 'text-gray-300' : 'text-gray-400'
                    )}
                  >
                    {c.hex_code}
                  </code>
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
}

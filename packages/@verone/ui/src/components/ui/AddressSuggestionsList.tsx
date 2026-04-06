'use client';

import type { RefObject } from 'react';
import React from 'react';

import { MapPin, PenLine } from 'lucide-react';

import { cn } from '../../design-system/utils';
import type { AddressResult } from './address-autocomplete.types';

interface AddressSuggestionsListProps {
  suggestions: AddressResult[];
  isOpen: boolean;
  inputValue: string;
  isLoading: boolean;
  highlightedIndex: number;
  listRef: RefObject<HTMLUListElement | null>;
  inputId: string;
  apiKey: string;
  forceInternational: boolean;
  useInternational: boolean;
  onSelect: (suggestion: AddressResult) => void;
  onHighlight: (index: number) => void;
  onToggleInternational: () => void;
  onOpenManualMode: () => void;
}

export function AddressSuggestionsList({
  suggestions,
  isOpen,
  inputValue,
  isLoading,
  highlightedIndex,
  listRef,
  inputId,
  apiKey,
  forceInternational,
  useInternational,
  onSelect,
  onHighlight,
  onToggleInternational,
  onOpenManualMode,
}: AddressSuggestionsListProps) {
  if (!isOpen) return null;

  if (suggestions.length > 0) {
    return (
      <ul
        ref={listRef as React.RefObject<HTMLUListElement>}
        id={`${inputId}-listbox`}
        role="listbox"
        className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto"
      >
        {suggestions.map((suggestion, index) => (
          <li
            key={`${suggestion.label}-${index}`}
            id={`${inputId}-option-${index}`}
            role="option"
            aria-selected={highlightedIndex === index}
            onClick={() => onSelect(suggestion)}
            onMouseEnter={() => onHighlight(index)}
            className={cn(
              'px-4 py-3 cursor-pointer transition-colors',
              'border-b border-gray-100 last:border-b-0',
              highlightedIndex === index ? 'bg-blue-50' : 'hover:bg-gray-50'
            )}
          >
            <div className="flex items-start gap-3">
              <MapPin
                className={cn(
                  'h-4 w-4 mt-0.5 flex-shrink-0',
                  suggestion.source === 'ban'
                    ? 'text-blue-500'
                    : 'text-green-500'
                )}
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {suggestion.streetAddress || suggestion.label}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {suggestion.postalCode} {suggestion.city}
                  {suggestion.country !== 'France' &&
                    ` - ${suggestion.country}`}
                </p>
              </div>
              <span
                className={cn(
                  'text-[10px] px-1.5 py-0.5 rounded font-medium flex-shrink-0',
                  suggestion.source === 'ban'
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-green-100 text-green-700'
                )}
              >
                {suggestion.source === 'ban' ? 'FR' : 'INT'}
              </span>
            </div>
          </li>
        ))}
      </ul>
    );
  }

  if (inputValue.length >= 3 && !isLoading) {
    return (
      <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-4 text-center">
        <p className="text-sm text-gray-500">Aucune adresse trouvee</p>
        <div className="flex flex-col gap-2 mt-2">
          {!useInternational && apiKey && !forceInternational && (
            <button
              type="button"
              onClick={onToggleInternational}
              className="text-sm text-blue-600 hover:underline"
            >
              Essayer la recherche internationale
            </button>
          )}
          <button
            type="button"
            onClick={onOpenManualMode}
            className="text-sm text-gray-600 hover:text-gray-900 hover:underline flex items-center justify-center gap-1"
          >
            <PenLine className="h-3 w-3" />
            Saisir manuellement
          </button>
        </div>
      </div>
    );
  }

  return null;
}

'use client';

/**
 * AddressAutocomplete Component
 *
 * Composant d'autocomplétion d'adresse avec géocodage automatique.
 * Utilise une stratégie dual-API:
 * - API BAN (adresse.data.gouv.fr) pour les adresses françaises (GRATUIT)
 * - Geoapify pour les adresses internationales
 *
 * @module AddressAutocomplete
 * @since 2026-01-11
 */

import {
  useState,
  useEffect,
  useRef,
  useCallback,
  type KeyboardEvent,
} from 'react';

import { MapPin, Loader2, Globe, X } from 'lucide-react';

import { cn } from '../../design-system/utils';
import {
  searchBan,
  searchGeoapify,
  seemsFrench,
} from './address-autocomplete.api';
import type {
  AddressResult,
  AddressAutocompleteProps,
} from './address-autocomplete.types';
import { AddressManualForm, AddressManualModeLink } from './AddressManualForm';
import { AddressSuggestionsList } from './AddressSuggestionsList';

export type { AddressResult, AddressAutocompleteProps };

export function AddressAutocomplete({
  value = '',
  onChange,
  onSelect,
  placeholder = 'Rechercher une adresse...',
  label,
  error,
  disabled = false,
  className,
  forceInternational = false,
  geoapifyApiKey,
  defaultCountry,
  id,
  showGpsFields = false,
}: AddressAutocompleteProps) {
  const [inputValue, setInputValue] = useState(value);
  const [suggestions, setSuggestions] = useState<AddressResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [useInternational, setUseInternational] = useState(forceInternational);
  const [manualMode, setManualMode] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const debounceRef = useRef<NodeJS.Timeout>();

  const apiKey =
    geoapifyApiKey ??
    (typeof window !== 'undefined'
      ? (process.env.NEXT_PUBLIC_GEOAPIFY_API_KEY ?? '')
      : '');

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  const handleSearch = useCallback(
    async (query: string) => {
      if (query.length < 3) {
        setSuggestions([]);
        setIsOpen(false);
        return;
      }

      setIsLoading(true);

      try {
        let results: AddressResult[] = [];

        if (forceInternational || useInternational || !seemsFrench(query)) {
          if (apiKey) {
            results = await searchGeoapify(query, apiKey, defaultCountry);
          }
        }

        if (results.length === 0 && !forceInternational) {
          results = await searchBan(query);
        }

        if (results.length === 0 && apiKey && !forceInternational) {
          results = await searchGeoapify(query, apiKey, defaultCountry);
        }

        setSuggestions(results);
        setIsOpen(results.length > 0);
        setHighlightedIndex(-1);
      } catch (err) {
        console.error('Address search error:', err);
        setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    },
    [apiKey, defaultCountry, forceInternational, useInternational]
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      setInputValue(newValue);
      onChange?.(newValue);

      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }

      debounceRef.current = setTimeout(() => {
        void handleSearch(newValue);
      }, 300);
    },
    [onChange, handleSearch]
  );

  const handleSelectSuggestion = useCallback(
    (suggestion: AddressResult) => {
      setInputValue(suggestion.label);
      onChange?.(suggestion.label);
      onSelect?.(suggestion);
      setIsOpen(false);
      setSuggestions([]);
      setHighlightedIndex(-1);
    },
    [onChange, onSelect]
  );

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (!isOpen) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setHighlightedIndex(prev =>
            prev < suggestions.length - 1 ? prev + 1 : prev
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setHighlightedIndex(prev => (prev > 0 ? prev - 1 : prev));
          break;
        case 'Enter':
          e.preventDefault();
          if (highlightedIndex >= 0 && suggestions[highlightedIndex]) {
            handleSelectSuggestion(suggestions[highlightedIndex]);
          }
          break;
        case 'Escape':
          setIsOpen(false);
          setHighlightedIndex(-1);
          break;
      }
    },
    [isOpen, suggestions, highlightedIndex, handleSelectSuggestion]
  );

  const handleClear = useCallback(() => {
    setInputValue('');
    onChange?.('');
    setSuggestions([]);
    setIsOpen(false);
    inputRef.current?.focus();
  }, [onChange]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        inputRef.current &&
        !inputRef.current.contains(e.target as Node) &&
        listRef.current &&
        !listRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  const inputId = id ?? 'address-autocomplete';

  return (
    <div className={cn('relative', className)}>
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          {label}
        </label>
      )}

      <div className="relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <MapPin className="h-4 w-4" />
          )}
        </div>

        <input
          ref={inputRef}
          id={inputId}
          role="combobox"
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (suggestions.length > 0) setIsOpen(true);
          }}
          placeholder={placeholder}
          disabled={disabled}
          autoComplete="off"
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          aria-controls={`${inputId}-listbox`}
          aria-activedescendant={
            highlightedIndex >= 0
              ? `${inputId}-option-${highlightedIndex}`
              : undefined
          }
          className={cn(
            'w-full pl-10 pr-16 py-2.5 border rounded-lg',
            'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
            'disabled:bg-gray-100 disabled:cursor-not-allowed',
            'transition-colors',
            error ? 'border-red-500' : 'border-gray-300',
            disabled && 'opacity-60'
          )}
        />

        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {apiKey && !forceInternational && (
            <button
              type="button"
              onClick={() => {
                setUseInternational(!useInternational);
                if (inputValue.length >= 3) {
                  void handleSearch(inputValue);
                }
              }}
              title={
                useInternational
                  ? 'Mode international actif'
                  : 'Activer le mode international'
              }
              className={cn(
                'p-1.5 rounded transition-colors',
                useInternational
                  ? 'bg-blue-100 text-blue-600'
                  : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
              )}
            >
              <Globe className="h-4 w-4" />
            </button>
          )}

          {inputValue && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
              title="Effacer"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}

      {!manualMode && (
        <AddressSuggestionsList
          suggestions={suggestions}
          isOpen={isOpen}
          inputValue={inputValue}
          isLoading={isLoading}
          highlightedIndex={highlightedIndex}
          listRef={listRef}
          inputId={inputId}
          apiKey={apiKey}
          forceInternational={forceInternational}
          useInternational={useInternational}
          onSelect={handleSelectSuggestion}
          onHighlight={setHighlightedIndex}
          onToggleInternational={() => {
            setUseInternational(true);
            void handleSearch(inputValue);
          }}
          onOpenManualMode={() => {
            setManualMode(true);
            setIsOpen(false);
          }}
        />
      )}

      <AddressManualModeLink
        disabled={disabled || manualMode}
        onOpen={() => setManualMode(true)}
      />

      {manualMode && (
        <AddressManualForm
          showGpsFields={showGpsFields}
          onChange={onChange}
          onSelect={onSelect}
          onClose={() => setManualMode(false)}
          setInputValue={setInputValue}
        />
      )}
    </div>
  );
}

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

import { MapPin, Loader2, Globe, X, PenLine } from 'lucide-react';

import { cn } from '../../design-system/utils';

// =====================================================================
// TYPES
// =====================================================================

export interface AddressResult {
  /** Adresse formatée complète */
  label: string;
  /** Numéro et rue */
  streetAddress: string;
  /** Ville */
  city: string;
  /** Code postal */
  postalCode: string;
  /** Région/Département */
  region?: string;
  /** Code pays (ISO 2) */
  countryCode: string;
  /** Nom du pays */
  country: string;
  /** Latitude */
  latitude: number;
  /** Longitude */
  longitude: number;
  /** Source de l'API (ban ou geoapify) */
  source: 'ban' | 'geoapify';
}

export interface AddressAutocompleteProps {
  /** Valeur actuelle (adresse texte) */
  value?: string;
  /** Callback quand l'utilisateur tape */
  onChange?: (value: string) => void;
  /** Callback quand une adresse est sélectionnée */
  onSelect?: (address: AddressResult) => void;
  /** Placeholder */
  placeholder?: string;
  /** Label du champ */
  label?: string;
  /** Message d'erreur */
  error?: string;
  /** Désactiver le champ */
  disabled?: boolean;
  /** Classes CSS additionnelles */
  className?: string;
  /** Forcer l'utilisation de Geoapify (international) */
  forceInternational?: boolean;
  /** Clé API Geoapify (si non définie dans env) */
  geoapifyApiKey?: string;
  /** Pays par défaut pour filtrer les résultats */
  defaultCountry?: string;
  /** ID unique pour l'accessibilité */
  id?: string;
  /** Afficher les champs GPS en saisie manuelle (pour adresses de livraison) */
  showGpsFields?: boolean;
}

interface BanFeature {
  type: string;
  geometry: {
    type: string;
    coordinates: [number, number];
  };
  properties: {
    label: string;
    score: number;
    housenumber?: string;
    street?: string;
    name?: string;
    postcode: string;
    citycode: string;
    city: string;
    context: string;
    type: string;
    importance: number;
    x: number;
    y: number;
  };
}

interface BanResponse {
  type: string;
  version: string;
  features: BanFeature[];
  attribution: string;
  licence: string;
  query: string;
  limit: number;
}

interface GeoapifyFeature {
  type: string;
  properties: {
    name?: string;
    housenumber?: string;
    street?: string;
    postcode?: string;
    city?: string;
    state?: string;
    country?: string;
    country_code?: string;
    formatted: string;
    lat: number;
    lon: number;
  };
  geometry: {
    type: string;
    coordinates: [number, number];
  };
}

interface GeoapifyResponse {
  type: string;
  features: GeoapifyFeature[];
}

// =====================================================================
// API FUNCTIONS
// =====================================================================

/**
 * Recherche d'adresses via l'API BAN (France)
 */
async function searchBan(query: string): Promise<AddressResult[]> {
  if (!query || query.length < 3) return [];

  try {
    const response = await fetch(
      `https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(query)}&limit=5&autocomplete=1`
    );

    if (!response.ok) {
      throw new Error(`BAN API error: ${response.status}`);
    }

    const data = (await response.json()) as BanResponse;

    return data.features.map(feature => ({
      label: feature.properties.label,
      streetAddress: feature.properties.housenumber
        ? `${feature.properties.housenumber} ${feature.properties.street ?? feature.properties.name ?? ''}`
        : (feature.properties.street ??
          feature.properties.name ??
          feature.properties.label),
      city: feature.properties.city,
      postalCode: feature.properties.postcode,
      region: feature.properties.context?.split(',')[1]?.trim(),
      countryCode: 'FR',
      country: 'France',
      latitude: feature.geometry.coordinates[1],
      longitude: feature.geometry.coordinates[0],
      source: 'ban' as const,
    }));
  } catch (error) {
    console.error('BAN API error:', error);
    return [];
  }
}

/**
 * Recherche d'adresses via Geoapify (International)
 */
async function searchGeoapify(
  query: string,
  apiKey: string,
  countryCode?: string
): Promise<AddressResult[]> {
  if (!query || query.length < 3 || !apiKey) return [];

  try {
    let url = `https://api.geoapify.com/v1/geocode/autocomplete?text=${encodeURIComponent(query)}&limit=5&apiKey=${apiKey}`;

    if (countryCode) {
      url += `&filter=countrycode:${countryCode.toLowerCase()}`;
    }

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Geoapify API error: ${response.status}`);
    }

    const data = (await response.json()) as GeoapifyResponse;

    return data.features.map(feature => ({
      label: feature.properties.formatted,
      streetAddress: feature.properties.housenumber
        ? `${feature.properties.housenumber} ${feature.properties.street ?? ''}`
        : (feature.properties.street ?? feature.properties.name ?? ''),
      city: feature.properties.city ?? '',
      postalCode: feature.properties.postcode ?? '',
      region: feature.properties.state,
      countryCode: feature.properties.country_code?.toUpperCase() ?? '',
      country: feature.properties.country ?? '',
      latitude: feature.properties.lat,
      longitude: feature.properties.lon,
      source: 'geoapify' as const,
    }));
  } catch (error) {
    console.error('Geoapify API error:', error);
    return [];
  }
}

/**
 * Détecte si une requête semble être française
 */
function seemsFrench(query: string): boolean {
  // Patterns français: code postal 5 chiffres, villes connues, etc.
  const frenchPatterns = [
    /\b\d{5}\b/, // Code postal français
    /\bfrance\b/i,
    /\bparis\b/i,
    /\blyon\b/i,
    /\bmarseille\b/i,
    /\btoulouse\b/i,
    /\bnice\b/i,
    /\bnantes\b/i,
    /\bstrasbourg\b/i,
    /\bmontpellier\b/i,
    /\bbordeaux\b/i,
    /\blille\b/i,
    /\brennes\b/i,
    /\breims\b/i,
    /\bsaint-/i,
    /\brue\b/i,
    /\bavenue\b/i,
    /\bboulevard\b/i,
    /\bplace\b/i,
    /\bimpasse\b/i,
    /\ballée\b/i,
  ];

  return frenchPatterns.some(pattern => pattern.test(query));
}

// =====================================================================
// COMPONENT
// =====================================================================

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
  const [manualFields, setManualFields] = useState({
    street: '',
    postalCode: '',
    city: '',
    country: 'France',
    countryCode: 'FR',
    latitude: '',
    longitude: '',
  });

  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const debounceRef = useRef<NodeJS.Timeout>();

  // Get API key from props or environment
  const apiKey =
    geoapifyApiKey ??
    (typeof window !== 'undefined'
      ? (process.env.NEXT_PUBLIC_GEOAPIFY_API_KEY ?? '')
      : '');

  // Sync with external value
  useEffect(() => {
    setInputValue(value);
  }, [value]);

  // Search function with debounce
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

        // Si on force l'international ou si la requête ne semble pas française
        if (forceInternational || useInternational || !seemsFrench(query)) {
          if (apiKey) {
            results = await searchGeoapify(query, apiKey, defaultCountry);
          }
        }

        // Si pas de résultats internationaux ou si ça semble français, essayer BAN
        if (results.length === 0 && !forceInternational) {
          results = await searchBan(query);
        }

        // Si toujours pas de résultats et qu'on a une clé Geoapify, fallback
        if (results.length === 0 && apiKey && !forceInternational) {
          results = await searchGeoapify(query, apiKey, defaultCountry);
        }

        setSuggestions(results);
        setIsOpen(results.length > 0);
        setHighlightedIndex(-1);
      } catch (error) {
        console.error('Address search error:', error);
        setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    },
    [apiKey, defaultCountry, forceInternational, useInternational]
  );

  // Handle input change with debounce
  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      setInputValue(newValue);
      onChange?.(newValue);

      // Clear previous timeout
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }

      // Debounce search
      debounceRef.current = setTimeout(() => {
        void handleSearch(newValue);
      }, 300);
    },
    [onChange, handleSearch]
  );

  // Handle suggestion selection
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

  // Keyboard navigation
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

  // Clear input
  const handleClear = useCallback(() => {
    setInputValue('');
    onChange?.('');
    setSuggestions([]);
    setIsOpen(false);
    inputRef.current?.focus();
  }, [onChange]);

  // Close on click outside
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

  // Cleanup debounce on unmount
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
      {/* Label */}
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          {label}
        </label>
      )}

      {/* Input container */}
      <div className="relative">
        {/* Icon */}
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <MapPin className="h-4 w-4" />
          )}
        </div>

        {/* Input */}
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

        {/* Actions */}
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {/* Toggle international */}
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

          {/* Clear button */}
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

      {/* Error message */}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}

      {/* Suggestions dropdown */}
      {isOpen && suggestions.length > 0 && (
        <ul
          ref={listRef}
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
              onClick={() => handleSelectSuggestion(suggestion)}
              onMouseEnter={() => setHighlightedIndex(index)}
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
                {/* Source badge */}
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
      )}

      {/* No results message */}
      {isOpen &&
        suggestions.length === 0 &&
        inputValue.length >= 3 &&
        !isLoading &&
        !manualMode && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-4 text-center">
            <p className="text-sm text-gray-500">Aucune adresse trouvee</p>
            <div className="flex flex-col gap-2 mt-2">
              {!useInternational && apiKey && (
                <button
                  type="button"
                  onClick={() => {
                    setUseInternational(true);
                    void handleSearch(inputValue);
                  }}
                  className="text-sm text-blue-600 hover:underline"
                >
                  Essayer la recherche internationale
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  setManualMode(true);
                  setIsOpen(false);
                }}
                className="text-sm text-gray-600 hover:text-gray-900 hover:underline flex items-center justify-center gap-1"
              >
                <PenLine className="h-3 w-3" />
                Saisir manuellement
              </button>
            </div>
          </div>
        )}

      {/* Manual mode link (always visible when not in manual mode) */}
      {!manualMode && !disabled && (
        <button
          type="button"
          onClick={() => setManualMode(true)}
          className="mt-1 text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1"
        >
          <PenLine className="h-3 w-3" />
          Saisir manuellement
        </button>
      )}

      {/* Manual entry form */}
      {manualMode && (
        <div className="mt-2 border border-gray-200 rounded-lg p-4 bg-gray-50 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">
              Saisie manuelle
            </span>
            <button
              type="button"
              onClick={() => setManualMode(false)}
              className="text-xs text-gray-400 hover:text-gray-600"
            >
              Retour a la recherche
            </button>
          </div>

          <div className="space-y-2">
            <input
              type="text"
              placeholder="Numero et rue"
              value={manualFields.street}
              onChange={e =>
                setManualFields(f => ({ ...f, street: e.target.value }))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                placeholder="Code postal"
                value={manualFields.postalCode}
                onChange={e =>
                  setManualFields(f => ({ ...f, postalCode: e.target.value }))
                }
                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="text"
                placeholder="Ville"
                value={manualFields.city}
                onChange={e =>
                  setManualFields(f => ({ ...f, city: e.target.value }))
                }
                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                placeholder="Pays"
                value={manualFields.country}
                onChange={e =>
                  setManualFields(f => ({ ...f, country: e.target.value }))
                }
                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="text"
                placeholder="Code pays (FR, BE...)"
                value={manualFields.countryCode}
                onChange={e =>
                  setManualFields(f => ({
                    ...f,
                    countryCode: e.target.value.toUpperCase(),
                  }))
                }
                maxLength={2}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            {showGpsFields && (
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="Latitude"
                  value={manualFields.latitude}
                  onChange={e =>
                    setManualFields(f => ({ ...f, latitude: e.target.value }))
                  }
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="text"
                  placeholder="Longitude"
                  value={manualFields.longitude}
                  onChange={e =>
                    setManualFields(f => ({ ...f, longitude: e.target.value }))
                  }
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}
          </div>

          <button
            type="button"
            disabled={
              !manualFields.street ||
              !manualFields.postalCode ||
              !manualFields.city
            }
            onClick={() => {
              const label = [
                manualFields.street,
                manualFields.postalCode,
                manualFields.city,
                manualFields.country !== 'France' ? manualFields.country : '',
              ]
                .filter(Boolean)
                .join(', ');

              const result: AddressResult = {
                label,
                streetAddress: manualFields.street,
                city: manualFields.city,
                postalCode: manualFields.postalCode,
                countryCode: manualFields.countryCode || 'FR',
                country: manualFields.country || 'France',
                latitude: parseFloat(manualFields.latitude) || 0,
                longitude: parseFloat(manualFields.longitude) || 0,
                source: 'ban',
              };

              setInputValue(label);
              onChange?.(label);
              onSelect?.(result);
              setManualMode(false);
              setManualFields({
                street: '',
                postalCode: '',
                city: '',
                country: 'France',
                countryCode: 'FR',
                latitude: '',
                longitude: '',
              });
            }}
            className={cn(
              'w-full py-2 px-4 rounded-md text-sm font-medium transition-colors',
              !manualFields.street ||
                !manualFields.postalCode ||
                !manualFields.city
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : 'bg-black text-white hover:bg-gray-800'
            )}
          >
            Valider l&apos;adresse
          </button>
        </div>
      )}
    </div>
  );
}

export default AddressAutocomplete;

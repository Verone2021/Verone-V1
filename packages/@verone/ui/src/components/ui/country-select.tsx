'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './select';

/**
 * Converts an ISO 3166-1 alpha-2 country code to its flag emoji.
 * Uses regional indicator symbols (Unicode offset trick).
 */
export function getCountryFlag(code: string): string {
  if (code === 'OTHER') return '';
  const upper = code.toUpperCase();
  const offset = 0x1f1e6 - 65; // 'A' = 65
  return String.fromCodePoint(
    upper.charCodeAt(0) + offset,
    upper.charCodeAt(1) + offset
  );
}

export const COUNTRIES = [
  { code: 'FR', name: 'France' },
  { code: 'BE', name: 'Belgique' },
  { code: 'CH', name: 'Suisse' },
  { code: 'LU', name: 'Luxembourg' },
  { code: 'DE', name: 'Allemagne' },
  { code: 'IT', name: 'Italie' },
  { code: 'ES', name: 'Espagne' },
  { code: 'GB', name: 'Royaume-Uni' },
  { code: 'NL', name: 'Pays-Bas' },
  { code: 'PT', name: 'Portugal' },
  { code: 'PL', name: 'Pologne' },
  { code: 'DK', name: 'Danemark' },
  { code: 'SE', name: 'Suède' },
  { code: 'AT', name: 'Autriche' },
  { code: 'CN', name: 'Chine' },
  { code: 'TR', name: 'Turquie' },
  { code: 'IN', name: 'Inde' },
  { code: 'US', name: 'États-Unis' },
  { code: 'MA', name: 'Maroc' },
  { code: 'OTHER', name: 'Autre' },
] as const;

interface CountrySelectProps {
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
}

export function CountrySelect({
  value,
  onChange,
  placeholder = 'Sélectionner un pays',
  disabled = false,
  className,
}: CountrySelectProps) {
  return (
    <Select
      value={value ?? 'none'}
      onValueChange={v => onChange(v === 'none' ? '' : v)}
      disabled={disabled}
    >
      <SelectTrigger className={className}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="none">
          <span className="text-gray-500">{placeholder}</span>
        </SelectItem>
        {COUNTRIES.map(country => (
          <SelectItem key={country.code} value={country.code}>
            <span className="flex items-center gap-2">
              {country.code !== 'OTHER' && (
                <span>{getCountryFlag(country.code)}</span>
              )}
              <span>{country.name}</span>
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

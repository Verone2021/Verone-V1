/**
 * Utilitaires de formatage pour les codes pays et autres données géographiques
 */

// Mapping des codes pays vers les noms complets
const COUNTRY_MAPPING = {
  'FR': 'France',
  'ES': 'Espagne', 
  'PT': 'Portugal',
  'DE': 'Allemagne',
  'IT': 'Italie',
  'BE': 'Belgique',
  'CH': 'Suisse',
  'LU': 'Luxembourg',
  'NL': 'Pays-Bas',
  'GB': 'Royaume-Uni',
  'US': 'États-Unis',
  'CA': 'Canada',
  'MA': 'Maroc',
  'TN': 'Tunisie',
  'DZ': 'Algérie',
  'SN': 'Sénégal',
  'CI': 'Côte d\'Ivoire',
  'MX': 'Mexique',
  'BR': 'Brésil',
  'AR': 'Argentine',
  'CL': 'Chili',
  'CO': 'Colombie',
  'PE': 'Pérou',
  'UY': 'Uruguay',
  'PY': 'Paraguay',
  'BO': 'Bolivie',
  'EC': 'Équateur',
  'VE': 'Venezuela',
  'GF': 'Guyane française',
  'GP': 'Guadeloupe',
  'MQ': 'Martinique',
  'RE': 'Réunion',
  'YT': 'Mayotte',
  'NC': 'Nouvelle-Calédonie',
  'PF': 'Polynésie française',
  'WF': 'Wallis-et-Futuna',
  'PM': 'Saint-Pierre-et-Miquelon',
  'BL': 'Saint-Barthélemy',
  'MF': 'Saint-Martin',
  'TF': 'Terres australes et antarctiques françaises'
} as const

type CountryCode = keyof typeof COUNTRY_MAPPING

/**
 * Convertit un code pays (ISO 2 lettres) en nom complet
 * 
 * @param countryCode - Code pays à 2 lettres (ex: 'FR', 'ES')
 * @returns Nom complet du pays ou code original si non trouvé
 * 
 * @example
 * formatCountryName('FR') // 'France'
 * formatCountryName('ES') // 'Espagne'  
 * formatCountryName('XX') // 'XX' (code inconnu)
 */
export function formatCountryName(countryCode?: string | null): string {
  if (!countryCode) return 'Non spécifié'
  
  const upperCode = countryCode.toUpperCase() as CountryCode
  return COUNTRY_MAPPING[upperCode] || countryCode
}

/**
 * Formate une adresse complète avec pays en nom complet
 * 
 * @param address - Adresse de base
 * @param postalCode - Code postal 
 * @param city - Ville
 * @param countryCode - Code pays
 * @returns Adresse formatée complète
 * 
 * @example
 * formatFullAddress('123 Rue de la Paix', '75001', 'Paris', 'FR')
 * // '123 Rue de la Paix, 75001 Paris, France'
 */
export function formatFullAddress(
  address?: string | null,
  postalCode?: string | null, 
  city?: string | null,
  countryCode?: string | null
): string {
  const parts: string[] = []
  
  if (address) parts.push(address)
  
  const locationParts: string[] = []
  if (postalCode) locationParts.push(postalCode)
  if (city) locationParts.push(city)
  
  if (locationParts.length > 0) {
    parts.push(locationParts.join(' '))
  }
  
  const countryName = formatCountryName(countryCode)
  if (countryName !== 'Non spécifié') {
    parts.push(countryName)
  }
  
  return parts.join(', ')
}

/**
 * Formate l'affichage géographique pour les cartes de propriétés
 * 
 * @param city - Ville
 * @param countryCode - Code pays
 * @returns Affichage ville + pays
 * 
 * @example
 * formatCityCountry('Paris', 'FR') // 'Paris, France'
 * formatCityCountry('Barcelona', 'ES') // 'Barcelona, Espagne'
 */
export function formatCityCountry(
  city?: string | null,
  countryCode?: string | null
): string {
  const parts: string[] = []
  
  if (city) parts.push(city)
  
  const countryName = formatCountryName(countryCode)
  if (countryName !== 'Non spécifié') {
    parts.push(countryName)
  }
  
  return parts.join(', ')
}

/**
 * Retourne la liste de tous les pays supportés
 * Utile pour les dropdowns de sélection
 */
export function getSupportedCountries(): Array<{ code: string, name: string }> {
  return Object.entries(COUNTRY_MAPPING).map(([code, name]) => ({
    code,
    name
  })).sort((a, b) => a.name.localeCompare(b.name, 'fr'))
}

/**
 * Vérifie si un code pays est supporté
 */
export function isValidCountryCode(code?: string): boolean {
  if (!code) return false
  return code.toUpperCase() in COUNTRY_MAPPING
}

/**
 * Retourne le drapeau emoji pour un pays (si disponible)
 * 
 * @param countryCode - Code pays à 2 lettres
 * @returns Emoji drapeau ou chaîne vide
 */
export function getCountryFlag(countryCode?: string): string {
  if (!countryCode || countryCode.length !== 2) return ''
  
  const flagEmojis: Record<string, string> = {
    'FR': '🇫🇷',
    'ES': '🇪🇸', 
    'PT': '🇵🇹',
    'DE': '🇩🇪',
    'IT': '🇮🇹',
    'BE': '🇧🇪',
    'CH': '🇨🇭',
    'LU': '🇱🇺',
    'NL': '🇳🇱',
    'GB': '🇬🇧',
    'US': '🇺🇸',
    'CA': '🇨🇦',
    'MA': '🇲🇦',
    'TN': '🇹🇳',
    'DZ': '🇩🇿',
    'MX': '🇲🇽',
    'BR': '🇧🇷'
  }
  
  return flagEmojis[countryCode.toUpperCase()] || ''
}
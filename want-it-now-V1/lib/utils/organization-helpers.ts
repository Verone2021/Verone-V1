/**
 * Fonctions utilitaires pour la gestion des organisations
 * Want It Now V1 - Système multi-pays
 */

export interface OrganizationDisplayInfo {
  displayName: string
  countryCode: string
  countryName: string
}

/**
 * Obtient le nom d'affichage de l'organisation basé sur le code pays
 * Suit l'architecture métier : une organisation par pays
 */
export function getOrganizationDisplayName(countryCode: string): string {
  const organizationNames: Record<string, string> = {
    'FR': 'Want It Now France',
    'PT': 'Want It Now Portugal', 
    'ES': 'Want It Now España',
    'IT': 'Want It Now Italia',
    'DE': 'Want It Now Deutschland',
    'BE': 'Want It Now Belgique',
    'CH': 'Want It Now Suisse',
    'LU': 'Want It Now Luxembourg'
  }
  
  return organizationNames[countryCode] || `Want It Now ${countryCode}`
}

/**
 * Obtient les informations complètes d'affichage d'une organisation
 */
export function getOrganizationDisplayInfo(countryCode: string): OrganizationDisplayInfo {
  const countryNames: Record<string, string> = {
    'FR': 'France',
    'PT': 'Portugal',
    'ES': 'Espagne',
    'IT': 'Italie',
    'DE': 'Allemagne',
    'BE': 'Belgique',
    'CH': 'Suisse',
    'LU': 'Luxembourg'
  }

  return {
    displayName: getOrganizationDisplayName(countryCode),
    countryCode,
    countryName: countryNames[countryCode] || countryCode
  }
}

/**
 * Obtient l'emoji du drapeau pour un code pays
 */
export function getCountryFlag(countryCode: string): string {
  const flags: Record<string, string> = {
    'FR': '🇫🇷',
    'PT': '🇵🇹',
    'ES': '🇪🇸',
    'IT': '🇮🇹',
    'DE': '🇩🇪',
    'BE': '🇧🇪',
    'CH': '🇨🇭',
    'LU': '🇱🇺'
  }
  
  return flags[countryCode] || '🌍'
}

/**
 * Valide si le code pays est supporté
 */
export function isSupportedCountry(countryCode: string): boolean {
  const supportedCountries = ['FR', 'PT', 'ES', 'IT', 'DE', 'BE', 'CH', 'LU']
  return supportedCountries.includes(countryCode)
}
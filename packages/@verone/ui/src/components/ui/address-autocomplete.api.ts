import type {
  AddressResult,
  BanResponse,
  GeoapifyResponse,
} from './address-autocomplete.types';

/**
 * Recherche d'adresses via l'API BAN (France)
 */
export async function searchBan(query: string): Promise<AddressResult[]> {
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
export async function searchGeoapify(
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
export function seemsFrench(query: string): boolean {
  const frenchPatterns = [
    /\b\d{5}\b/,
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

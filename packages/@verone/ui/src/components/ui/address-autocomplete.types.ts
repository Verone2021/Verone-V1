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

export interface BanFeature {
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

export interface BanResponse {
  type: string;
  version: string;
  features: BanFeature[];
  attribution: string;
  licence: string;
  query: string;
  limit: number;
}

export interface GeoapifyFeature {
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

export interface GeoapifyResponse {
  type: string;
  features: GeoapifyFeature[];
}

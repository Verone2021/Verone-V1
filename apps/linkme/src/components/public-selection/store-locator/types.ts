/**
 * Types partagés pour StoreLocatorMap et ses sous-composants
 *
 * @module store-locator/types
 * @since 2026-04-14
 */

export interface IBranding {
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  text_color: string;
  background_color: string;
  logo_url: string | null;
}

export interface IOrganisation {
  id: string;
  name: string;
  address: string | null;
  city: string | null;
  postalCode: string | null;
  country: string | null;
  phone: string | null;
  email: string | null;
  latitude: number | null;
  longitude: number | null;
}

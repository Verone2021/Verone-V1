/**
 * @verone/types
 * Types TypeScript partagés pour le monorepo Vérone
 */

// Supabase Database Types (primary source)
export type * from './supabase';

// Re-export specific types from database.ts to avoid conflicts
// database.ts contains extended/helper types based on supabase types

// Business Domain Types
export * from './collections';
export * from './variant-groups';
export * from './variant-attributes-types';
export type * from './reception-shipment';
export * from './room-types';
export type * from './business-rules';

// Types business réexportés depuis supabase (via Database type)
import type { Database } from './supabase';

export type Contact = Database['public']['Tables']['contacts']['Row'];
export type Product = Database['public']['Tables']['products']['Row'];
export type Collection = Database['public']['Tables']['collections']['Row'];

// Types organisations (base DB)
export type OrganisationRow =
  Database['public']['Tables']['organisations']['Row'];
export type OrganisationInsert =
  Database['public']['Tables']['organisations']['Insert'];
export type OrganisationUpdate =
  Database['public']['Tables']['organisations']['Update'];

// Type Organisation avec champ "name" calculé (trade_name || legal_name)
export type Organisation = OrganisationRow & {
  name: string; // Nom d'affichage calculé
  _count?: {
    products: number; // Comptage produits pour fournisseurs
  };
  enseigne?: {
    name: string; // Nom de l'enseigne (jointure enseignes.name)
  } | null;
};

// Types créations
export type CreateCollectionData =
  Database['public']['Tables']['collections']['Insert'];

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

// Types créations
export type CreateCollectionData =
  Database['public']['Tables']['collections']['Insert'];

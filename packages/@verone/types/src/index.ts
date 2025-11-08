/**
 * @verone/types
 * Types TypeScript partagés pour le monorepo Vérone
 */

// Supabase Database Types (primary source)
export * from './supabase';

// Re-export specific types from database.ts to avoid conflicts
// database.ts contains extended/helper types based on supabase types

// Business Domain Types
export * from './collections';
export * from './variant-groups';
export * from './variant-attributes-types';
export type * from './reception-shipment';
export * from './room-types';
export type * from './business-rules';

/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
/**
 * Supabase Database Types
 * Re-exported from back-office source of truth
 *
 * @ts-nocheck is required because TypeScript's rootDir check doesn't allow
 * importing from outside the package boundary, but this is valid in a
 * monorepo context where all packages share the same git repo.
 */
export type {
  Database,
  Json,
} from '../../../../apps/back-office/src/types/supabase';

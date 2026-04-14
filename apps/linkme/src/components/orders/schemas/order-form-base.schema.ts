/**
 * Schemas de base réutilisables pour le formulaire de commande
 *
 * @module order-form-base.schema
 * @since 2026-04-14 (extrait de order-form.schema.ts)
 */

import { z } from 'zod';

// ============================================================================
// CONTACTS
// ============================================================================

export const contactBaseSchema = z.object({
  firstName: z.string().min(2, 'Prénom requis (min. 2 caractères)'),
  lastName: z.string().min(2, 'Nom requis (min. 2 caractères)'),
  email: z.string().email('Email invalide'),
  phone: z.string().min(1, 'Le téléphone est requis'),
  position: z.string().optional(),
  company: z.string().optional(),
});

export type ContactBase = z.infer<typeof contactBaseSchema>;

export const contactModeSchema = z.enum([
  'existing',
  'new',
  'same_as_responsable',
]);
export type ContactMode = z.infer<typeof contactModeSchema>;

export const contactWithModeSchema = z.object({
  mode: contactModeSchema,
  existingContactId: z.string().uuid().optional().nullable(),
  contact: contactBaseSchema.optional().nullable(),
});

export type ContactWithMode = z.infer<typeof contactWithModeSchema>;

// ============================================================================
// ADDRESSES
// ============================================================================

export const addressSchema = z.object({
  id: z.string().uuid().optional().nullable(),
  label: z.string().optional().nullable(),
  legalName: z.string().optional().nullable(),
  tradeName: z.string().optional().nullable(),
  siret: z.string().optional().nullable(),
  vatNumber: z.string().optional().nullable(),
  addressLine1: z.string().min(1, 'Adresse requise'),
  addressLine2: z.string().optional().nullable(),
  postalCode: z.string().min(1, 'Code postal requis'),
  city: z.string().min(1, 'Ville requise'),
  region: z.string().optional().nullable(),
  country: z.string().default('FR'),
  latitude: z.number().nullable().optional(),
  longitude: z.number().nullable().optional(),
});

export type AddressData = z.infer<typeof addressSchema>;

export const partialAddressSchema = addressSchema.partial().extend({
  addressLine1: z.string().optional().nullable(),
  postalCode: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
});

export type PartialAddressData = z.infer<typeof partialAddressSchema>;

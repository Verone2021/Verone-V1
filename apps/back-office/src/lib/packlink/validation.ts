/**
 * Validation schemas for Packlink PRO API
 * Based on official Packlink documentation
 */

import { z } from 'zod';

// Address schema (FROM / TO)
export const addressSchema = z.object({
  name: z.string().min(1, 'Le prénom est obligatoire'),
  surname: z.string().min(1, 'Le nom de famille est obligatoire'),
  // ✅ Email optionnel : si fourni, doit être valide, sinon peut être chaîne vide
  email: z
    .string()
    .refine(val => val === '' || z.string().email().safeParse(val).success, {
      message: 'Email invalide',
    }),
  // ✅ Phone optionnel : si fourni, doit être min 10 caractères
  phone: z.string().refine(val => val === '' || val.length >= 10, {
    message: 'Le téléphone doit contenir au moins 10 caractères',
  }),
  street1: z.string().min(1, "L'adresse est obligatoire"),
  city: z.string().min(1, 'La ville est obligatoire'),
  zip_code: z.string().min(1, 'Le code postal est obligatoire'),
  country: z
    .string()
    .length(2, 'Le code pays doit être au format ISO (2 lettres)'),
  street2: z.string().optional(),
  company: z.string().optional(),
});

// Package schema
export const packageSchema = z.object({
  weight: z.number().positive('Le poids doit être positif'),
  width: z.number().positive('La largeur doit être positive'),
  height: z.number().positive('La hauteur doit être positive'),
  length: z.number().positive('La longueur doit être positive'),
  quantity: z
    .number()
    .int()
    .positive('La quantité doit être un entier positif')
    .default(1),
});

// Customs schema (pour international)
export const customsSchema = z.object({
  value: z.number().positive('La valeur doit être positive'),
  currency: z
    .string()
    .length(3, 'La devise doit être au format ISO (3 lettres)')
    .default('EUR'),
  description: z.string().min(1, 'La description est obligatoire'),
});

// Search services request
export const searchServicesSchema = z.object({
  from: addressSchema,
  to: addressSchema,
  packages: z.array(packageSchema).min(1, 'Au moins un colis est requis'),
});

// Create draft request
export const createDraftSchema = z.object({
  from: addressSchema,
  to: addressSchema,
  packages: z.array(packageSchema).min(1, 'Au moins un colis est requis'),
  service_id: z.number().positive('Le service_id est obligatoire'),
  content: z.string().default('Produits'),
  contentvalue: z.number().default(0),
  shipment_custom_reference: z.string().optional(),
  dropoff_point_id: z.string().optional(),
  customs: customsSchema.optional(),
});

// Helper pour valider les données
export function validateData<T>(schema: z.ZodSchema<T>, data: unknown) {
  const result = schema.safeParse(data);

  if (!result.success) {
    return {
      success: false as const,
      errors: result.error.issues,
    };
  }

  return {
    success: true as const,
    data: result.data,
  };
}

// Helper pour formater les erreurs Zod
export function formatZodErrors(errors: z.ZodIssue[]) {
  return {
    message: 'Validation échouée',
    details: errors.map(err => ({
      field: err.path.join('.'),
      type: err.code,
      message: err.message,
    })),
  };
}

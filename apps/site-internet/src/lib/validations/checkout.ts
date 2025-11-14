import { z } from 'zod';

/**
 * Schéma Validation Checkout - Formulaire Livraison
 *
 * Champs obligatoires:
 * - Nom complet
 * - Email
 * - Téléphone
 * - Adresse complète (ligne 1 + 2 optionnelle)
 * - Code postal
 * - Ville
 * - Pays (défaut: France)
 *
 * Règles:
 * - Email format valide
 * - Téléphone format français (06/07 ou 01-05/09)
 * - Code postal 5 chiffres
 * - Nom min 2 caractères
 */

export const checkoutSchema = z.object({
  // Informations personnelles
  fullName: z
    .string()
    .min(2, 'Le nom doit contenir au moins 2 caractères')
    .max(100, 'Le nom est trop long'),

  email: z
    .string()
    .email('Adresse email invalide')
    .min(5, 'Email trop court')
    .max(255, 'Email trop long'),

  phone: z
    .string()
    .regex(
      /^(?:(?:\+|00)33|0)\s*[1-9](?:[\s.-]*\d{2}){4}$/,
      'Numéro de téléphone français invalide (ex: 06 12 34 56 78)'
    ),

  // Adresse de livraison
  addressLine1: z
    .string()
    .min(5, 'L\'adresse doit contenir au moins 5 caractères')
    .max(255, 'L\'adresse est trop longue'),

  addressLine2: z.string().max(255, 'Complément d\'adresse trop long').optional(),

  postalCode: z
    .string()
    .regex(/^\d{5}$/, 'Code postal invalide (5 chiffres requis)'),

  city: z
    .string()
    .min(2, 'La ville doit contenir au moins 2 caractères')
    .max(100, 'Le nom de la ville est trop long'),

  country: z.string().min(1, 'Le pays est requis'),

  // Notes de livraison (optionnel)
  deliveryNotes: z
    .string()
    .max(500, 'Les notes de livraison sont trop longues')
    .optional(),
});

export type CheckoutFormData = z.infer<typeof checkoutSchema>;

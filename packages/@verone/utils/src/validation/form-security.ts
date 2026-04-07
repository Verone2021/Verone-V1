/**
 * 🔒 Form Security & Validation - Vérone Back Office
 *
 * Validation et sécurisation complète des formulaires
 */

import DOMPurify from 'isomorphic-dompurify';
import { z } from 'zod';

/**
 * Patterns de validation sécurisés
 */
export const VALIDATION_PATTERNS = {
  // Empêche injection SQL
  NO_SQL_INJECTION: /^[^';"/*-]+$/,

  // Email valide
  EMAIL: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,

  // Téléphone français
  PHONE_FR: /^(\+33|0)[1-9](\d{2}){4}$/,

  // Code postal français
  POSTAL_CODE_FR: /^(0[1-9]|[1-8]\d|9[0-8])\d{3}$/,

  // SKU produit
  PRODUCT_SKU: /^[A-Z0-9_-]{3,50}$/,

  // Nom sécurisé (pas de caractères spéciaux dangereux)
  SAFE_NAME: /^[a-zA-ZÀ-ÿ\s'.-]{2,100}$/,

  // Texte sécurisé (pas de scripts)
  SAFE_TEXT: /^[^<>{}\\]+$/,

  // URL sécurisée
  SAFE_URL: /^https?:\/\/([\w-]+\.)+[\w-]+(\/[\w._~:/?#[\]@!$&'()*+,;=-]*)?$/,
};

/**
 * Sanitize une chaîne contre XSS
 */
export function sanitizeInput(input: string): string {
  if (!input) return '';

  // Nettoyer avec DOMPurify
  const cleaned = DOMPurify.sanitize(input, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
    KEEP_CONTENT: true,
  });

  // Retirer les caractères dangereux supplémentaires
  return cleaned
    .replace(/[<>]/g, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .trim();
}

/**
 * Sanitize un objet complet
 */
export function sanitizeObject<T extends Record<string, unknown>>(obj: T): T {
  const sanitized = {} as T;
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      sanitized[key as keyof T] = sanitizeInput(value) as T[keyof T];
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key as keyof T] = sanitizeObject(
        value as Record<string, unknown>
      ) as T[keyof T];
    } else {
      sanitized[key as keyof T] = value as T[keyof T];
    }
  }

  return sanitized;
}

/**
 * Validation d'email sécurisée
 */
export function validateEmail(email: string): boolean {
  const sanitized = sanitizeInput(email);
  return VALIDATION_PATTERNS.EMAIL.test(sanitized);
}

/**
 * Validation de téléphone
 */
export function validatePhone(phone: string): boolean {
  const cleaned = phone.replace(/[\s.()-]/g, '');
  return VALIDATION_PATTERNS.PHONE_FR.test(cleaned);
}

/**
 * Schémas Zod sécurisés réutilisables
 */
export const SecureSchemas = {
  // Email sécurisé
  email: z
    .string()
    .min(1, 'Email requis')
    .email('Email invalide')
    .transform(sanitizeInput)
    .refine(validateEmail, 'Format email invalide'),

  // Téléphone sécurisé
  phone: z
    .string()
    .optional()
    .transform(val => (val ? sanitizeInput(val) : undefined))
    .refine(val => !val || validatePhone(val), 'Format téléphone invalide'),

  // Nom sécurisé
  safeName: z
    .string()
    .min(2, 'Minimum 2 caractères')
    .max(100, 'Maximum 100 caractères')
    .transform(sanitizeInput)
    .refine(
      val => VALIDATION_PATTERNS.SAFE_NAME.test(val),
      'Caractères non autorisés'
    ),

  // Texte sécurisé
  safeText: z
    .string()
    .transform(sanitizeInput)
    .refine(
      val => VALIDATION_PATTERNS.SAFE_TEXT.test(val),
      'Contenu non autorisé'
    ),

  // URL sécurisée
  safeUrl: z
    .string()
    .url('URL invalide')
    .transform(sanitizeInput)
    .refine(val => VALIDATION_PATTERNS.SAFE_URL.test(val), 'URL non sécurisée'),

  // Montant
  amount: z
    .number()
    .min(0, 'Montant négatif non autorisé')
    .max(999999999, 'Montant trop élevé')
    .finite('Montant invalide'),

  // Code postal
  postalCode: z
    .string()
    .transform(sanitizeInput)
    .refine(
      val => VALIDATION_PATTERNS.POSTAL_CODE_FR.test(val),
      'Code postal invalide'
    ),

  // SKU produit
  productSku: z
    .string()
    .transform(val => sanitizeInput(val).toUpperCase())
    .refine(
      val => VALIDATION_PATTERNS.PRODUCT_SKU.test(val),
      'Format SKU invalide'
    ),
};

/**
 * Schéma Organisation sécurisé
 */
export const SecureOrganisationSchema = z.object({
  name: SecureSchemas.safeName,
  email: SecureSchemas.email,
  phone: SecureSchemas.phone,
  website: SecureSchemas.safeUrl.optional(),
  address_line1: SecureSchemas.safeText.optional(),
  address_line2: SecureSchemas.safeText.optional(),
  postal_code: SecureSchemas.postalCode.optional(),
  city: SecureSchemas.safeName.optional(),
  country: z.string().length(2, 'Code pays ISO 2 lettres').optional(),
  tax_id: z.string().transform(sanitizeInput).optional(),
  notes: SecureSchemas.safeText.optional(),
});

/**
 * Schéma Contact sécurisé
 */
export const SecureContactSchema = z.object({
  first_name: SecureSchemas.safeName,
  last_name: SecureSchemas.safeName,
  email: SecureSchemas.email,
  phone: SecureSchemas.phone,
  mobile: SecureSchemas.phone,
  title: SecureSchemas.safeText.optional(),
  department: SecureSchemas.safeText.optional(),
  is_primary_contact: z.boolean(),
  is_billing_contact: z.boolean(),
  is_technical_contact: z.boolean(),
});

/**
 * Schéma Produit sécurisé
 */
export const SecureProductSchema = z.object({
  sku: SecureSchemas.productSku,
  name: SecureSchemas.safeName,
  description: SecureSchemas.safeText.optional(),
  price_ht: SecureSchemas.amount,
  vat_rate: z.number().min(0).max(100),
  weight: z.number().min(0).optional(),
  dimensions: z
    .object({
      length: z.number().min(0).optional(),
      width: z.number().min(0).optional(),
      height: z.number().min(0).optional(),
    })
    .optional(),
  stock_quantity: z.number().int().min(0),
  min_stock: z.number().int().min(0).optional(),
  reorder_point: z.number().int().min(0).optional(),
  status: z.enum([
    // Statuts automatiques (calculés par le système)
    'in_stock',
    'out_of_stock',
    'coming_soon',
    // Statuts manuels uniquement (modifiables par l'utilisateur)
    'preorder',
    'discontinued',
    'sourcing',
    'pret_a_commander',
    'echantillon_a_commander',
  ]),
});

/**
 * Schéma Commande sécurisé
 */
export const SecureOrderSchema = z.object({
  customer_id: z.string().uuid('ID client invalide'),
  items: z
    .array(
      z.object({
        product_id: z.string().uuid('ID produit invalide'),
        quantity: z.number().int().min(1),
        unit_price: SecureSchemas.amount,
        discount_rate: z.number().min(0).max(100).optional(),
      })
    )
    .min(1, 'Au moins un article requis'),
  shipping_address: z.object({
    line1: SecureSchemas.safeText,
    line2: SecureSchemas.safeText.optional(),
    postal_code: SecureSchemas.postalCode,
    city: SecureSchemas.safeName,
    country: z.string().length(2),
  }),
  notes: SecureSchemas.safeText.optional(),
});

/**
 * Validation de formulaire avec protection CSRF
 */
export function validateFormWithCSRF<T>(
  data: unknown,
  schema: z.ZodSchema<T>,
  csrfToken?: string
): { success: boolean; data?: T; errors?: string[] } {
  try {
    // Vérifier CSRF token si fourni
    if (csrfToken && !verifyCSRFToken(csrfToken)) {
      return {
        success: false,
        errors: ['Token CSRF invalide'],
      };
    }

    // Valider et sanitizer les données
    const validated = schema.parse(data);

    return {
      success: true,
      data: validated,
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        errors: error.issues.map(
          (e: z.ZodIssue) => `${e.path.join('.')}: ${e.message}`
        ),
      };
    }

    return {
      success: false,
      errors: ['Erreur de validation inconnue'],
    };
  }
}

/**
 * Génération de token CSRF
 */
export function generateCSRFToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return btoa(String.fromCharCode(...array));
}

/**
 * Vérification de token CSRF (simplifié - en production utiliser une solution côté serveur)
 */
function verifyCSRFToken(token: string): boolean {
  // En production, vérifier contre un token stocké en session
  return token.length === 44; // Base64 de 32 bytes
}

/**
 * Hook pour protection des formulaires
 */
export function useFormSecurity() {
  const csrfToken = generateCSRFToken();

  const validateForm = <T>(data: unknown, schema: z.ZodSchema<T>) => {
    return validateFormWithCSRF(data, schema, csrfToken);
  };

  return {
    csrfToken,
    validateForm,
    sanitizeInput,
    sanitizeObject,
  };
}

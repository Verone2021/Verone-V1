import { z } from 'zod';

export const contactSchema = z.object({
  first_name: z
    .string()
    .min(2, 'Le prénom doit contenir au moins 2 caractères')
    .max(100, 'Le prénom ne peut pas dépasser 100 caractères'),
  last_name: z
    .string()
    .min(2, 'Le nom doit contenir au moins 2 caractères')
    .max(100, 'Le nom ne peut pas dépasser 100 caractères'),
  title: z.string().optional(),
  department: z.string().optional(),
  email: z.string().email('Email invalide'),
  phone: z.string().optional(),
  mobile: z.string().optional(),
  secondary_email: z
    .string()
    .email('Email secondaire invalide')
    .optional()
    .or(z.literal('')),
  direct_line: z.string().optional(),
  is_primary_contact: z.boolean(),
  is_billing_contact: z.boolean(),
  is_technical_contact: z.boolean(),
  preferred_communication_method: z.enum(['email', 'phone', 'both']),
  accepts_marketing: z.boolean(),
  accepts_notifications: z.boolean(),
  language_preference: z.string(),
  notes: z.string().optional(),
});

export type ContactFormData = z.infer<typeof contactSchema>;

export const COMMUNICATION_METHODS = [
  { value: 'email', label: 'Email' },
  { value: 'phone', label: 'Téléphone' },
  { value: 'both', label: 'Email et téléphone' },
] as const;

export const LANGUAGE_OPTIONS = [
  { value: 'fr', label: 'Français' },
  { value: 'en', label: 'Anglais' },
  { value: 'de', label: 'Allemand' },
  { value: 'it', label: 'Italien' },
  { value: 'es', label: 'Espagnol' },
] as const;

export const DEFAULT_CONTACT_VALUES: ContactFormData = {
  first_name: '',
  last_name: '',
  title: '',
  department: '',
  email: '',
  phone: '',
  mobile: '',
  secondary_email: '',
  direct_line: '',
  is_primary_contact: false,
  is_billing_contact: false,
  is_technical_contact: false,
  preferred_communication_method: 'email',
  accepts_marketing: true,
  accepts_notifications: true,
  language_preference: 'fr',
  notes: '',
};

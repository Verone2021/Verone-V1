/**
 * 🔍 Profile Validation Utilities - Vérone
 *
 * Utilitaires de validation pour les champs de profil utilisateur
 * Respecte les contraintes définies dans la migration DB
 */

export interface ValidationResult {
  isValid: boolean;
  error?: string;
  formatted?: string;
}

/**
 * Valide et formate un numéro de téléphone français
 */
export function validatePhone(phone: string): ValidationResult {
  if (!phone || phone.trim().length === 0) {
    return { isValid: true }; // Optionnel
  }

  // Nettoyer le numéro (enlever espaces, tirets, points)
  const cleaned = phone.replace(/[\s.()-]/g, '');

  // Patterns français acceptés
  const patterns = [
    /^0[1-9][0-9]{8}$/, // 0123456789
    /^\+33[1-9][0-9]{8}$/, // +33123456789
  ];

  const isValidFormat = patterns.some(pattern => pattern.test(cleaned));

  if (!isValidFormat) {
    return {
      isValid: false,
      error: 'Format invalide. Utilisez: 0X XX XX XX XX ou +33 X XX XX XX XX',
    };
  }

  // Formater pour affichage
  let formatted = cleaned;

  if (cleaned.startsWith('+33')) {
    // Format +33 X XX XX XX XX
    formatted = cleaned.replace(
      /^\+33([1-9])([0-9]{2})([0-9]{2})([0-9]{2})([0-9]{2})$/,
      '+33 $1 $2 $3 $4 $5'
    );
  } else if (cleaned.startsWith('0')) {
    // Format 0X XX XX XX XX
    formatted = cleaned.replace(
      /^0([1-9])([0-9]{2})([0-9]{2})([0-9]{2})([0-9]{2})$/,
      '0$1 $2 $3 $4 $5'
    );
  }

  return { isValid: true, formatted };
}

/**
 * Valide le prénom
 */
export function validateFirstName(firstName: string): ValidationResult {
  if (!firstName || firstName.trim().length === 0) {
    return { isValid: true }; // Optionnel
  }

  const trimmed = firstName.trim();

  if (trimmed.length > 50) {
    return {
      isValid: false,
      error: 'Le prénom ne peut pas dépasser 50 caractères',
    };
  }

  // Caractères autorisés : lettres, espaces, apostrophes, tirets
  const validPattern = /^[a-zA-ZÀ-ÿŸØø\s'.-]+$/;

  if (!validPattern.test(trimmed)) {
    return {
      isValid: false,
      error: 'Le prénom contient des caractères non autorisés',
    };
  }

  return { isValid: true, formatted: trimmed };
}

/**
 * Valide le nom de famille
 */
export function validateLastName(lastName: string): ValidationResult {
  if (!lastName || lastName.trim().length === 0) {
    return { isValid: true }; // Optionnel
  }

  const trimmed = lastName.trim();

  if (trimmed.length > 50) {
    return {
      isValid: false,
      error: 'Le nom de famille ne peut pas dépasser 50 caractères',
    };
  }

  // Caractères autorisés : lettres, espaces, apostrophes, tirets
  const validPattern = /^[a-zA-ZÀ-ÿŸØø\s'.-]+$/;

  if (!validPattern.test(trimmed)) {
    return {
      isValid: false,
      error: 'Le nom de famille contient des caractères non autorisés',
    };
  }

  return { isValid: true, formatted: trimmed };
}

/**
 * Valide l'intitulé de poste
 */
export function validateJobTitle(jobTitle: string): ValidationResult {
  if (!jobTitle || jobTitle.trim().length === 0) {
    return { isValid: true }; // Optionnel
  }

  const trimmed = jobTitle.trim();

  if (trimmed.length > 100) {
    return {
      isValid: false,
      error: "L'intitulé de poste ne peut pas dépasser 100 caractères",
    };
  }

  return { isValid: true, formatted: trimmed };
}

/**
 * Valide le nom d'affichage
 */
export function validateDisplayName(displayName: string): ValidationResult {
  if (!displayName || displayName.trim().length === 0) {
    return {
      isValid: false,
      error: "Le nom d'affichage est requis",
    };
  }

  const trimmed = displayName.trim();

  if (trimmed.length < 2) {
    return {
      isValid: false,
      error: "Le nom d'affichage doit contenir au moins 2 caractères",
    };
  }

  if (trimmed.length > 50) {
    return {
      isValid: false,
      error: "Le nom d'affichage ne peut pas dépasser 50 caractères",
    };
  }

  return { isValid: true, formatted: trimmed };
}

/**
 * Interface pour les données de profil
 */
export interface ProfileFormData {
  displayName: string;
  firstName: string;
  lastName: string;
  phone: string;
  jobTitle: string;
}

/**
 * Validation complète du formulaire profil
 */
export function validateProfileForm(data: ProfileFormData): {
  isValid: boolean;
  errors: Record<string, string>;
  formatted: Partial<ProfileFormData>;
} {
  const errors: Record<string, string> = {};
  const formatted: Partial<ProfileFormData> = {};

  // Validation nom d'affichage
  const displayNameResult = validateDisplayName(data.displayName);
  if (!displayNameResult.isValid) {
    errors.displayName = displayNameResult.error!;
  } else {
    formatted.displayName = displayNameResult.formatted;
  }

  // Validation prénom
  const firstNameResult = validateFirstName(data.firstName);
  if (!firstNameResult.isValid) {
    errors.firstName = firstNameResult.error!;
  } else {
    formatted.firstName = firstNameResult.formatted;
  }

  // Validation nom de famille
  const lastNameResult = validateLastName(data.lastName);
  if (!lastNameResult.isValid) {
    errors.lastName = lastNameResult.error!;
  } else {
    formatted.lastName = lastNameResult.formatted;
  }

  // Validation téléphone
  const phoneResult = validatePhone(data.phone);
  if (!phoneResult.isValid) {
    errors.phone = phoneResult.error!;
  } else {
    formatted.phone = phoneResult.formatted;
  }

  // Validation intitulé de poste
  const jobTitleResult = validateJobTitle(data.jobTitle);
  if (!jobTitleResult.isValid) {
    errors.jobTitle = jobTitleResult.error!;
  } else {
    formatted.jobTitle = jobTitleResult.formatted;
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    formatted,
  };
}

/**
 * Sanitize les données avant insertion en DB
 */
export function sanitizeProfileData(
  data: Partial<ProfileFormData>
): Record<string, string | null> {
  return {
    first_name: data.firstName?.trim() ?? null,
    last_name: data.lastName?.trim() ?? null,
    phone: data.phone?.replace(/[\s.()-]/g, '') ?? null,
    job_title: data.jobTitle?.trim() ?? null,
  };
}

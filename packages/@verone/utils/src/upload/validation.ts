/**
 * 🛡️ VÉRONE - Validation Upload Simple
 *
 * Validation simple pour upload d'images
 * Approche classique : Upload → Storage → URL directe dans table
 */

import type { User } from '@supabase/supabase-js';

// Types simplifiés
export type BucketType = 'category-images' | 'family-images' | 'product-images';
export type UserRole =
  | 'owner'
  | 'admin'
  | 'catalog_manager'
  | 'sales'
  | 'partner_manager';

export interface ValidationResult {
  isValid: boolean;
  error?: string;
  errorCode?: string;
}

export interface UserProfile {
  user_id: string;
  role: UserRole;
  user_type: 'staff' | 'supplier' | 'customer' | 'partner';
}

// Configuration simple des images
const BUCKET_CONFIG: Record<
  BucketType,
  {
    allowedMimeTypes: string[];
    maxSizeMB: number;
    description: string;
  }
> = {
  'family-images': {
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
    maxSizeMB: 5,
    description: 'Images familles produits',
  },
  'category-images': {
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
    maxSizeMB: 5,
    description: 'Images catégories',
  },
  'product-images': {
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
    maxSizeMB: 10,
    description: 'Images produits',
  },
};

// Permissions par rôle simplifiées
const ROLE_PERMISSIONS: Record<UserRole, BucketType[]> = {
  owner: ['family-images', 'category-images', 'product-images'],
  admin: ['family-images', 'category-images', 'product-images'],
  catalog_manager: ['family-images', 'category-images', 'product-images'],
  sales: ['product-images'],
  partner_manager: ['product-images'],
};

/**
 * 👤 Valide si l'utilisateur est connecté et a un profil valide
 */
export function validateUserSession(user: User | null): ValidationResult {
  if (!user) {
    return {
      isValid: false,
      error: 'Vous devez être connecté pour uploader des fichiers',
      errorCode: 'AUTH_REQUIRED',
    };
  }

  if (!user.email_confirmed_at) {
    return {
      isValid: false,
      error: 'Votre email doit être confirmé pour uploader des fichiers',
      errorCode: 'EMAIL_NOT_CONFIRMED',
    };
  }

  return { isValid: true };
}

/**
 * 🔐 Valide les permissions utilisateur pour un bucket donné
 */
export function validateUserPermissions(
  userProfile: UserProfile | null,
  bucket: BucketType
): ValidationResult {
  if (!userProfile) {
    return {
      isValid: false,
      error: 'Profil utilisateur requis pour effectuer cette action',
      errorCode: 'PROFILE_REQUIRED',
    };
  }

  const allowedBuckets = ROLE_PERMISSIONS[userProfile.role];

  if (!allowedBuckets.includes(bucket)) {
    return {
      isValid: false,
      error: `Votre rôle (${userProfile.role}) ne permet pas d'uploader vers ${bucket}`,
      errorCode: 'INSUFFICIENT_PERMISSIONS',
    };
  }

  return { isValid: true };
}

/**
 * 📄 Valide le fichier selon les contraintes du bucket
 */
export function validateFile(file: File, bucket: BucketType): ValidationResult {
  const config = BUCKET_CONFIG[bucket];

  // Vérifier le type MIME
  if (!config.allowedMimeTypes.includes(file.type)) {
    const allowedTypes = config.allowedMimeTypes
      .map(type => type.split('/')[1])
      .join(', ');

    return {
      isValid: false,
      error: `Format non supporté pour ${bucket}. Formats autorisés : ${allowedTypes}`,
      errorCode: 'INVALID_MIME_TYPE',
    };
  }

  // Vérifier la taille
  const maxSizeBytes = config.maxSizeMB * 1024 * 1024;
  if (file.size > maxSizeBytes) {
    return {
      isValid: false,
      error: `Fichier trop volumineux. Taille maximum pour ${bucket} : ${config.maxSizeMB}MB`,
      errorCode: 'FILE_TOO_LARGE',
    };
  }

  // Vérifier que le fichier n'est pas vide
  if (file.size === 0) {
    return {
      isValid: false,
      error: 'Le fichier est vide',
      errorCode: 'EMPTY_FILE',
    };
  }

  // Vérifier le nom du fichier
  if (!isValidFileName(file.name)) {
    return {
      isValid: false,
      error: 'Le nom du fichier contient des caractères non autorisés',
      errorCode: 'INVALID_FILENAME',
    };
  }

  return { isValid: true };
}

/**
 * 📝 Valide le nom de fichier selon les règles AWS S3
 */
function isValidFileName(fileName: string): boolean {
  // Éviter les caractères problématiques pour S3/Supabase
  // eslint-disable-next-line no-control-regex -- intentionally detecting control chars to reject them
  const invalidChars = /[<>:"/\\|?*\x00-\x1f]/;
  const hasInvalidChars = invalidChars.test(fileName);

  // Vérifier la longueur
  const isValidLength = fileName.length > 0 && fileName.length <= 255;

  // Éviter les noms réservés
  const reservedNames = ['.', '..', 'CON', 'PRN', 'AUX', 'NUL'];
  const isReserved = reservedNames.includes(fileName.toUpperCase());

  return !hasInvalidChars && isValidLength && !isReserved;
}

/**
 * 🎯 Génère un nom de fichier simple et sécurisé
 */
export function generateSecureFileName(originalName: string): string {
  const timestamp = Date.now();
  const randomSuffix = Math.random().toString(36).substring(2, 8);
  const extension = originalName.split('.').pop()?.toLowerCase() || 'jpg';

  // Nettoyer le nom original
  const cleanName = originalName
    .replace(/[^a-zA-Z0-9.-]/g, '_')
    .substring(0, 30);

  return `${timestamp}-${randomSuffix}-${cleanName}.${extension}`;
}

/**
 * 📊 Obtient la configuration d'un bucket
 */
export function getBucketConfig(bucket: BucketType) {
  return BUCKET_CONFIG[bucket];
}

/**
 * 🔍 Validation simple avant upload
 */
export function validateUpload(params: {
  user: User | null;
  userProfile: UserProfile | null;
  file: File;
  bucket: BucketType;
}): ValidationResult {
  // Validation utilisateur
  const userValidation = validateUserSession(params.user);
  if (!userValidation.isValid) return userValidation;

  // Validation permissions
  const permissionValidation = validateUserPermissions(
    params.userProfile,
    params.bucket
  );
  if (!permissionValidation.isValid) return permissionValidation;

  // Validation fichier
  const fileValidation = validateFile(params.file, params.bucket);
  if (!fileValidation.isValid) return fileValidation;

  return { isValid: true };
}

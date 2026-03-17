import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ========================================
// UTILITAIRES BUSINESS VÉRONE
// ========================================

/**
 * Formate un prix en euros avec devise
 * @param priceInEuros Prix en euros
 * @returns Prix formaté (ex: "149,90 €")
 */
export function formatPrice(priceInEuros: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
  }).format(priceInEuros);
}

/**
 * Formate un prix stocké en centimes vers euros avec devise
 * @param priceInCents Prix en centimes (format base de données)
 * @returns Prix formaté (ex: "149,90 €")
 */
export function formatPriceFromCents(priceInCents: number): string {
  return formatPrice(priceInCents / 100);
}

/**
 * Génère un SKU automatique selon format Vérone
 * @param category Catégorie produit
 * @param brand Marque (optionnel)
 * @returns SKU formaté (ex: "VER-MOB-CANAPE-001")
 */
export function generateSKU(category: string, brand?: string): string {
  const prefix = 'VER';
  const catCode = category.toUpperCase().substring(0, 3);
  const brandCode = brand ? brand.toUpperCase().substring(0, 3) : 'GEN';
  const timestamp = Date.now().toString().slice(-3);

  return `${prefix}-${catCode}-${brandCode}-${timestamp}`;
}

/**
 * Valide un format SKU Vérone
 * @param sku SKU à valider
 * @returns true si format valide
 */
export function validateSKU(sku: string): boolean {
  // Format: VER-XXX-XXX-XXX (lettres et chiffres, tirets)
  const skuRegex =
    /^[A-Z0-9]{1,10}-[A-Z0-9]{1,10}-[A-Z0-9]{1,10}-[A-Z0-9]{1,10}$/;
  return skuRegex.test(sku);
}

/**
 * Convertit un poids en format lisible
 * @param weightKg Poids en kg
 * @returns Poids formaté avec unité appropriée
 */
export function formatWeight(weightKg: number): string {
  if (weightKg < 1) {
    return `${Math.round(weightKg * 1000)} g`;
  }
  return `${weightKg.toFixed(1)} kg`;
}

/**
 * Formate des dimensions selon standards Vérone
 * @param dimensions Objet dimensions
 * @returns Dimensions formatées (ex: "120 × 80 × 45 cm")
 */
export function formatDimensions(dimensions: {
  length?: number;
  width?: number;
  height?: number;
  unit?: string;
}): string {
  const { length, width, height, unit = 'cm' } = dimensions;

  if (!length || !width || !height) {
    return 'Dimensions non spécifiées';
  }

  return `${length} × ${width} × ${height} ${unit}`;
}

/**
 * Configuration statuts produits
 */
export const statusConfig = {
  in_stock: {
    label: 'En stock',
    color: 'success',
    icon: '✓',
  },
  out_of_stock: {
    label: 'Rupture de stock',
    color: 'destructive',
    icon: '✕',
  },
  preorder: {
    label: 'Précommande',
    color: 'info',
    icon: '📅',
  },
  coming_soon: {
    label: 'Bientôt disponible',
    color: 'warning',
    icon: '⏳',
  },
  discontinued: {
    label: 'Produit arrêté',
    color: 'secondary',
    icon: '⚠',
  },
} as const;

/**
 * Valide la performance SLO
 * @param startTime Timestamp de début
 * @param operation Type d'opération
 * @returns Résultat validation avec durée
 */
export function checkSLOCompliance(
  startTime: number,
  operation: 'dashboard' | 'search' | 'feeds' | 'pdf'
): { isCompliant: boolean; duration: number; threshold: number } {
  const duration = Date.now() - startTime;

  const thresholds = {
    dashboard: 2000, // 2s max
    search: 1000, // 1s max
    feeds: 10000, // 10s max
    pdf: 5000, // 5s max
  };

  const threshold = thresholds[operation];
  const isCompliant = duration <= threshold;

  if (!isCompliant) {
    console.warn(
      `SLO violation: ${operation} took ${duration}ms (max: ${threshold}ms)`
    );
  }

  return { isCompliant, duration, threshold };
}

/**
 * Debounce function pour optimiser les recherches
 * @param func Fonction à debouncer
 * @param wait Délai en ms
 * @returns Fonction debouncée
 */
export function debounce<T extends (...args: Parameters<T>) => ReturnType<T>>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;

  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Génère un slug URL-friendly à partir d'un nom
 * @param name Nom à convertir
 * @returns Slug formaté
 */
export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Supprime les accents
    .replace(/[^a-z0-9\s-]/g, '') // Garde uniquement lettres, chiffres, espaces, tirets
    .trim()
    .replace(/\s+/g, '-') // Remplace espaces par tirets
    .replace(/-+/g, '-'); // Supprime tirets multiples
}

/**
 * Utilitaire de validation d'email
 * @param email Email à valider
 * @returns true si email valide
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Formate une date selon locale française
 * @param date Date à formater
 * @param options Options de formatage
 * @returns Date formatée
 */
export function formatDate(
  date: Date | string,
  options: Intl.DateTimeFormatOptions = {}
): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;

  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    ...options,
  };

  return new Intl.DateTimeFormat('fr-FR', defaultOptions).format(dateObj);
}

/**
 * Calcule un pourcentage de remise
 * @param originalPrice Prix original en centimes
 * @param discountedPrice Prix réduit en centimes
 * @returns Pourcentage de remise
 */
export function calculateDiscountPercentage(
  originalPrice: number,
  discountedPrice: number
): number {
  if (originalPrice <= 0) return 0;
  return Math.round(((originalPrice - discountedPrice) / originalPrice) * 100);
}

/**
 * Applique une remise à un prix
 * @param price Prix en centimes
 * @param discountPercent Pourcentage de remise (0-100)
 * @returns Prix après remise
 */
export function applyDiscount(price: number, discountPercent: number): number {
  const discount = price * (discountPercent / 100);
  return Math.round(price - discount);
}

/**
 * Formate une devise selon locale
 * @param amount Montant
 * @param currency Code devise (EUR par défaut)
 * @returns Montant formaté avec devise
 */
export function formatCurrency(
  amount: number | string,
  currency: string = 'EUR'
): string {
  const numericAmount =
    typeof amount === 'string' ? parseFloat(amount) : amount;

  if (isNaN(numericAmount)) return '0,00 €';

  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
  }).format(numericAmount);
}

/**
 * Formate une date courte
 * @param date Date à formater
 * @returns Date formatée courte (ex: "15/03/2024")
 */
export function formatDateShort(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;

  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(dateObj);
}

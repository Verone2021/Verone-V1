import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import {
  type Proprietaire,
  type Associe,
  type ProprietaireType,
  type FormeJuridique,
  FORME_JURIDIQUE_OPTIONS,
  PROPRIETAIRE_TYPE_OPTIONS,
  COUNTRY_OPTIONS
} from '@/lib/validations/proprietaires'

// ==============================================================================
// UTILITY FUNCTIONS
// ==============================================================================

/**
 * Combine class names with tailwind-merge
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// ==============================================================================
// PROPRIETAIRE FORMATTERS
// ==============================================================================

/**
 * Formatage du nom complet d'un propriétaire
 */
export function formatProprietaireNomComplet(proprietaire: Pick<Proprietaire, 'type' | 'nom' | 'prenom'>): string {
  if (proprietaire.type === 'physique') {
    return `${proprietaire.prenom || ''} ${proprietaire.nom}`.trim()
  }
  return proprietaire.nom
}

/**
 * Formatage du nom complet d'un associé
 */
export function formatAssocieNomComplet(associe: Pick<Associe, 'type' | 'nom' | 'prenom'>): string {
  if (associe.type === 'physique') {
    return `${associe.prenom || ''} ${associe.nom}`.trim()
  }
  return associe.nom
}

/**
 * Formatage de l'affichage du type de propriétaire
 */
export function formatProprietaireType(type: ProprietaireType): string {
  const option = PROPRIETAIRE_TYPE_OPTIONS.find(opt => opt.value === type)
  return option?.label || type
}

/**
 * Formatage de la forme juridique
 */
export function formatFormeJuridique(forme: FormeJuridique): string {
  const option = FORME_JURIDIQUE_OPTIONS.find(opt => opt.value === forme)
  return option?.label || forme
}

/**
 * Formatage du pays avec emoji
 */
export function formatPays(codePays: string): string {
  const option = COUNTRY_OPTIONS.find(opt => opt.value === codePays)
  return option?.label || codePays
}

/**
 * Formatage de l'adresse complète
 */
export function formatAdresseComplete(proprietaire: Pick<Proprietaire, 'adresse' | 'code_postal' | 'ville' | 'pays'>): string {
  const parts: string[] = []
  
  if (proprietaire.adresse) parts.push(proprietaire.adresse)
  
  const cityLine: string[] = []
  if (proprietaire.code_postal) cityLine.push(proprietaire.code_postal)
  if (proprietaire.ville) cityLine.push(proprietaire.ville)
  if (cityLine.length > 0) parts.push(cityLine.join(' '))
  
  if (proprietaire.pays && proprietaire.pays !== 'FR') {
    parts.push(formatPays(proprietaire.pays))
  }
  
  return parts.join(', ')
}

/**
 * Formatage du capital social
 */
export function formatCapitalSocial(capital?: number | null): string {
  if (!capital) return 'Non renseigné'
  
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(capital)
}

/**
 * Formatage du pourcentage de completion du capital
 */
export function formatCapitalCompletion(percent?: number | null): string {
  if (percent === null || percent === undefined) return 'N/A'
  
  return new Intl.NumberFormat('fr-FR', {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(percent / 100)
}

/**
 * Formatage du nombre de parts avec séparateurs
 */
export function formatNombreParts(parts?: number | null): string {
  if (!parts) return '0'
  
  return new Intl.NumberFormat('fr-FR').format(parts)
}

// ==============================================================================
// VALIDATION HELPERS
// ==============================================================================

/**
 * Vérifier si un propriétaire est valide (pas un brouillon incomplet)
 */
export function isProprietaireValide(proprietaire: Proprietaire): boolean {
  if (proprietaire.is_brouillon) return false
  
  // Vérifications communes
  if (!proprietaire.nom?.trim()) return false
  
  if (proprietaire.type === 'physique') {
    return !!(
      proprietaire.prenom?.trim() &&
      proprietaire.date_naissance &&
      proprietaire.lieu_naissance &&
      proprietaire.nationalite
    )
  }
  
  if (proprietaire.type === 'morale') {
    return !!(
      proprietaire.forme_juridique &&
      proprietaire.numero_identification &&
      proprietaire.capital_social &&
      proprietaire.nombre_parts_total &&
      proprietaire.nombre_parts_total > 0
    )
  }
  
  return false
}

/**
 * Vérifier si un propriétaire peut avoir des associés
 */
export function canHaveAssocies(proprietaire: Pick<Proprietaire, 'type'>): boolean {
  return proprietaire.type === 'morale'
}

/**
 * Calculer l'âge à partir de la date de naissance
 */
export function calculateAge(dateNaissance: string): number {
  const birth = new Date(dateNaissance)
  const today = new Date()
  let age = today.getFullYear() - birth.getFullYear()
  const monthDiff = today.getMonth() - birth.getMonth()
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--
  }
  
  return age
}

/**
 * Valider un email
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Valider un téléphone français
 */
export function isValidPhoneFR(phone: string): boolean {
  // Accepte formats: 06.12.34.56.78, 06 12 34 56 78, 0612345678, +33612345678
  const phoneRegex = /^(?:\+33|0)[1-9](?:[0-9]{8})$/
  const cleanPhone = phone.replace(/[\s\-\.\(\)]/g, '')
  return phoneRegex.test(cleanPhone)
}

// ==============================================================================
// ASSOCIES HELPERS
// ==============================================================================

/**
 * Calculer le pourcentage de parts d'un associé
 */
export function calculateAssociePercentage(
  associe: Pick<Associe, 'nombre_parts'>,
  totalParts: number
): number {
  if (totalParts === 0) return 0
  return (associe.nombre_parts / totalParts) * 100
}

/**
 * Formater le pourcentage de parts d'un associé
 */
export function formatAssociePercentage(percentage: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 2,
  }).format(percentage / 100)
}

/**
 * Vérifier si un associé est actif
 */
export function isAssocieActif(associe: Pick<Associe, 'is_active' | 'date_sortie'>): boolean {
  return associe.is_active && !associe.date_sortie
}

/**
 * Calculer la durée de participation d'un associé
 */
export function calculateDureeParticipation(
  associe: Pick<Associe, 'date_entree' | 'date_sortie'>
): { years: number; months: number; days: number } {
  const start = new Date(associe.date_entree)
  const end = associe.date_sortie ? new Date(associe.date_sortie) : new Date()
  
  const diffTime = Math.abs(end.getTime() - start.getTime())
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  
  const years = Math.floor(diffDays / 365)
  const months = Math.floor((diffDays % 365) / 30)
  const days = diffDays % 30
  
  return { years, months, days }
}

/**
 * Formater la durée de participation
 */
export function formatDureeParticipation(duree: { years: number; months: number; days: number }): string {
  const parts: string[] = []
  
  if (duree.years > 0) {
    parts.push(`${duree.years} an${duree.years > 1 ? 's' : ''}`)
  }
  if (duree.months > 0) {
    parts.push(`${duree.months} mois`)
  }
  if (duree.days > 0 && duree.years === 0) {
    parts.push(`${duree.days} jour${duree.days > 1 ? 's' : ''}`)
  }
  
  return parts.join(', ') || 'Moins d\'un jour'
}

// ==============================================================================
// SEARCH & FILTER HELPERS
// ==============================================================================

/**
 * Filtrer les propriétaires par terme de recherche
 */
export function filterProprietairesBySearch(
  proprietaires: Proprietaire[],
  searchTerm: string
): Proprietaire[] {
  if (!searchTerm.trim()) return proprietaires
  
  const term = searchTerm.toLowerCase()
  
  return proprietaires.filter(prop => {
    const nomComplet = formatProprietaireNomComplet(prop).toLowerCase()
    const email = prop.email?.toLowerCase() || ''
    const numeroId = prop.numero_identification?.toLowerCase() || ''
    
    return (
      nomComplet.includes(term) ||
      email.includes(term) ||
      numeroId.includes(term)
    )
  })
}

/**
 * Trier les propriétaires par critère
 */
export function sortProprietaires(
  proprietaires: Proprietaire[],
  sortBy: 'nom' | 'type' | 'created_at' | 'capital_social',
  direction: 'asc' | 'desc' = 'asc'
): Proprietaire[] {
  return [...proprietaires].sort((a, b) => {
    let aValue: any
    let bValue: any
    
    switch (sortBy) {
      case 'nom':
        aValue = formatProprietaireNomComplet(a)
        bValue = formatProprietaireNomComplet(b)
        break
      case 'type':
        aValue = a.type
        bValue = b.type
        break
      case 'created_at':
        aValue = new Date(a.created_at)
        bValue = new Date(b.created_at)
        break
      case 'capital_social':
        aValue = a.capital_social || 0
        bValue = b.capital_social || 0
        break
      default:
        return 0
    }
    
    if (aValue < bValue) return direction === 'asc' ? -1 : 1
    if (aValue > bValue) return direction === 'asc' ? 1 : -1
    return 0
  })
}

/**
 * Grouper les propriétaires par type
 */
export function groupProprietairesByType(proprietaires: Proprietaire[]): {
  physique: Proprietaire[]
  morale: Proprietaire[]
} {
  return proprietaires.reduce(
    (groups, prop) => {
      groups[prop.type].push(prop)
      return groups
    },
    { physique: [] as Proprietaire[], morale: [] as Proprietaire[] }
  )
}

// ==============================================================================
// STATUS & BADGE HELPERS
// ==============================================================================

/**
 * Obtenir la couleur du badge pour le statut brouillon
 */
export function getBrouillonBadgeColor(isBrouillon: boolean): string {
  return isBrouillon
    ? 'bg-yellow-100 text-yellow-800 border-yellow-200'
    : 'bg-green-100 text-green-800 border-green-200'
}

/**
 * Obtenir le texte du badge pour le statut brouillon
 */
export function getBrouillonBadgeText(isBrouillon: boolean): string {
  return isBrouillon ? '📝 Brouillon' : '✅ Complet'
}

/**
 * Obtenir la couleur du badge pour le type de propriétaire
 */
export function getTypeBadgeColor(type: ProprietaireType): string {
  return type === 'physique'
    ? 'bg-blue-100 text-blue-800 border-blue-200'
    : 'bg-purple-100 text-purple-800 border-purple-200'
}

/**
 * Obtenir la couleur du badge pour le completion du capital
 */
export function getCapitalCompletionBadgeColor(percent?: number | null): string {
  if (percent === null || percent === undefined) {
    return 'bg-gray-100 text-gray-800 border-gray-200'
  }
  
  if (percent >= 100) {
    return 'bg-green-100 text-green-800 border-green-200'
  } else if (percent >= 75) {
    return 'bg-yellow-100 text-yellow-800 border-yellow-200'
  } else if (percent >= 50) {
    return 'bg-orange-100 text-orange-800 border-orange-200'
  } else {
    return 'bg-red-100 text-red-800 border-red-200'
  }
}

// ==============================================================================
// FORM HELPERS
// ==============================================================================

/**
 * Obtenir les valeurs par défaut pour un nouveau propriétaire physique
 */
export function getDefaultProprietairePhysique() {
  return {
    type: 'physique' as const,
    nom: '',
    prenom: '',
    email: '',
    telephone: '',
    adresse: '',
    code_postal: '',
    ville: '',
    pays: 'FR',
    date_naissance: '',
    lieu_naissance: '',
    nationalite: 'Française',
    is_brouillon: false,
  }
}

/**
 * Obtenir les valeurs par défaut pour un nouveau propriétaire morale
 */
export function getDefaultProprietaireMorale() {
  return {
    type: 'morale' as const,
    nom: '',
    email: '',
    telephone: '',
    adresse: '',
    code_postal: '',
    ville: '',
    pays: 'FR',
    forme_juridique: 'SARL' as FormeJuridique,
    numero_identification: '',
    capital_social: 0,
    nombre_parts_total: 100,
    is_brouillon: false,
  }
}

/**
 * Obtenir les valeurs par défaut pour un nouvel associé physique
 */
export function getDefaultAssociePhysique() {
  return {
    type: 'physique' as const,
    nom: '',
    prenom: '',
    email: '',
    telephone: '',
    date_naissance: '',
    lieu_naissance: '',
    nationalite: 'Française',
    nombre_parts: 1,
    date_entree: new Date().toISOString().split('T')[0],
    ordre_affichage: 0,
  }
}

/**
 * Obtenir les valeurs par défaut pour un nouvel associé morale
 */
export function getDefaultAssocieMorale() {
  return {
    type: 'morale' as const,
    nom: '',
    email: '',
    telephone: '',
    forme_juridique: 'SARL' as FormeJuridique,
    numero_identification: '',
    nombre_parts: 1,
    date_entree: new Date().toISOString().split('T')[0],
    ordre_affichage: 0,
  }
}

// ==============================================================================
// EXPORT ALL
// ==============================================================================

export {
  // Re-export from validations for convenience
  FORME_JURIDIQUE_OPTIONS,
  PROPRIETAIRE_TYPE_OPTIONS,
  COUNTRY_OPTIONS,
} from '@/lib/validations/proprietaires'
/**
 * Organisation Display Helpers
 *
 * Utilitaires pour l'affichage des organisations suite à migration
 * organisation.name → legal_name + trade_name
 */

import type { Database } from '@/types/database'

type Organisation = Database['public']['Tables']['organisations']['Row']

/**
 * Retourne le nom d'affichage préféré d'une organisation
 *
 * Priorité :
 * 1. trade_name (nom commercial) si renseigné
 * 2. legal_name (raison sociale) sinon
 *
 * @param org Organisation complète ou partielle {legal_name, trade_name}
 * @returns Nom d'affichage (jamais vide car legal_name est obligatoire)
 *
 * @example
 * // Organisation avec nom commercial
 * const org1 = { legal_name: "SARL Mobilier Pro", trade_name: "MobiPro Design" }
 * getOrganisationDisplayName(org1) // "MobiPro Design"
 *
 * // Organisation sans nom commercial
 * const org2 = { legal_name: "SARL Mobilier Pro", trade_name: null }
 * getOrganisationDisplayName(org2) // "SARL Mobilier Pro"
 */
export function getOrganisationDisplayName(
  org: Pick<Organisation, 'legal_name' | 'trade_name'>
): string {
  return org.trade_name || org.legal_name
}

/**
 * Retourne le nom légal (raison sociale) de l'organisation
 *
 * @param org Organisation
 * @returns Raison sociale
 */
export function getOrganisationLegalName(
  org: Pick<Organisation, 'legal_name'>
): string {
  return org.legal_name
}

/**
 * Retourne le nom commercial si disponible, sinon null
 *
 * @param org Organisation
 * @returns Nom commercial ou null
 */
export function getOrganisationTradeName(
  org: Pick<Organisation, 'trade_name'>
): string | null {
  return org.trade_name
}

'use server'

import { createClient } from '@/lib/supabase/server'
import * as XLSX from 'xlsx'
import { z } from 'zod'

// =============================================
// SCHEMAS DE VALIDATION EXPORT
// =============================================

const exportProprietesSchema = z.object({
  format: z.enum(['csv', 'excel']),
  filters: z.object({
    statut: z.array(z.string()).optional(),
    type: z.array(z.string()).optional(),
    ville: z.string().optional(),
    pays: z.string().optional(),
    organisation_id: z.string().uuid().optional(),
    date_debut: z.string().optional(),
    date_fin: z.string().optional(),
  }).optional(),
  fields: z.array(z.string()).optional(),
})

const exportProprietairesSchema = z.object({
  format: z.enum(['csv', 'excel']),
  filters: z.object({
    type: z.array(z.string()).optional(),
    pays: z.string().optional(),
    is_active: z.boolean().optional(),
    organisation_id: z.string().uuid().optional(),
  }).optional(),
  fields: z.array(z.string()).optional(),
})

// =============================================
// TYPES
// =============================================

export type ExportFormat = 'csv' | 'excel'

export type ExportResult = {
  success: boolean
  data?: {
    filename: string
    content: string | Buffer
    mimeType: string
  }
  error?: string
}

// =============================================
// FONCTIONS D'EXPORT PROPRIÉTÉS
// =============================================

/**
 * Exporter la liste des propriétés
 */
export async function exportProprietes(params: z.infer<typeof exportProprietesSchema>): Promise<ExportResult> {
  try {
    const validatedParams = exportProprietesSchema.parse(params)
    const supabase = await createClient()
    
    // Construction de la requête avec filtres
    let query = supabase
      .from('proprietes_list_v')
      .select(`
        nom,
        type,
        adresse_ligne1,
        ville,
        code_postal,
        pays,
        statut,
        surface_m2,
        surface_totale,
        surface_habitable_m2,
        nombre_pieces,
        nb_chambres,
        nb_sdb,
        prix_achat,
        valeur_marche,
        organisation_nom,
        proprietaire_nom_complet,
        unites_count,
        photos_count,
        created_at
      `)
    
    // Appliquer les filtres
    if (validatedParams.filters) {
      const filters = validatedParams.filters
      
      if (filters.statut && filters.statut.length > 0) {
        query = query.in('statut', filters.statut)
      }
      
      if (filters.type && filters.type.length > 0) {
        query = query.in('type', filters.type)
      }
      
      if (filters.ville) {
        query = query.ilike('ville', `%${filters.ville}%`)
      }
      
      if (filters.pays) {
        query = query.eq('pays', filters.pays)
      }
      
      if (filters.organisation_id) {
        query = query.eq('organisation_id', filters.organisation_id)
      }
      
      if (filters.date_debut) {
        query = query.gte('created_at', filters.date_debut)
      }
      
      if (filters.date_fin) {
        query = query.lte('created_at', filters.date_fin)
      }
    }
    
    const { data, error } = await query.order('nom')
    
    if (error) throw error
    
    if (!data || data.length === 0) {
      return {
        success: false,
        error: 'Aucune propriété trouvée avec les critères spécifiés'
      }
    }
    
    // Transformation des données pour l'export
    const exportData = data.map(item => ({
      'Nom': item.nom || '',
      'Type': item.type || '',
      'Adresse': item.adresse_ligne1 || '',
      'Ville': item.ville || '',
      'Code Postal': item.code_postal || '',
      'Pays': item.pays || '',
      'Statut': item.statut || '',
      'Surface (m²)': item.surface_m2 || '',
      'Surface Habitable (m²)': item.surface_habitable_m2 || '',
      'Nombre de Pièces': item.nombre_pieces || '',
      'Chambres': item.nb_chambres || '',
      'Salles de Bain': item.nb_sdb || '',
      'Prix d\'Achat (€)': item.prix_achat || '',
      'Valeur Marché (€)': item.valeur_marche || '',
      'Organisation': item.organisation_nom || '',
      'Propriétaire': item.proprietaire_nom_complet || '',
      'Nombre d\'Unités': item.unites_count || 0,
      'Nombre de Photos': item.photos_count || 0,
      'Date de Création': item.created_at ? new Date(item.created_at).toLocaleDateString('fr-FR') : '',
    }))
    
    // Générer le fichier selon le format
    if (validatedParams.format === 'csv') {
      return generateCSV(exportData, 'proprietes')
    } else {
      return generateExcel(exportData, 'proprietes', 'Liste des Propriétés')
    }
    
  } catch (error) {
    console.error('Error exporting proprietes:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur lors de l\'export'
    }
  }
}

/**
 * Exporter la liste des propriétaires
 */
export async function exportProprietaires(params: z.infer<typeof exportProprietairesSchema>): Promise<ExportResult> {
  try {
    const validatedParams = exportProprietairesSchema.parse(params)
    const supabase = await createClient()
    
    // Construction de la requête
    let query = supabase
      .from('proprietaires')
      .select(`
        nom,
        prenom,
        type,
        email,
        telephone,
        adresse,
        ville,
        code_postal,
        pays,
        forme_juridique,
        numero_identification,
        capital_social,
        nombre_parts_total,
        is_active,
        created_at
      `)
    
    // Appliquer les filtres
    if (validatedParams.filters) {
      const filters = validatedParams.filters
      
      if (filters.type && filters.type.length > 0) {
        query = query.in('type', filters.type)
      }
      
      if (filters.pays) {
        query = query.eq('pays', filters.pays)
      }
      
      if (filters.is_active !== undefined) {
        query = query.eq('is_active', filters.is_active)
      }
    }
    
    const { data, error } = await query.order('nom')
    
    if (error) throw error
    
    if (!data || data.length === 0) {
      return {
        success: false,
        error: 'Aucun propriétaire trouvé avec les critères spécifiés'
      }
    }
    
    // Transformation des données pour l'export
    const exportData = data.map(item => ({
      'Nom': item.nom || '',
      'Prénom': item.prenom || '',
      'Type': item.type === 'physique' ? 'Personne physique' : 'Personne morale',
      'Email': item.email || '',
      'Téléphone': item.telephone || '',
      'Adresse': item.adresse || '',
      'Ville': item.ville || '',
      'Code Postal': item.code_postal || '',
      'Pays': item.pays || '',
      'Forme Juridique': item.forme_juridique || '',
      'N° Identification': item.numero_identification || '',
      'Capital Social (€)': item.capital_social || '',
      'Nombre Parts Total': item.nombre_parts_total || '',
      'Statut': item.is_active ? 'Actif' : 'Inactif',
      'Date de Création': item.created_at ? new Date(item.created_at).toLocaleDateString('fr-FR') : '',
    }))
    
    // Générer le fichier selon le format
    if (validatedParams.format === 'csv') {
      return generateCSV(exportData, 'proprietaires')
    } else {
      return generateExcel(exportData, 'proprietaires', 'Liste des Propriétaires')
    }
    
  } catch (error) {
    console.error('Error exporting proprietaires:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur lors de l\'export'
    }
  }
}

// =============================================
// FONCTIONS UTILITAIRES
// =============================================

/**
 * Générer un fichier CSV
 */
function generateCSV(data: any[], filename: string): ExportResult {
  try {
    if (data.length === 0) {
      return {
        success: false,
        error: 'Aucune donnée à exporter'
      }
    }
    
    const headers = Object.keys(data[0])
    const csvContent = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          const value = row[header]
          // Échapper les guillemets et encapsuler si nécessaire
          if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
            return `"${value.replace(/"/g, '""')}"`
          }
          return value
        }).join(',')
      )
    ].join('\n')
    
    // Ajouter BOM pour le support UTF-8 dans Excel
    const csvWithBOM = '\uFEFF' + csvContent
    
    const timestamp = new Date().toISOString().slice(0, 19).replace(/[:-]/g, '')
    
    return {
      success: true,
      data: {
        filename: `${filename}_${timestamp}.csv`,
        content: csvWithBOM,
        mimeType: 'text/csv'
      }
    }
    
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur lors de la génération CSV'
    }
  }
}

/**
 * Générer un fichier Excel
 */
function generateExcel(data: any[], filename: string, sheetName: string): ExportResult {
  try {
    if (data.length === 0) {
      return {
        success: false,
        error: 'Aucune donnée à exporter'
      }
    }
    
    // Créer un nouveau workbook
    const workbook = XLSX.utils.book_new()
    
    // Créer une feuille de calcul à partir des données
    const worksheet = XLSX.utils.json_to_sheet(data)
    
    // Ajuster la largeur des colonnes
    const columnWidths = Object.keys(data[0]).map(key => {
      const maxLength = Math.max(
        key.length,
        ...data.map(row => String(row[key] || '').length)
      )
      return { wch: Math.min(maxLength + 2, 50) }
    })
    
    worksheet['!cols'] = columnWidths
    
    // Ajouter la feuille au workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName)
    
    // Générer le buffer
    const excelBuffer = XLSX.write(workbook, { 
      type: 'buffer', 
      bookType: 'xlsx',
      compression: true
    })
    
    const timestamp = new Date().toISOString().slice(0, 19).replace(/[:-]/g, '')
    
    return {
      success: true,
      data: {
        filename: `${filename}_${timestamp}.xlsx`,
        content: excelBuffer,
        mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      }
    }
    
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur lors de la génération Excel'
    }
  }
}

/**
 * Obtenir les statistiques d'export
 */
export async function getExportStats() {
  try {
    const supabase = await createClient()
    
    const [proprietesCount, proprietairesCount, unitesCount] = await Promise.all([
      supabase.from('proprietes').select('*', { count: 'exact', head: true }),
      supabase.from('proprietaires').select('*', { count: 'exact', head: true }),
      supabase.from('unites').select('*', { count: 'exact', head: true }),
    ])
    
    return {
      success: true,
      data: {
        proprietes: proprietesCount.count || 0,
        proprietaires: proprietairesCount.count || 0,
        unites: unitesCount.count || 0,
      }
    }
  } catch (error) {
    console.error('Error getting export stats:', error)
    return {
      success: false,
      error: 'Erreur lors de la récupération des statistiques'
    }
  }
}
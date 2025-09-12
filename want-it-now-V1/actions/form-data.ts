'use server'

import { createClient } from '@/lib/supabase/server'

/**
 * Get available countries from organisations
 */
export async function getAvailableCountries(): Promise<{ success: boolean; data?: { code: string, name: string }[]; error?: string }> {
  try {
    const supabase = await createClient()
    
    // Get distinct countries from organisations
    const { data, error } = await supabase
      .from('organisations')
      .select('pays')
    
    if (error) {
      console.error('Error fetching countries:', error)
      return { success: false, error: 'Erreur lors de la récupération des pays' }
    }
    
    // Extract unique countries and format them
    const uniqueCountries = [...new Set(data.map(org => org.pays))]
    const countries = uniqueCountries.map(code => ({
      code,
      name: getCountryName(code)
    }))
    
    return { success: true, data: countries }
  } catch (error) {
    console.error('Error:', error)
    return { success: false, error: 'Erreur système' }
  }
}


function getCountryName(code: string): string {
  const countryNames: Record<string, string> = {
    'FR': 'France',
    'BE': 'Belgique',
    'CH': 'Suisse',
    'ES': 'Espagne',
    'IT': 'Italie',
    'DE': 'Allemagne',
    'UK': 'Royaume-Uni',
    'US': 'États-Unis',
    'CA': 'Canada'
  }
  
  return countryNames[code] || code
}
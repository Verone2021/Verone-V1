import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getServerAuthData } from '@/lib/auth/server-auth'

export interface AuthorizedCountry {
  code: string
  name: string
  organisationId: string
  organisationName: string
}

export interface AuthorizedCountriesResponse {
  countries: AuthorizedCountry[]
  isGlobalAccess: boolean
}

const COUNTRY_NAMES: Record<string, string> = {
  'FR': 'France',
  'ES': 'Espagne', 
  'IT': 'Italie',
  'DE': 'Allemagne',
  'GB': 'Royaume-Uni',
  'PT': 'Portugal',
  'BE': 'Belgique',
  'NL': 'Pays-Bas',
  'CH': 'Suisse',
  'LU': 'Luxembourg'
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const authData = await getServerAuthData()

    if (!authData.user) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      )
    }

    // Vérifier si l'utilisateur est super admin
    const isSuperAdmin = authData.userRoles.some(role => role.role === 'super_admin')

    let countries: AuthorizedCountry[] = []

    if (isSuperAdmin) {
      // Super admin : tous les pays des organisations actives
      const { data: organisations, error } = await supabase
        .from('organisations')
        .select('id, nom, pays')
        .eq('is_active', true)
        .order('nom')

      if (error) {
        console.error('Erreur récupération organisations pour super admin:', error)
        return NextResponse.json(
          { error: 'Erreur lors de la récupération des pays' },
          { status: 500 }
        )
      }

      countries = organisations?.map(org => ({
        code: org.pays,
        name: COUNTRY_NAMES[org.pays] || org.pays,
        organisationId: org.id,
        organisationName: org.nom
      })) || []

    } else {
      // Admin régulier : pays des organisations assignées
      const organisationIds = authData.userRoles
        .filter(role => role.role === 'admin')
        .map(role => role.organisation_id)

      if (organisationIds.length === 0) {
        return NextResponse.json({
          countries: [],
          isGlobalAccess: false
        })
      }

      const { data: organisations, error } = await supabase
        .from('organisations')
        .select('id, nom, pays')
        .in('id', organisationIds)
        .eq('is_active', true)
        .order('nom')

      if (error) {
        console.error('Erreur récupération organisations pour admin:', error)
        return NextResponse.json(
          { error: 'Erreur lors de la récupération des pays' },
          { status: 500 }
        )
      }

      countries = organisations?.map(org => ({
        code: org.pays,
        name: COUNTRY_NAMES[org.pays] || org.pays,
        organisationId: org.id,
        organisationName: org.nom
      })) || []
    }

    // Dédupliquer par code pays (au cas où plusieurs orgs auraient le même pays)
    const uniqueCountries = countries.reduce((acc, country) => {
      const existing = acc.find(c => c.code === country.code)
      if (!existing) {
        acc.push(country)
      }
      return acc
    }, [] as AuthorizedCountry[])

    return NextResponse.json({
      countries: uniqueCountries,
      isGlobalAccess: isSuperAdmin
    })

  } catch (error) {
    console.error('Erreur API countries/authorized:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}
import { useState, useEffect } from 'react'
import type { AuthorizedCountry, AuthorizedCountriesResponse } from '@/app/api/countries/authorized/route'

interface UseAuthorizedCountriesResult {
  countries: AuthorizedCountry[]
  isGlobalAccess: boolean
  isLoading: boolean
  error: string | null
  refetch: () => void
}

export function useAuthorizedCountries(): UseAuthorizedCountriesResult {
  const [countries, setCountries] = useState<AuthorizedCountry[]>([])
  const [isGlobalAccess, setIsGlobalAccess] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchCountries = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch('/api/countries/authorized')
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erreur lors de la récupération des pays')
      }

      const data: AuthorizedCountriesResponse = await response.json()
      
      setCountries(data.countries)
      setIsGlobalAccess(data.isGlobalAccess)

    } catch (err) {
      console.error('Erreur fetch countries:', err)
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
      setCountries([])
      setIsGlobalAccess(false)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchCountries()
  }, [])

  return {
    countries,
    isGlobalAccess,
    isLoading,
    error,
    refetch: fetchCountries
  }
}

// Hook utilitaire pour obtenir seulement la liste des codes pays
export function useAuthorizedCountryCodes(): {
  countryCodes: string[]
  isLoading: boolean
  error: string | null
} {
  const { countries, isLoading, error } = useAuthorizedCountries()
  
  return {
    countryCodes: countries.map(country => country.code),
    isLoading,
    error
  }
}

// Hook utilitaire pour vérifier si un pays est autorisé
export function useIsCountryAuthorized(countryCode: string): {
  isAuthorized: boolean
  isLoading: boolean
  error: string | null
} {
  const { countries, isLoading, error } = useAuthorizedCountries()
  
  return {
    isAuthorized: countries.some(country => country.code === countryCode),
    isLoading,
    error
  }
}
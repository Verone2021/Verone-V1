/**
 * 🔧 Supabase Client - Client Side
 *
 * Configuration client standard compatible SSR
 */

import { createBrowserClient } from '@supabase/ssr'
import { Database } from './types'

export const createClient = () =>
  createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

// Helper pour retry avec backoff exponential
export const withRetry = async <T>(
  operation: () => Promise<T>,
  maxRetries = 3,
  baseDelay = 1000
): Promise<T> => {
  let lastError: Error

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation()
    } catch (error) {
      lastError = error as Error

      // Ne pas retry pour certaines erreurs
      if (error && typeof error === 'object' && 'code' in error) {
        const errorCode = (error as any).code
        if (['PGRST301', 'PGRST204', '42P01'].includes(errorCode)) {
          throw error // Erreurs de schema/structure, pas de retry
        }
      }

      if (attempt === maxRetries) {
        break
      }

      // Backoff exponential avec jitter
      const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 1000
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }

  throw lastError!
}

// Debounce pour éviter appels multiples simultanés
const debounceMap = new Map<string, Promise<any>>()

export const withDebounce = async <T>(
  key: string,
  operation: () => Promise<T>,
  delay = 100
): Promise<T> => {
  if (debounceMap.has(key)) {
    return debounceMap.get(key)!
  }

  const promise = new Promise<T>((resolve, reject) => {
    setTimeout(async () => {
      try {
        const result = await operation()
        debounceMap.delete(key)
        resolve(result)
      } catch (error) {
        debounceMap.delete(key)
        reject(error)
      }
    }, delay)
  })

  debounceMap.set(key, promise)
  return promise
}
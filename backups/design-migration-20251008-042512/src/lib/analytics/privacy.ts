/**
 * 🔐 Privacy Utilities - Analytics RGPD Compliant
 * Fonctions d'anonymisation pour conformité GDPR
 */

/**
 * Anonymise une adresse IP selon environnement
 * Production: Truncation (12.34.xxx.xxx)
 * Development: IP complète (debugging)
 */
export function anonymizeIP(ip: string | null): string | null {
  if (!ip) return null

  // En développement, garder IP complète pour debugging
  if (process.env.NODE_ENV === 'development') {
    return ip
  }

  // En production, anonymiser
  try {
    // IPv4: 12.34.56.78 → 12.34.0.0
    if (ip.includes('.')) {
      const parts = ip.split('.')
      if (parts.length === 4) {
        return `${parts[0]}.${parts[1]}.0.0`
      }
    }

    // IPv6: 2001:0db8:85a3:0000:0000:8a2e:0370:7334 → 2001:0db8:85a3::
    if (ip.includes(':')) {
      const parts = ip.split(':')
      if (parts.length >= 3) {
        return `${parts[0]}:${parts[1]}:${parts[2]}::`
      }
    }

    // Si format non reconnu, ne pas stocker
    return null
  } catch (error) {
    console.error('[Privacy] IP anonymization error:', error)
    return null
  }
}

/**
 * Simplifie User Agent pour éviter fingerprinting
 * "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)..." → "Chrome/macOS"
 */
export function simplifyUserAgent(userAgent: string | null): string | null {
  if (!userAgent) return null

  // En développement, garder UA complet pour debugging
  if (process.env.NODE_ENV === 'development') {
    return userAgent
  }

  // En production, simplifier
  try {
    // Détecter browser
    const browser = userAgent.includes('Edg') ? 'Edge' :
                    userAgent.includes('Chrome') ? 'Chrome' :
                    userAgent.includes('Firefox') ? 'Firefox' :
                    userAgent.includes('Safari') && !userAgent.includes('Chrome') ? 'Safari' :
                    'Other'

    // Détecter OS
    const os = userAgent.includes('Mac') ? 'macOS' :
               userAgent.includes('Windows') ? 'Windows' :
               userAgent.includes('Linux') ? 'Linux' :
               userAgent.includes('Android') ? 'Android' :
               userAgent.includes('iOS') || userAgent.includes('iPhone') ? 'iOS' :
               'Other'

    return `${browser}/${os}`
  } catch (error) {
    console.error('[Privacy] User Agent simplification error:', error)
    return 'Unknown/Unknown'
  }
}

/**
 * Vérifie si nous sommes dans les heures de travail
 * Lundi-Vendredi, 9h-18h
 * Protège vie privée employés hors heures travail
 */
export function isWorkingHours(date: Date = new Date()): boolean {
  const hour = date.getHours()
  const day = date.getDay()

  // Jour de semaine (1 = Lundi, 5 = Vendredi)
  const isWeekday = day >= 1 && day <= 5

  // Heures travail (9h-18h)
  const isBusinessHour = hour >= 9 && hour < 18

  return isWeekday && isBusinessHour
}

/**
 * Hash une chaîne de manière sécurisée (pour session ID, etc.)
 * Utilise Web Crypto API (Edge compatible)
 */
export async function hashString(input: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(input)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

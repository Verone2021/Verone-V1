/**
 * Utilitaires de debugging et de nettoyage pour Supabase Auth
 * Résolution des erreurs "Failed to fetch" et amélioration de la robustesse
 */

interface SupabaseAuthState {
  token?: string
  refreshToken?: string
  expiresAt?: number
  isExpired: boolean
  error?: string
}

/**
 * Analyse l'état actuel de l'authentification Supabase dans le localStorage
 */
export function analyzeSupabaseAuthState(): SupabaseAuthState {
  if (typeof window === 'undefined') {
    return { isExpired: true, error: 'Server-side environment' }
  }

  try {
    // Chercher la clé Supabase auth dans localStorage
    const supabaseKeys = Object.keys(localStorage).filter(key => 
      key.includes('supabase') && key.includes('auth')
    )

    console.log('🔍 [SUPABASE-DEBUG] Clés Supabase trouvées:', supabaseKeys)

    if (supabaseKeys.length === 0) {
      return { isExpired: true, error: 'Aucune session trouvée' }
    }

    // Analyser la première clé trouvée (généralement supabase.auth.token)
    const authKey = supabaseKeys[0]
    const authData = localStorage.getItem(authKey)

    if (!authData) {
      return { isExpired: true, error: 'Données auth vides' }
    }

    const parsedData = JSON.parse(authData)
    console.log('📊 [SUPABASE-DEBUG] Données auth parsées:', {
      hasAccessToken: !!parsedData.access_token,
      hasRefreshToken: !!parsedData.refresh_token,
      expiresAt: parsedData.expires_at,
      currentTime: Math.floor(Date.now() / 1000)
    })

    const expiresAt = parsedData.expires_at || 0
    const currentTime = Math.floor(Date.now() / 1000)
    const isExpired = expiresAt < currentTime

    return {
      token: parsedData.access_token,
      refreshToken: parsedData.refresh_token,
      expiresAt,
      isExpired,
      error: isExpired ? 'Token expiré' : undefined
    }

  } catch (error) {
    console.error('💥 [SUPABASE-DEBUG] Erreur analyse auth state:', error)
    return { 
      isExpired: true, 
      error: error instanceof Error ? error.message : 'Erreur parsing' 
    }
  }
}

/**
 * Nettoie complètement le cache Supabase du localStorage
 */
export function clearSupabaseCache(): void {
  if (typeof window === 'undefined') {
    console.warn('⚠️ [SUPABASE-DEBUG] clearSupabaseCache appelé côté serveur')
    return
  }

  try {
    const supabaseKeys = Object.keys(localStorage).filter(key => 
      key.includes('supabase') || key.includes('auth')
    )

    console.log('🧹 [SUPABASE-DEBUG] Nettoyage des clés:', supabaseKeys)

    supabaseKeys.forEach(key => {
      localStorage.removeItem(key)
      console.log(`✅ [SUPABASE-DEBUG] Clé supprimée: ${key}`)
    })

    // Nettoyer aussi sessionStorage si nécessaire
    const sessionSupabaseKeys = Object.keys(sessionStorage).filter(key => 
      key.includes('supabase') || key.includes('auth')
    )

    sessionSupabaseKeys.forEach(key => {
      sessionStorage.removeItem(key)
      console.log(`✅ [SUPABASE-DEBUG] SessionStorage clé supprimée: ${key}`)
    })

    console.log('✨ [SUPABASE-DEBUG] Cache Supabase complètement nettoyé')
  } catch (error) {
    console.error('💥 [SUPABASE-DEBUG] Erreur nettoyage cache:', error)
  }
}

/**
 * Détecte les problèmes courants d'authentification Supabase
 */
export function diagnoseSupabaseIssues(): string[] {
  const issues: string[] = []
  
  if (typeof window === 'undefined') {
    return ['Environment côté serveur - diagnostic impossible']
  }

  try {
    // Vérifier la connectivité réseau
    if (!navigator.onLine) {
      issues.push('Pas de connexion internet détectée')
    }

    // Analyser l'état auth
    const authState = analyzeSupabaseAuthState()
    
    if (authState.error) {
      issues.push(`Problème auth: ${authState.error}`)
    }

    if (authState.isExpired) {
      issues.push('Token d\'authentification expiré')
    }

    // Vérifier les variables d'environnement
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      issues.push('Variable NEXT_PUBLIC_SUPABASE_URL manquante')
    }

    if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      issues.push('Variable NEXT_PUBLIC_SUPABASE_ANON_KEY manquante')
    }

    // Vérifier le localStorage
    try {
      localStorage.setItem('test', 'test')
      localStorage.removeItem('test')
    } catch {
      issues.push('LocalStorage non accessible')
    }

  } catch (error) {
    issues.push(`Erreur diagnostic: ${error instanceof Error ? error.message : 'Inconnue'}`)
  }

  return issues
}

/**
 * Fonction utilitaire pour logger les erreurs Supabase de manière détaillée
 */
export function logSupabaseError(error: any, context: string): void {
  const errorInfo = {
    context,
    message: error?.message || 'Message d\'erreur inconnu',
    code: error?.code || 'Code inconnu',
    details: error?.details || 'Pas de détails',
    hint: error?.hint || 'Pas d\'aide',
    timestamp: new Date().toISOString(),
    userAgent: typeof window !== 'undefined' ? navigator.userAgent : 'Server',
    online: typeof window !== 'undefined' ? navigator.onLine : true
  }

  console.group(`🚨 [SUPABASE-ERROR] ${context}`)
  console.error('Message:', errorInfo.message)
  console.error('Code:', errorInfo.code)
  console.error('Détails:', errorInfo.details)
  console.error('Suggestion:', errorInfo.hint)
  console.error('Timestamp:', errorInfo.timestamp)
  console.error('Online:', errorInfo.online)
  console.error('Erreur complète:', error)
  console.groupEnd()
}

/**
 * Wrapper pour les appels Supabase avec retry automatique
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delayMs: number = 1000
): Promise<T> {
  let lastError: any

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🔄 [SUPABASE-RETRY] Tentative ${attempt}/${maxRetries}`)
      const result = await Promise.race([
        operation(),
        new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error('Timeout')), 10000) // 10s timeout
        })
      ])
      
      if (attempt > 1) {
        console.log(`✅ [SUPABASE-RETRY] Succès après ${attempt} tentatives`)
      }
      
      return result
    } catch (error) {
      lastError = error
      logSupabaseError(error, `Retry attempt ${attempt}/${maxRetries}`)

      if (attempt === maxRetries) {
        console.error(`💥 [SUPABASE-RETRY] Échec final après ${maxRetries} tentatives`)
        throw error
      }

      // Backoff exponentiel
      const delay = delayMs * Math.pow(2, attempt - 1)
      console.log(`⏳ [SUPABASE-RETRY] Attente ${delay}ms avant nouvelle tentative`)
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }

  throw lastError
}

/**
 * Fonction de diagnostic complet à appeler en cas de problème
 */
export function runSupabaseHealthCheck(): void {
  console.group('🏥 [SUPABASE-HEALTH] Check de santé Supabase')
  
  const authState = analyzeSupabaseAuthState()
  const issues = diagnoseSupabaseIssues()
  
  console.log('📊 État authentification:', authState)
  console.log('🔍 Problèmes détectés:', issues)
  
  if (issues.length === 0) {
    console.log('✅ Aucun problème détecté')
  } else {
    console.warn('⚠️ Problèmes trouvés:', issues)
    console.log('💡 Suggestions:')
    console.log('  - Essayer clearSupabaseCache()')
    console.log('  - Vérifier la connexion internet')
    console.log('  - Redémarrer l\'application')
  }
  
  console.groupEnd()
}
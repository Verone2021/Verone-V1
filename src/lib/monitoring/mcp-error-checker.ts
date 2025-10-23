/**
 * 🔍 MCP Error Checker - Console Error Detection
 *
 * Utilitaire pour récupérer erreurs console via MCP Playwright Browser
 * Compatible avec Console Error Tracker global
 *
 * Usage (MCP Playwright Browser uniquement) :
 * 1. mcp__playwright__browser_navigate(url)
 * 2. mcp__playwright__browser_wait_for(time: 2)
 * 3. mcp__playwright__browser_evaluate({ function: "() => window.__consoleErrorTracker?.getErrors() || []" })
 * 4. mcp__playwright__browser_console_messages({ onlyErrors: true })
 */

export interface MCPErrorCheckResult {
  url: string
  timestamp: string
  hasErrors: boolean
  errorCount: number
  warningCount: number
  errors: ConsoleErrorLog[]
  consoleErrors: string[]
  summary: string
}

export interface ConsoleErrorLog {
  timestamp: string
  level: 'error' | 'warn' | 'info'
  message: string
  url: string
  userAgent: string
  sessionId?: string
  userId?: string
  stack?: string
}

/**
 * 🎯 Format rapport d'erreurs
 */
export function formatErrorReport(result: MCPErrorCheckResult): string {
  const lines: string[] = []

  lines.push(`🔍 Error Check Report - ${result.url}`)
  lines.push(`📅 ${result.timestamp}`)
  lines.push('')

  if (!result.hasErrors) {
    lines.push('✅ Zero erreurs console détectées')
    lines.push('✅ Application fonctionne correctement')
  } else {
    lines.push(`❌ ${result.errorCount} erreur(s) détectée(s)`)
    if (result.warningCount > 0) {
      lines.push(`⚠️  ${result.warningCount} warning(s)`)
    }
    lines.push('')

    // Erreurs trackées (en mémoire)
    if (result.errors.length > 0) {
      lines.push('🔴 Erreurs trackées (Console Error Tracker):')
      result.errors.forEach((err, i) => {
        lines.push(`${i + 1}. [${err.level.toUpperCase()}] ${err.message}`)
        if (err.stack) {
          lines.push(`   Stack: ${err.stack.split('\n')[0]}`)
        }
      })
      lines.push('')
    }

    // Console errors bruts (MCP Playwright)
    if (result.consoleErrors.length > 0) {
      lines.push('🔴 Console Errors (MCP Playwright):')
      result.consoleErrors.forEach((err, i) => {
        lines.push(`${i + 1}. ${err}`)
      })
    }
  }

  return lines.join('\n')
}

/**
 * 📊 Calculer statistiques erreurs
 */
export function calculateErrorStats(errors: ConsoleErrorLog[]) {
  return {
    totalErrors: errors.filter(e => e.level === 'error').length,
    totalWarnings: errors.filter(e => e.level === 'warn').length,
    lastError: errors[errors.length - 1],
    errorsByPage: errors.reduce((acc, err) => {
      const page = new URL(err.url).pathname
      acc[page] = (acc[page] || 0) + 1
      return acc
    }, {} as Record<string, number>)
  }
}

/**
 * 🎯 Vérifier si erreur critique
 */
export function isCriticalError(error: ConsoleErrorLog): boolean {
  const criticalPatterns = [
    /uncaught/i,
    /unhandled/i,
    /cannot read property/i,
    /undefined is not/i,
    /null is not/i,
    /failed to fetch/i,
    /network error/i,
    /syntax error/i,
    /reference error/i,
    /type error/i
  ]

  return criticalPatterns.some(pattern => pattern.test(error.message))
}

/**
 * 🔧 Template MCP Playwright workflow
 */
export const MCP_ERROR_CHECK_WORKFLOW = `
# MCP Playwright Error Checking Workflow

## 1. Naviguer vers la page
mcp__playwright__browser_navigate({ url: "http://localhost:3000/page" })

## 2. Attendre chargement complet
mcp__playwright__browser_wait_for({ time: 2 })

## 3. Récupérer erreurs console (trackées)
mcp__playwright__browser_evaluate({
  function: "() => window.__consoleErrorTracker?.getErrors() || []"
})

## 4. Récupérer console messages bruts
mcp__playwright__browser_console_messages({ onlyErrors: true })

## 5. Prendre screenshot si erreurs
mcp__playwright__browser_take_screenshot({
  filename: "error-screenshot.png"
})
`

/**
 * 🎯 Utilitaire pour filter erreurs par critères
 */
export function filterErrors(
  errors: ConsoleErrorLog[],
  filters: {
    level?: 'error' | 'warn' | 'info'
    url?: string
    since?: Date
    criticalOnly?: boolean
  }
): ConsoleErrorLog[] {
  let filtered = errors

  if (filters.level) {
    filtered = filtered.filter(e => e.level === filters.level)
  }

  if (filters.url) {
    filtered = filtered.filter(e => e.url.includes(filters.url))
  }

  if (filters.since) {
    filtered = filtered.filter(e => new Date(e.timestamp) >= filters.since!)
  }

  if (filters.criticalOnly) {
    filtered = filtered.filter(isCriticalError)
  }

  return filtered
}

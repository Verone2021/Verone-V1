#!/usr/bin/env node
/**
 * 🔍 Console Errors Monitor - Zero Console Tolerance
 *
 * Script automatique de validation des erreurs console sur les pages critiques.
 * Utilisé en CI/CD pour bloquer les déploiements si erreurs détectées.
 *
 * RÈGLE SACRÉE (CLAUDE.md): 1 erreur console = ÉCHEC COMPLET
 *
 * USAGE:
 *   npm run check:console
 *   npm run check:console -- --url=http://localhost:3000/stocks
 *   npm run check:console -- --ci  (mode CI - exit code 1 si erreurs)
 *
 * BEST PRACTICES 2025:
 * - Pattern: Vercel, Netflix DevOps, AWS Amplify
 * - Intégration: GitHub Actions, pre-push hooks
 * - Coverage: Routes critiques + user journeys
 *
 * @author Vérone Back Office Team
 * @date 2025-11-09
 */

import {
  chromium,
  type Browser,
  type Page,
  type ConsoleMessage,
  type BrowserContext,
} from '@playwright/test';
import path from 'path';
import { authenticateSupabase, getSupabaseProjectRef } from './auth-setup';

// ============================================================================
// CONFIGURATION
// ============================================================================

const CONFIG = {
  // Timeout pour chargement page (30s max)
  TIMEOUT_MS: 30000,

  // Base URL de l'application
  BASE_URL: process.env.APP_URL || 'http://localhost:3000',

  // Routes critiques à tester (ordre de priorité)
  CRITICAL_ROUTES: [
    '/dashboard', // Dashboard principal (KPI, métriques)
    '/contacts-organisations/customers', // Gestion clients
    '/produits/catalogue', // Catalogue produits
    '/stocks', // Gestion stocks
    '/commandes/fournisseurs', // Commandes fournisseurs
  ] as const,

  // Patterns d'erreurs à ignorer (false positives connus)
  IGNORED_ERROR_PATTERNS: [
    /Download the React DevTools/, // Info React DevTools (dev only)
    /GoTrueClient.*Multiple tabs detected/, // Supabase multi-tabs warning (non-bloquant)
  ] as const,
} as const;

// ============================================================================
// TYPES
// ============================================================================

interface ConsoleError {
  route: string;
  type: 'error' | 'warning';
  message: string;
  stackTrace?: string;
  timestamp: string;
}

interface TestResult {
  route: string;
  status: 'pass' | 'fail';
  errors: ConsoleError[];
  warnings: ConsoleError[];
  duration: number;
}

interface FinalReport {
  totalRoutes: number;
  passedRoutes: number;
  failedRoutes: number;
  totalErrors: number;
  totalWarnings: number;
  results: TestResult[];
  timestamp: string;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Vérifie si une erreur doit être ignorée
 */
function shouldIgnoreError(message: string): boolean {
  return CONFIG.IGNORED_ERROR_PATTERNS.some(pattern => pattern.test(message));
}

/**
 * Formatte la durée en millisecondes
 */
function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

/**
 * Extrait la stack trace d'un message console si disponible
 */
function extractStackTrace(msg: ConsoleMessage): string | undefined {
  try {
    const location = msg.location();
    if (location.url) {
      return `${location.url}:${location.lineNumber}:${location.columnNumber}`;
    }
  } catch {
    // Pas de stack trace disponible
  }
  return undefined;
}

// ============================================================================
// CORE LOGIC
// ============================================================================

/**
 * Teste une route spécifique et capture les erreurs console
 */
async function testRoute(page: Page, route: string): Promise<TestResult> {
  const startTime = Date.now();
  const errors: ConsoleError[] = [];
  const warnings: ConsoleError[] = [];

  // Configurer les listeners console AVANT navigation
  page.on('console', (msg: ConsoleMessage) => {
    const message = msg.text();
    const type = msg.type();

    // Ignorer les messages info/log (seulement errors/warnings)
    if (type !== 'error' && type !== 'warning') return;

    // Ignorer les false positives connus
    if (shouldIgnoreError(message)) return;

    const error: ConsoleError = {
      route,
      type: type as 'error' | 'warning',
      message,
      stackTrace: extractStackTrace(msg),
      timestamp: new Date().toISOString(),
    };

    if (type === 'error') {
      errors.push(error);
    } else {
      warnings.push(error);
    }
  });

  try {
    // Navigation vers la route avec timeout
    const url = `${CONFIG.BASE_URL}${route}`;
    console.log(`\n🔍 Testing: ${url}`);

    await page.goto(url, {
      waitUntil: 'networkidle',
      timeout: CONFIG.TIMEOUT_MS,
    });

    // Attendre que la page soit complètement chargée
    await page.waitForLoadState('domcontentloaded');

    // ✅ FIX: Attendre 5s pour que Supabase initialise la session depuis localStorage
    // Le client Supabase a besoin de temps pour lire localStorage et initialiser auth
    await page.waitForTimeout(5000);

    const duration = Date.now() - startTime;
    const status = errors.length === 0 ? 'pass' : 'fail';

    console.log(
      `${status === 'pass' ? '✅' : '❌'} ${route} - ${formatDuration(duration)} - ${errors.length} errors, ${warnings.length} warnings`
    );

    return {
      route,
      status,
      errors,
      warnings,
      duration,
    };
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`❌ ${route} - Navigation failed:`, error);

    // Erreur de navigation = erreur critique
    errors.push({
      route,
      type: 'error',
      message: `Navigation failed: ${error instanceof Error ? error.message : String(error)}`,
      timestamp: new Date().toISOString(),
    });

    return {
      route,
      status: 'fail',
      errors,
      warnings,
      duration,
    };
  }
}

/**
 * Teste toutes les routes critiques
 */
async function testAllRoutes(browser: Browser): Promise<FinalReport> {
  const results: TestResult[] = [];

  // ✅ Authentification Supabase AVANT navigation
  const session = await authenticateSupabase();
  const projectRef = getSupabaseProjectRef();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;

  // Créer context avec cookies Supabase SSR
  const context = await browser.newContext();

  // ✅ FIX CRITIQUE: @supabase/ssr utilise COOKIES, pas localStorage
  // Format cookies Supabase SSR (pattern 2025)
  const baseDomain = new URL(CONFIG.BASE_URL).hostname;

  await context.addCookies([
    {
      name: `sb-${projectRef}-auth-token`,
      value: JSON.stringify({
        access_token: session.access_token,
        refresh_token: session.refresh_token,
        expires_at: Math.floor(Date.now() / 1000) + session.expires_in,
        token_type: session.token_type,
        user: session.user,
      }),
      domain: baseDomain,
      path: '/',
      httpOnly: false,
      secure: CONFIG.BASE_URL.startsWith('https'),
      sameSite: 'Lax',
    },
  ]);

  console.log(`✅ Supabase cookies injected for ${baseDomain}`);

  const page = await context.newPage();

  try {
    // Tester chaque route séquentiellement
    for (const route of CONFIG.CRITICAL_ROUTES) {
      const result = await testRoute(page, route);
      results.push(result);
    }

    // Calculer statistiques finales
    const totalErrors = results.reduce((sum, r) => sum + r.errors.length, 0);
    const totalWarnings = results.reduce(
      (sum, r) => sum + r.warnings.length,
      0
    );
    const failedRoutes = results.filter(r => r.status === 'fail').length;

    return {
      totalRoutes: CONFIG.CRITICAL_ROUTES.length,
      passedRoutes: results.length - failedRoutes,
      failedRoutes,
      totalErrors,
      totalWarnings,
      results,
      timestamp: new Date().toISOString(),
    };
  } finally {
    await page.close();
    // ✅ Fermer context aussi
    await context.close();
  }
}

/**
 * Affiche le rapport final
 */
function printReport(report: FinalReport): void {
  console.log('\n' + '='.repeat(80));
  console.log('🔍 RAPPORT VALIDATION CONSOLE ERRORS');
  console.log('='.repeat(80));
  console.log(`\n📊 RÉSUMÉ:`);
  console.log(`   - Routes testées: ${report.totalRoutes}`);
  console.log(`   - Routes OK: ${report.passedRoutes}`);
  console.log(`   - Routes KO: ${report.failedRoutes}`);
  console.log(`   - Erreurs totales: ${report.totalErrors}`);
  console.log(`   - Warnings totaux: ${report.totalWarnings}`);

  if (report.totalErrors > 0) {
    console.log(`\n❌ ERREURS DÉTECTÉES:\n${'─'.repeat(80)}`);

    for (const result of report.results) {
      if (result.errors.length > 0) {
        console.log(`\n📁 ${result.route} (${result.errors.length} erreurs):`);

        for (const error of result.errors) {
          console.log(`\n   ${error.type.toUpperCase()}: ${error.message}`);
          if (error.stackTrace) {
            console.log(`   Stack: ${error.stackTrace}`);
          }
        }
      }
    }
  }

  if (report.totalWarnings > 0) {
    console.log(`\n⚠️  WARNINGS:\n${'─'.repeat(80)}`);

    for (const result of report.results) {
      if (result.warnings.length > 0) {
        console.log(`\n📁 ${result.route}:`);
        for (const warning of result.warnings) {
          console.log(`   ${warning.message}`);
        }
      }
    }
  }

  console.log('\n' + '='.repeat(80));

  if (report.totalErrors === 0) {
    console.log('✅ Aucune erreur console détectée - VALIDATION RÉUSSIE');
  } else {
    console.log('❌ ÉCHEC - Erreurs console détectées');
    console.log(
      '\n💡 RÈGLE SACRÉE: Console Zero Tolerance = 1 erreur = ÉCHEC COMPLET'
    );
  }

  console.log('='.repeat(80) + '\n');
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  console.log('🚀 Console Errors Monitor - Démarrage...\n');
  console.log(`Base URL: ${CONFIG.BASE_URL}`);
  console.log(`Routes à tester: ${CONFIG.CRITICAL_ROUTES.length}`);

  let browser: Browser | null = null;

  try {
    // Lancer navigateur Chromium
    browser = await chromium.launch({
      headless: true,
    });

    // Tester toutes les routes
    const report = await testAllRoutes(browser);

    // Afficher rapport
    printReport(report);

    // Exit code pour CI/CD
    const isCIMode = process.argv.includes('--ci');
    if (isCIMode && report.totalErrors > 0) {
      console.error('❌ CI Mode: Échec détecté - exit code 1');
      process.exit(1);
    }

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Erreur fatale:', error);
    process.exit(1);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Lancer script
main();

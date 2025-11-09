'use client';

/**
 * 🔍 Console Error Tracker - Simple & Professional
 *
 * Remplace Sentry par une solution légère basée sur console.log structuré
 * Compatible avec MCP Playwright Browser pour récupération automatique
 *
 * Features :
 * - Override console.error pour capture automatique
 * - Logs JSON structurés (timestamp, level, message, context)
 * - Envoi optionnel à API route /api/logs
 * - Zero dépendances, zero configuration
 *
 * @see Best practices Reddit r/nextjs 2025
 */

export interface ConsoleErrorLog {
  timestamp: string;
  level: 'error' | 'warn' | 'info';
  message: string;
  url: string;
  userAgent: string;
  sessionId?: string;
  userId?: string;
  stack?: string;
}

class ConsoleErrorTracker {
  private isSetup = false;
  private originalError: typeof console.error;
  private originalWarn: typeof console.warn;
  private sendToApi: boolean;
  private errors: ConsoleErrorLog[] = [];

  constructor(options: { sendToApi?: boolean } = {}) {
    this.originalError = console.error;
    this.originalWarn = console.warn;
    this.sendToApi = options.sendToApi ?? false;
  }

  /**
   * 🚀 Setup tracking (appeler une seule fois au démarrage app)
   */
  setup() {
    if (this.isSetup || typeof window === 'undefined') return;

    // Override console.error
    console.error = (...args: any[]) => {
      this.trackError('error', args);
      this.originalError.apply(console, args);
    };

    // Override console.warn (optionnel)
    console.warn = (...args: any[]) => {
      this.trackError('warn', args);
      this.originalWarn.apply(console, args);
    };

    // Global error handler (catches unhandled errors)
    window.addEventListener('error', (event: ErrorEvent) => {
      this.trackError(
        'error',
        [event.error?.message || event.message],
        event.error?.stack
      );
    });

    // Unhandled promise rejections
    window.addEventListener('unhandledrejection', (event: PromiseRejectionEvent) => {
      this.trackError('error', [`Unhandled Promise: ${event.reason}`]);
    });

    this.isSetup = true;
    console.log('✅ [ConsoleErrorTracker] Monitoring activé');
  }

  /**
   * 📝 Track error avec contexte enrichi
   */
  private trackError(level: 'error' | 'warn', args: any[], stack?: string) {
    const errorLog: ConsoleErrorLog = {
      timestamp: new Date().toISOString(),
      level,
      message: args
        .map(arg => {
          if (typeof arg === 'string') return arg;
          if (arg instanceof Error) return arg.message;
          return JSON.stringify(arg);
        })
        .join(' '),
      url: window.location.href,
      userAgent: navigator.userAgent,
      stack: stack || (args[0] instanceof Error ? args[0].stack : undefined),
    };

    // Ajouter session/user ID si disponible (localStorage)
    try {
      const sessionId = localStorage.getItem('verone_session_id');
      if (sessionId) errorLog.sessionId = sessionId;

      const userId = localStorage.getItem('verone_user_id');
      if (userId) errorLog.userId = userId;
    } catch (e) {
      // Ignore localStorage errors
    }

    // Stocker en mémoire (pour récupération MCP Playwright)
    this.errors.push(errorLog);
    if (this.errors.length > 100) {
      this.errors.shift(); // Keep only last 100 errors
    }

    // Envoyer à API route (optionnel)
    if (this.sendToApi && level === 'error') {
      this.sendToApiRoute(errorLog).catch(() => {
        // Fail silently - ne pas créer d'erreur récursive
      });
    }
  }

  /**
   * 📤 Envoyer log à API route
   */
  private async sendToApiRoute(log: ConsoleErrorLog) {
    try {
      await fetch('/api/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(log),
      });
    } catch (error) {
      // Fail silently
    }
  }

  /**
   * 📊 Récupérer erreurs stockées (pour MCP Playwright)
   */
  getErrors(): ConsoleErrorLog[] {
    return [...this.errors];
  }

  /**
   * 🧹 Clear erreurs
   */
  clearErrors() {
    this.errors = [];
  }

  /**
   * 📈 Get statistiques
   */
  getStats() {
    return {
      totalErrors: this.errors.filter(e => e.level === 'error').length,
      totalWarnings: this.errors.filter(e => e.level === 'warn').length,
      lastError: this.errors[this.errors.length - 1],
    };
  }
}

// 🌟 Instance globale (singleton)
export const consoleErrorTracker = new ConsoleErrorTracker({
  sendToApi: process.env.NODE_ENV === 'production', // Uniquement en prod
});

// 🪝 Hook React pour setup facile
export function useConsoleErrorTracking() {
  if (typeof window !== 'undefined') {
    consoleErrorTracker.setup();
  }
}

// 🎯 Export pour accès global (window)
if (typeof window !== 'undefined') {
  (window as any).__consoleErrorTracker = consoleErrorTracker;
}

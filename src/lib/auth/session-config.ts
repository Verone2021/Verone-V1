/**
 * 🔐 Session Configuration - Vérone Back Office
 *
 * Configuration de la sécurité des sessions et timeouts
 */

import React from 'react';

import logger from '@/lib/logger';
import { createClient } from '@/lib/supabase/client';

// Configuration des timeouts
export const SESSION_CONFIG = {
  // Timeout d'inactivité (30 minutes)
  IDLE_TIMEOUT: 30 * 60 * 1000,

  // Timeout absolu de session (8 heures)
  ABSOLUTE_TIMEOUT: 8 * 60 * 60 * 1000,

  // Intervalle de vérification (1 minute)
  CHECK_INTERVAL: 60 * 1000,

  // Warning avant expiration (5 minutes)
  WARNING_BEFORE_EXPIRY: 5 * 60 * 1000,

  // Refresh token interval (20 minutes)
  REFRESH_INTERVAL: 20 * 60 * 1000,
};

/**
 * Gestionnaire de session avec timeout
 */
export class SessionManager {
  private lastActivity: number;
  private sessionStart: number;
  private warningShown: boolean = false;
  private checkInterval?: NodeJS.Timeout;
  private refreshInterval?: NodeJS.Timeout;
  private activityListeners: (() => void)[] = [];

  constructor() {
    this.lastActivity = Date.now();
    this.sessionStart = Date.now();
    this.initializeListeners();
    this.startChecking();
    this.startTokenRefresh();
  }

  /**
   * Initialise les listeners d'activité
   */
  private initializeListeners() {
    const events = [
      'mousedown',
      'mousemove',
      'keypress',
      'scroll',
      'touchstart',
      'click',
    ];

    events.forEach(event => {
      const listener = () => this.updateActivity();
      document.addEventListener(event, listener);
      this.activityListeners.push(() =>
        document.removeEventListener(event, listener)
      );
    });

    // Listener pour visibility API
    const visibilityListener = () => {
      if (!document.hidden) {
        this.updateActivity();
      }
    };
    document.addEventListener('visibilitychange', visibilityListener);
    this.activityListeners.push(() =>
      document.removeEventListener('visibilitychange', visibilityListener)
    );
  }

  /**
   * Met à jour le timestamp de dernière activité
   */
  private updateActivity() {
    this.lastActivity = Date.now();
    this.warningShown = false;
  }

  /**
   * Démarre la vérification périodique
   */
  private startChecking() {
    this.checkInterval = setInterval(() => {
      this.checkSession();
    }, SESSION_CONFIG.CHECK_INTERVAL);
  }

  /**
   * Démarre le refresh automatique du token
   */
  private startTokenRefresh() {
    // 🔥 FIX CRITIQUE: Désactiver refresh automatique en développement
    // En dev, le refresh token peut être invalide/manquant, causant boucle infinie d'erreurs 400
    if (process.env.NODE_ENV === 'development') {
      logger.warn('Refresh automatique DÉSACTIVÉ en développement', {
        operation: 'session_refresh_disabled',
        environment: 'development',
      });
      return;
    }

    this.refreshInterval = setInterval(async () => {
      await this.refreshSession();
    }, SESSION_CONFIG.REFRESH_INTERVAL);
  }

  /**
   * Vérifie l'état de la session
   */
  private async checkSession() {
    const now = Date.now();
    const idleTime = now - this.lastActivity;
    const sessionTime = now - this.sessionStart;

    // Vérifier timeout absolu
    if (sessionTime >= SESSION_CONFIG.ABSOLUTE_TIMEOUT) {
      await this.handleSessionExpiry(
        'Session expirée (durée maximale atteinte)'
      );
      return;
    }

    // Vérifier timeout d'inactivité
    if (idleTime >= SESSION_CONFIG.IDLE_TIMEOUT) {
      await this.handleSessionExpiry('Session expirée (inactivité)');
      return;
    }

    // Afficher warning si proche de l'expiration
    const timeUntilExpiry = SESSION_CONFIG.IDLE_TIMEOUT - idleTime;
    if (
      timeUntilExpiry <= SESSION_CONFIG.WARNING_BEFORE_EXPIRY &&
      !this.warningShown
    ) {
      this.showExpiryWarning(timeUntilExpiry);
      this.warningShown = true;
    }
  }

  /**
   * Rafraîchit la session Supabase
   */
  private async refreshSession() {
    try {
      const supabase = createClient();

      // Vérifier d'abord si une session existe
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        // Pas de session active, ne pas tenter de refresh
        logger.warn('Pas de session active, skip refresh', {
          operation: 'session_refresh_skipped',
        });
        return;
      }

      const { error } = await supabase.auth.refreshSession();

      if (error) {
        logger.error('Erreur refresh session', error as Error, {
          operation: 'session_refresh_failed',
        });
        // Ne pas déconnecter automatiquement en cas d'erreur refresh
        // L'utilisateur peut continuer à travailler avec sa session courante
        if (error.message.includes('refresh_token_not_found')) {
          logger.warn('Refresh token non trouvé - ARRÊT refresh automatique', {
            operation: 'refresh_token_missing',
          });

          // 🔥 CRITIQUE: Arrêter l'intervalle de refresh pour éviter boucle infinie
          if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
            this.refreshInterval = undefined;
          }
        }
      }
    } catch (error) {
      logger.error('Erreur refresh session', error as Error, {
        operation: 'session_refresh_exception',
      });
    }
  }

  /**
   * Affiche un warning avant expiration
   */
  private showExpiryWarning(timeRemaining: number) {
    const minutes = Math.floor(timeRemaining / 60000);

    // Créer notification
    const notification = document.createElement('div');
    notification.id = 'session-warning';
    notification.className =
      'fixed bottom-4 right-4 bg-black text-white p-4 rounded-lg shadow-lg z-50 max-w-sm';
    notification.innerHTML = `
      <div class="flex items-start space-x-3">
        <svg class="w-6 h-6 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <div>
          <p class="font-semibold">Session bientôt expirée</p>
          <p class="text-sm mt-1">
            Votre session expirera dans ${minutes} minute${minutes > 1 ? 's' : ''}.
            Cliquez pour prolonger.
          </p>
          <button
            onclick="window.sessionManager?.extendSession()"
            class="mt-2 px-3 py-1 bg-white text-white rounded text-sm font-semibold hover:bg-gray-100"
          >
            Prolonger la session
          </button>
        </div>
      </div>
    `;

    // Supprimer ancienne notification si existe
    const existing = document.getElementById('session-warning');
    if (existing) {
      existing.remove();
    }

    document.body.appendChild(notification);

    // Auto-remove après 30 secondes
    setTimeout(() => {
      notification.remove();
    }, 30000);
  }

  /**
   * Gère l'expiration de session
   */
  private async handleSessionExpiry(reason: string) {
    this.cleanup();

    // Log l'expiration (audit sécurité)
    logger.security('Session expirée', {
      reason,
      operation: 'session_expired',
    });

    // Déconnexion Supabase
    const supabase = createClient();
    await supabase.auth.signOut();

    // Notification
    const notification = document.createElement('div');
    notification.className =
      'fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50';
    notification.innerHTML = `
      <div class="bg-white p-6 rounded-lg max-w-md">
        <h2 class="text-xl font-bold text-red-600 mb-3">Session Expirée</h2>
        <p class="text-gray-700 mb-4">${reason}</p>
        <p class="text-sm text-gray-600 mb-4">
          Pour votre sécurité, vous avez été déconnecté.
          Veuillez vous reconnecter pour continuer.
        </p>
        <button
          onclick="window.location.href='/login'"
          class="w-full px-4 py-2 bg-black text-white rounded hover:bg-gray-800"
        >
          Se reconnecter
        </button>
      </div>
    `;

    document.body.appendChild(notification);

    // Redirection après 5 secondes
    setTimeout(() => {
      window.location.href = '/login';
    }, 5000);
  }

  /**
   * Prolonge la session
   */
  public extendSession() {
    this.updateActivity();
    this.refreshSession();

    // Supprimer warning
    const warning = document.getElementById('session-warning');
    if (warning) {
      warning.remove();
    }

    // Notification de succès
    this.showNotification('Session prolongée avec succès', 'success');
  }

  /**
   * Affiche une notification
   */
  private showNotification(
    message: string,
    type: 'success' | 'error' | 'warning'
  ) {
    const colors = {
      success: 'bg-green-500',
      error: 'bg-red-500',
      warning: 'bg-black',
    };

    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 ${colors[type]} text-white px-6 py-3 rounded-lg shadow-lg z-50 transition-opacity`;
    notification.textContent = message;

    document.body.appendChild(notification);

    setTimeout(() => {
      notification.style.opacity = '0';
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }

  /**
   * Nettoie les listeners et timers
   */
  public cleanup() {
    // Clear intervals
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }

    // Remove listeners
    this.activityListeners.forEach(remove => remove());
    this.activityListeners = [];
  }

  /**
   * Obtient le temps restant avant expiration
   */
  public getTimeUntilExpiry(): number {
    const idleTime = Date.now() - this.lastActivity;
    return Math.max(0, SESSION_CONFIG.IDLE_TIMEOUT - idleTime);
  }

  /**
   * Obtient le statut de la session
   */
  public getSessionStatus() {
    const now = Date.now();
    const idleTime = now - this.lastActivity;
    const sessionTime = now - this.sessionStart;
    const timeUntilExpiry = this.getTimeUntilExpiry();

    return {
      isActive: idleTime < SESSION_CONFIG.IDLE_TIMEOUT,
      idleTime,
      sessionTime,
      timeUntilExpiry,
      willExpireSoon: timeUntilExpiry <= SESSION_CONFIG.WARNING_BEFORE_EXPIRY,
    };
  }
}

// Instance globale (optionnel)
declare global {
  interface Window {
    sessionManager?: SessionManager;
  }
}

/**
 * Initialise le gestionnaire de session
 */
export function initializeSessionManager() {
  if (typeof window !== 'undefined' && !window.sessionManager) {
    window.sessionManager = new SessionManager();
  }
  return window.sessionManager;
}

/**
 * Hook React pour le gestionnaire de session
 */
export function useSessionManager() {
  const [sessionStatus, setSessionStatus] = React.useState(
    window.sessionManager?.getSessionStatus()
  );

  React.useEffect(() => {
    const manager = initializeSessionManager();

    const interval = setInterval(() => {
      setSessionStatus(manager?.getSessionStatus());
    }, 1000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  return {
    sessionStatus,
    extendSession: () => window.sessionManager?.extendSession(),
  };
}

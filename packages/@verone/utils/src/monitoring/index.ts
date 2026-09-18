/**
 * @verone/utils/monitoring
 *
 * `console-error-tracker` a ete supprime en [BO-OBS-001] (2026-09-18) : il
 * n'etait monte nulle part — il ne capturait donc rien — et son unique
 * destination, `POST /api/logs`, ecrivait des fichiers sur le disque ephemere
 * de Vercel, qui n'a jamais rien conserve. PostHog le remplace.
 *
 * Reste ici l'aide a la lecture des erreurs console via MCP Playwright.
 */

export { calculateErrorStats, isCriticalError } from './mcp-error-checker';
export type { ConsoleErrorLog } from './mcp-error-checker';

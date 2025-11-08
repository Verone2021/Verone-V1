/**
 * @verone/utils/monitoring
 * Monitoring and error tracking utilities
 */

export * from './console-error-tracker';
// mcp-error-checker uses same ConsoleErrorLog interface, only export functions
export { calculateErrorStats, isCriticalError } from './mcp-error-checker';

import type { BankBalanceData } from './use-treasury-stats.types';

export const CACHE_DURATION_MS = 5 * 60 * 1000; // 5 minutes

interface QontoCacheEntry {
  data: BankBalanceData;
  timestamp: number;
}

let qontoBalanceCache: QontoCacheEntry | null = null;

function isCacheValid(): boolean {
  if (!qontoBalanceCache) return false;
  return Date.now() - qontoBalanceCache.timestamp < CACHE_DURATION_MS;
}

export function getCachedBalance(): BankBalanceData | null {
  if (isCacheValid()) {
    return qontoBalanceCache!.data;
  }
  return null;
}

export function setCachedBalance(data: BankBalanceData): void {
  qontoBalanceCache = {
    data,
    timestamp: Date.now(),
  };
}

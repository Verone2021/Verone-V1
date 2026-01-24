/**
 * Next.js Client Instrumentation - Browser-side Error Monitoring
 *
 * This file runs in the browser and captures client-side errors.
 * Errors are logged to console and can be sent to external services.
 *
 * @see https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 */

// Only run in browser
if (typeof window !== 'undefined') {
  // Global error handler for uncaught errors
  window.onerror = function (message, source, lineno, colno, error) {
    const errorData = {
      type: 'uncaughtError',
      message: String(message),
      source,
      lineno,
      colno,
      stack: error?.stack,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent,
    };

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('[Client Error]', errorData);
    }

    // Send to analytics/monitoring (non-blocking)
    sendErrorToMonitoring(errorData);

    // Don't prevent default error handling
    return false;
  };

  // Global promise rejection handler
  window.onunhandledrejection = function (event) {
    const reason = event.reason;
    const errorData = {
      type: 'unhandledRejection',
      message: reason instanceof Error ? reason.message : String(reason),
      stack: reason instanceof Error ? reason.stack : undefined,
      timestamp: new Date().toISOString(),
      url: window.location.href,
    };

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('[Unhandled Rejection]', errorData);
    }

    // Send to analytics/monitoring (non-blocking)
    sendErrorToMonitoring(errorData);
  };

  // Performance observer for Core Web Vitals
  if ('PerformanceObserver' in window) {
    try {
      // Observe Largest Contentful Paint (LCP)
      const lcpObserver = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        const lastEntry = entries[entries.length - 1];
        if (lastEntry && process.env.NODE_ENV === 'development') {
          console.log('[Web Vitals] LCP:', lastEntry.startTime.toFixed(2), 'ms');
        }
      });
      lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });

      // Observe First Input Delay (FID)
      const fidObserver = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        entries.forEach((entry) => {
          if (process.env.NODE_ENV === 'development') {
            console.log('[Web Vitals] FID:', (entry as PerformanceEventTiming).processingStart - entry.startTime, 'ms');
          }
        });
      });
      fidObserver.observe({ type: 'first-input', buffered: true });

      // Observe Cumulative Layout Shift (CLS)
      let clsValue = 0;
      const clsObserver = new PerformanceObserver((entryList) => {
        for (const entry of entryList.getEntries()) {
          if (!(entry as LayoutShift).hadRecentInput) {
            clsValue += (entry as LayoutShift).value;
          }
        }
        if (process.env.NODE_ENV === 'development') {
          console.log('[Web Vitals] CLS:', clsValue.toFixed(4));
        }
      });
      clsObserver.observe({ type: 'layout-shift', buffered: true });
    } catch {
      // PerformanceObserver not supported for these entry types
    }
  }
}

/**
 * Send error data to monitoring service
 * Uses sendBeacon for reliable delivery even on page unload
 */
function sendErrorToMonitoring(errorData: Record<string, unknown>) {
  // In production, send to API endpoint
  if (process.env.NODE_ENV === 'production') {
    try {
      // Use sendBeacon for reliability (works even during page unload)
      const blob = new Blob([JSON.stringify(errorData)], {
        type: 'application/json',
      });
      navigator.sendBeacon('/api/logs', blob);
    } catch {
      // Fallback to fetch if sendBeacon fails
      fetch('/api/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(errorData),
        keepalive: true,
      }).catch(() => {
        // Silent fail - don't create error loops
      });
    }
  }
}

// Type declarations for Web Vitals
interface LayoutShift extends PerformanceEntry {
  value: number;
  hadRecentInput: boolean;
}

interface PerformanceEventTiming extends PerformanceEntry {
  processingStart: number;
}

export {};

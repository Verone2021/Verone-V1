/**
 * API Route: /api/csp-report
 *
 * Receives Content Security Policy violation reports
 * These reports help identify CSP issues and potential XSS attempts
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy/report-uri
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

/**
 * CSP Violation Report structure
 * @see https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP#violation_report_syntax
 */
interface CSPReport {
  'csp-report': {
    /** The URI of the document in which the violation occurred */
    'document-uri': string;
    /** The referrer of the document */
    referrer: string;
    /** The URI of the resource that was blocked */
    'blocked-uri': string;
    /** The directive that was violated */
    'violated-directive': string;
    /** The original policy as sent in the CSP header */
    'original-policy': string;
    /** The effective directive that was violated */
    'effective-directive': string;
    /** The disposition of the report (enforce or report) */
    disposition?: 'enforce' | 'report';
    /** Status code of the resource */
    'status-code'?: number;
    /** Script sample (if inline script violation) */
    'script-sample'?: string;
    /** Line number where violation occurred */
    'line-number'?: number;
    /** Column number where violation occurred */
    'column-number'?: number;
    /** Source file of the violation */
    'source-file'?: string;
  };
}

/**
 * Known false positives to filter out
 */
const IGNORED_VIOLATIONS = [
  // Browser extensions
  'chrome-extension://',
  'moz-extension://',
  'safari-extension://',
  // Dev tools
  'webpack://',
  'react-devtools',
  // Common analytics/tracking false positives in strict mode
  'inline',
];

/**
 * Check if a violation should be ignored
 */
function shouldIgnoreViolation(report: CSPReport['csp-report']): boolean {
  const blockedUri = report['blocked-uri'] || '';
  const sourceFile = report['source-file'] || '';

  return IGNORED_VIOLATIONS.some(
    pattern => blockedUri.includes(pattern) || sourceFile.includes(pattern)
  );
}

/**
 * POST /api/csp-report
 *
 * Receives CSP violation reports from browsers
 * Content-Type: application/csp-report or application/json
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Parse the CSP report
    const contentType = request.headers.get('content-type') || '';
    let report: CSPReport;

    if (contentType.includes('application/csp-report')) {
      report = await request.json();
    } else if (contentType.includes('application/json')) {
      report = await request.json();
    } else {
      // Accept raw body for some browsers
      const text = await request.text();
      try {
        report = JSON.parse(text);
      } catch {
        return NextResponse.json(
          { error: 'Invalid report format' },
          { status: 400 }
        );
      }
    }

    // Validate report structure
    if (!report['csp-report']) {
      return NextResponse.json(
        { error: 'Invalid CSP report structure' },
        { status: 400 }
      );
    }

    const cspReport = report['csp-report'];

    // Filter out known false positives
    if (shouldIgnoreViolation(cspReport)) {
      return NextResponse.json({ status: 'ignored' });
    }

    // Log the violation for monitoring
    // In production, this would be sent to a logging service (Axiom, Datadog, etc.)
    const logEntry = {
      type: 'csp-violation',
      timestamp: new Date().toISOString(),
      documentUri: cspReport['document-uri'],
      blockedUri: cspReport['blocked-uri'],
      violatedDirective: cspReport['violated-directive'],
      effectiveDirective: cspReport['effective-directive'],
      disposition: cspReport.disposition || 'enforce',
      sourceFile: cspReport['source-file'],
      lineNumber: cspReport['line-number'],
      referrer: cspReport.referrer,
    };

    // Log to console in development, or to monitoring service in production
    if (process.env.NODE_ENV === 'development') {
      console.warn('[CSP Violation]', JSON.stringify(logEntry, null, 2));
    } else {
      // TODO: Send to monitoring service (Axiom, Datadog, Sentry, etc.)
      // For now, just log to console with a structured format
      console.warn('[CSP Violation]', JSON.stringify(logEntry));
    }

    // Return 204 No Content (success, no body needed)
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('[CSP Report] Error processing report:', error);

    // Still return success to avoid browser retry storms
    return new NextResponse(null, { status: 204 });
  }
}

/**
 * GET /api/csp-report
 *
 * Health check for CSP reporting endpoint
 */
export async function GET(): Promise<NextResponse> {
  return NextResponse.json({
    status: 'ok',
    message: 'CSP reporting endpoint is active',
    timestamp: new Date().toISOString(),
  });
}

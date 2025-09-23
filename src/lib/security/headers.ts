/**
 * 🔒 Security Headers Configuration - Vérone Back Office
 *
 * Configuration des en-têtes de sécurité pour toute l'application
 */

const securityHeaders = {
  // Content Security Policy
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: [
        "'self'",
        "'unsafe-inline'", // Required for Next.js
        "'unsafe-eval'", // Required for Next.js development
        "https://aorroydfjsrygmosnzrl.supabase.co"
      ],
      styleSrc: [
        "'self'",
        "'unsafe-inline'", // Required for Tailwind CSS
        "https://fonts.googleapis.com"
      ],
      imgSrc: [
        "'self'",
        "data:",
        "blob:",
        "https://aorroydfjsrygmosnzrl.supabase.co",
        "https://*.supabase.co"
      ],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      connectSrc: [
        "'self'",
        "https://aorroydfjsrygmosnzrl.supabase.co",
        "wss://aorroydfjsrygmosnzrl.supabase.co"
      ],
      mediaSrc: ["'self'", "https://aorroydfjsrygmosnzrl.supabase.co"],
      objectSrc: ["'none'"],
      frameSrc: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
      frameAncestors: ["'none'"],
      upgradeInsecureRequests: []
    }
  },

  // Other security headers
  headers: [
    {
      key: 'X-DNS-Prefetch-Control',
      value: 'on'
    },
    {
      key: 'Strict-Transport-Security',
      value: 'max-age=63072000; includeSubDomains; preload'
    },
    {
      key: 'X-XSS-Protection',
      value: '1; mode=block'
    },
    {
      key: 'X-Frame-Options',
      value: 'SAMEORIGIN'
    },
    {
      key: 'X-Content-Type-Options',
      value: 'nosniff'
    },
    {
      key: 'Referrer-Policy',
      value: 'strict-origin-when-cross-origin'
    },
    {
      key: 'Permissions-Policy',
      value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), magnetometer=(), gyroscope=(), accelerometer=()'
    }
  ]
}

/**
 * Generate CSP header string
 */
function generateCSP() {
  const { directives } = securityHeaders.contentSecurityPolicy

  return Object.entries(directives)
    .map(([key, values]) => {
      const directive = key.replace(/([A-Z])/g, '-$1').toLowerCase()

      if (Array.isArray(values) && values.length === 0) {
        return directive
      }

      const valueString = Array.isArray(values) ? values.join(' ') : values
      return `${directive} ${valueString}`
    })
    .join('; ')
}

/**
 * Apply security headers to Next.js config
 */
function getSecurityHeaders() {
  const csp = generateCSP()

  return [
    {
      key: 'Content-Security-Policy',
      value: csp.replace(/\n/g, '')
    },
    ...securityHeaders.headers
  ]
}

// Export for CommonJS (next.config.js)
module.exports = {
  getSecurityHeaders
}
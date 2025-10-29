/**
 * 🔒 API Security Middleware - Vérone Back Office
 *
 * Middleware de sécurité pour les API routes
 * - Authentication
 * - Rate limiting
 * - CORS configuration
 * - Input validation
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { logger } from '@/lib/logger'

// Configuration CORS sécurisée
const ALLOWED_ORIGINS = [
  process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  'https://verone.fr',
  'https://www.verone.fr'
].filter(Boolean)

// Rate limiting store (in production, use Redis)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

// Rate limit configuration
const RATE_LIMIT = {
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 60 // 60 requests per minute
}

/**
 * Vérification de l'authentification
 */
export async function verifyAuth(request: NextRequest) {
  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value
          },
          set() {},
          remove() {}
        }
      }
    )

    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
      return { authenticated: false, user: null }
    }

    return { authenticated: true, user }
  } catch (error) {
    logger.error('Auth verification failed:', error as any)
    return { authenticated: false, user: null }
  }
}

/**
 * Rate limiting
 */
export function checkRateLimit(identifier: string): boolean {
  const now = Date.now()
  const record = rateLimitStore.get(identifier)

  if (!record || now > record.resetTime) {
    rateLimitStore.set(identifier, {
      count: 1,
      resetTime: now + RATE_LIMIT.windowMs
    })
    return true
  }

  if (record.count >= RATE_LIMIT.maxRequests) {
    return false
  }

  record.count++
  return true
}

/**
 * Nettoyer les vieilles entrées du rate limiter
 */
function cleanupRateLimiter() {
  const now = Date.now()
  for (const [key, value] of rateLimitStore.entries()) {
    if (now > value.resetTime) {
      rateLimitStore.delete(key)
    }
  }
}

// Cleanup every 5 minutes
setInterval(cleanupRateLimiter, 5 * 60 * 1000)

/**
 * Middleware de sécurité principal
 */
export async function withApiSecurity(
  request: NextRequest,
  handler: (req: NextRequest) => Promise<NextResponse>,
  options?: {
    requireAuth?: boolean
    rateLimit?: boolean
    allowedMethods?: string[]
  }
) {
  const {
    requireAuth = true,
    rateLimit = true,
    allowedMethods = ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
  } = options || {}

  // Check method
  if (!allowedMethods.includes(request.method)) {
    return new NextResponse(null, {
      status: 405,
      headers: {
        'Allow': allowedMethods.join(', ')
      }
    })
  }

  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    return handleCors(request)
  }

  // Check authentication
  if (requireAuth) {
    const { authenticated, user } = await verifyAuth(request)

    if (!authenticated) {
      return new NextResponse(
        JSON.stringify({ error: 'Unauthorized' }),
        {
          status: 401,
          headers: {
            'Content-Type': 'application/json',
            'WWW-Authenticate': 'Bearer'
          }
        }
      )
    }

    // Add user to request for downstream use
    (request as any).user = user
  }

  // Check rate limit
  if (rateLimit) {
    const identifier = (request as any).ip || request.headers.get('x-forwarded-for') || 'unknown'

    if (!checkRateLimit(identifier)) {
      return new NextResponse(
        JSON.stringify({ error: 'Too Many Requests' }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'X-RateLimit-Limit': RATE_LIMIT.maxRequests.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': new Date(Date.now() + RATE_LIMIT.windowMs).toISOString()
          }
        }
      )
    }
  }

  // Process request
  try {
    const response = await handler(request)

    // Add security headers
    addSecurityHeaders(response.headers, request)

    return response
  } catch (error) {
    logger.error('API handler error:', error as any)

    return new NextResponse(
      JSON.stringify({ error: 'Internal Server Error' }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    )
  }
}

/**
 * Handle CORS
 */
export function handleCors(request: NextRequest): NextResponse {
  const origin = request.headers.get('origin')

  // Check if origin is allowed
  const isAllowed = !origin || ALLOWED_ORIGINS.includes(origin)

  if (!isAllowed) {
    return new NextResponse(null, { status: 403 })
  }

  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': origin || ALLOWED_ORIGINS[0],
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Max-Age': '86400'
    }
  })
}

/**
 * Add security headers to response
 */
export function addSecurityHeaders(headers: Headers, request: NextRequest) {
  const origin = request.headers.get('origin')

  // CORS headers (only for allowed origins)
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    headers.set('Access-Control-Allow-Origin', origin)
    headers.set('Access-Control-Allow-Credentials', 'true')
  }

  // Security headers
  headers.set('X-Content-Type-Options', 'nosniff')
  headers.set('X-Frame-Options', 'DENY')
  headers.set('X-XSS-Protection', '1; mode=block')
  headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')

  // CSP for API responses (JSON only)
  headers.set(
    'Content-Security-Policy',
    "default-src 'none'; frame-ancestors 'none';"
  )
}

/**
 * Input validation helpers
 */
export function validateInput<T>(
  input: unknown,
  schema: {
    [K in keyof T]: {
      type: 'string' | 'number' | 'boolean' | 'array' | 'object'
      required?: boolean
      min?: number
      max?: number
      pattern?: RegExp
      validator?: (value: any) => boolean
    }
  }
): { valid: boolean; data?: T; errors?: string[] } {
  const errors: string[] = []
  const data = {} as T

  for (const [key, rules] of Object.entries(schema) as Array<[keyof T, any]>) {
    const value = (input as any)?.[key]

    // Check required
    if (rules.required && (value === undefined || value === null || value === '')) {
      errors.push(`${String(key)} is required`)
      continue
    }

    // Skip if not required and not provided
    if (!rules.required && (value === undefined || value === null)) {
      continue
    }

    // Type check
    const actualType = Array.isArray(value) ? 'array' : typeof value
    if (actualType !== rules.type) {
      errors.push(`${String(key)} must be of type ${rules.type}`)
      continue
    }

    // Additional validations
    if (rules.type === 'string') {
      if (rules.min && value.length < rules.min) {
        errors.push(`${String(key)} must be at least ${rules.min} characters`)
      }
      if (rules.max && value.length > rules.max) {
        errors.push(`${String(key)} must be at most ${rules.max} characters`)
      }
      if (rules.pattern && !rules.pattern.test(value)) {
        errors.push(`${String(key)} has invalid format`)
      }
    }

    if (rules.type === 'number') {
      if (rules.min && value < rules.min) {
        errors.push(`${String(key)} must be at least ${rules.min}`)
      }
      if (rules.max && value > rules.max) {
        errors.push(`${String(key)} must be at most ${rules.max}`)
      }
    }

    // Custom validator
    if (rules.validator && !rules.validator(value)) {
      errors.push(`${String(key)} is invalid`)
      continue
    }

    data[key] = value
  }

  return errors.length > 0
    ? { valid: false, errors }
    : { valid: true, data }
}

/**
 * Sanitize string input
 */
export function sanitizeString(input: string): string {
  return input
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+\s*=/gi, '') // Remove event handlers
    .trim()
}
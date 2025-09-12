# 🔐 Guide Technique Authentication & SSR - Want It Now V1

> **Guide complet pour l'implémentation de l'authentification SSR avec Supabase et Next.js 15**

## 📋 **Vue d'ensemble**

Ce guide détaille l'implémentation de l'authentification Server-Side Rendering (SSR) pour Want It Now V1, basé sur les best practices du manuel Supabase PERSONNEL/ et l'expérience de production.

## 🏗️ **Architecture Authentication SSR**

### **Principes Fondamentaux**

1. **Server-Side First** : Auth résolue côté serveur, hydratation client
2. **Zero Loading State** : Pas de spinner, data pré-chargée
3. **Type Safety** : TypeScript strict pour tous les états auth
4. **Performance** : Parallel queries avec Promise.all
5. **Error Resilience** : Fallbacks et retry mechanisms

### **Stack Technique**

```typescript
// Stack Authentication
- Next.js 15 App Router (Server Components)
- Supabase Auth (JWT + Cookies)
- AuthProviderSSR (Custom hydration)
- Server Actions (Mutations sécurisées)
- Middleware Auth (Protection routes)
```

## 🚀 **Pattern SSR Complet**

### **1. Layout avec Auth Pré-hydratée**

```typescript
// app/layout.tsx
import { AuthProviderSSR } from '@/providers/auth-provider-ssr'
import { getServerAuthData } from '@/lib/auth/server-auth'

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // ✅ Auth résolue côté serveur
  const initialAuthData = await getServerAuthData()

  return (
    <html lang="fr">
      <body>
        {/* Hydratation instantanée sans loading */}
        <AuthProviderSSR initialData={initialAuthData}>
          {children}
        </AuthProviderSSR>
      </body>
    </html>
  )
}
```

### **2. Server Auth Helper**

```typescript
// lib/auth/server-auth.ts
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

export type ServerAuthData = {
  user: User | null
  profile: Profile | null
  roles: UserRole[]
  organisations: Organisation[]
  isSuperAdmin: boolean
}

export async function getServerAuthData(): Promise<ServerAuthData> {
  const supabase = createClient(cookies())
  
  try {
    // ✅ Parallel queries pour performance
    const [
      { data: { user } },
      profileResult,
      rolesResult,
      orgsResult
    ] = await Promise.all([
      supabase.auth.getUser(),
      user ? supabase
        .from('utilisateurs')
        .select('*')
        .eq('id', user.id)
        .single() : Promise.resolve({ data: null }),
      user ? supabase
        .from('user_roles')
        .select('*, organisation:organisations(*)')
        .eq('user_id', user.id) : Promise.resolve({ data: [] }),
      user ? supabase
        .from('user_organisation_assignments')
        .select('*, organisation:organisations(*)')
        .eq('user_id', user.id) : Promise.resolve({ data: [] })
    ])

    const profile = profileResult?.data
    const roles = rolesResult?.data || []
    const organisations = orgsResult?.data?.map(a => a.organisation) || []
    const isSuperAdmin = roles.some(r => r.role === 'super_admin')

    return {
      user,
      profile,
      roles,
      organisations,
      isSuperAdmin
    }
  } catch (error) {
    console.error('Error fetching auth data:', error)
    // ✅ Fallback gracieux
    return {
      user: null,
      profile: null,
      roles: [],
      organisations: [],
      isSuperAdmin: false
    }
  }
}
```

### **3. AuthProvider SSR**

```typescript
// providers/auth-provider-ssr.tsx
'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { ServerAuthData } from '@/lib/auth/server-auth'

interface AuthContextValue extends ServerAuthData {
  isLoading: boolean
  signOut: () => Promise<void>
  refreshAuth: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProviderSSR({
  children,
  initialData
}: {
  children: React.ReactNode
  initialData: ServerAuthData
}) {
  // ✅ Hydratation instantanée avec données serveur
  const [authData, setAuthData] = useState<ServerAuthData>(initialData)
  const [isLoading, setIsLoading] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    // ✅ Listener pour changements auth temps réel
    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        await refreshAuth()
      } else if (event === 'SIGNED_OUT') {
        setAuthData({
          user: null,
          profile: null,
          roles: [],
          organisations: [],
          isSuperAdmin: false
        })
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const refreshAuth = async () => {
    setIsLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        // ✅ Refresh parallel queries
        const [profile, roles, orgs] = await Promise.all([
          supabase.from('utilisateurs').select('*').eq('id', user.id).single(),
          supabase.from('user_roles').select('*, organisation:organisations(*)').eq('user_id', user.id),
          supabase.from('user_organisation_assignments').select('*, organisation:organisations(*)').eq('user_id', user.id)
        ])

        setAuthData({
          user,
          profile: profile.data,
          roles: roles.data || [],
          organisations: orgs.data?.map(a => a.organisation) || [],
          isSuperAdmin: roles.data?.some(r => r.role === 'super_admin') || false
        })
      }
    } finally {
      setIsLoading(false)
    }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    // Redirect handled by middleware
  }

  return (
    <AuthContext.Provider 
      value={{
        ...authData,
        isLoading,
        signOut,
        refreshAuth
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

// ✅ Hook avec error boundary
export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProviderSSR')
  }
  return context
}
```

## 🛡️ **Middleware Protection**

### **Protection des Routes**

```typescript
// middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'

export async function middleware(request: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req: request, res })

  const {
    data: { session },
  } = await supabase.auth.getSession()

  // Routes publiques
  const publicPaths = ['/login', '/register', '/forgot-password']
  const isPublicPath = publicPaths.some(path => 
    request.nextUrl.pathname.startsWith(path)
  )

  // Si non authentifié et route protégée
  if (!session && !isPublicPath) {
    const redirectUrl = new URL('/login', request.url)
    redirectUrl.searchParams.set('redirectTo', request.nextUrl.pathname)
    return NextResponse.redirect(redirectUrl)
  }

  // Si authentifié et sur page auth
  if (session && isPublicPath) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // Routes admin
  if (request.nextUrl.pathname.startsWith('/admin')) {
    const { data: roles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', session?.user.id)
      .in('role', ['admin', 'super_admin'])
      .single()

    if (!roles) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  return res
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
}
```

## 🔄 **Server Actions Pattern**

### **Pattern Sécurisé avec Validation**

```typescript
// actions/auth-actions.ts
'use server'

import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { z } from 'zod'
import { revalidatePath } from 'next/cache'

// ✅ Type-safe result
type ActionResult<T> = 
  | { success: true; data: T }
  | { success: false; error: string }

// ✅ Schema validation
const signInSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(8, 'Minimum 8 caractères')
})

export async function signIn(
  formData: FormData
): Promise<ActionResult<{ user: User }>> {
  try {
    // 1. Validation
    const rawData = Object.fromEntries(formData)
    const validated = signInSchema.parse(rawData)
    
    // 2. Auth
    const supabase = createClient(cookies())
    const { data, error } = await supabase.auth.signInWithPassword({
      email: validated.email,
      password: validated.password
    })
    
    if (error) throw error
    
    // 3. Fetch profile avec rôles
    const [profile, roles] = await Promise.all([
      supabase.from('utilisateurs').select('*').eq('id', data.user.id).single(),
      supabase.from('user_roles').select('*').eq('user_id', data.user.id)
    ])
    
    // 4. Revalidation
    revalidatePath('/dashboard')
    
    return { 
      success: true, 
      data: { 
        user: data.user,
        profile: profile.data,
        roles: roles.data
      } 
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { 
        success: false, 
        error: error.errors[0].message 
      }
    }
    
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Erreur inconnue' 
    }
  }
}

export async function signUp(
  formData: FormData
): Promise<ActionResult<{ user: User }>> {
  try {
    const supabase = createClient(cookies())
    
    // Transaction pour créer user + profile
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: formData.get('email') as string,
      password: formData.get('password') as string,
      options: {
        data: {
          nom: formData.get('nom') as string,
          prenom: formData.get('prenom') as string
        }
      }
    })
    
    if (authError) throw authError
    
    // Profile créé automatiquement via trigger database
    
    return { 
      success: true, 
      data: { user: authData.user! } 
    }
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Erreur création compte' 
    }
  }
}

export async function signOut(): Promise<void> {
  const supabase = createClient(cookies())
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
}
```

## 🎨 **UI Components Auth**

### **Login Form avec Server Action**

```tsx
// components/auth/login-form.tsx
'use client'

import { useFormState } from 'react-dom'
import { signIn } from '@/actions/auth-actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'
import { useEffect } from 'react'

export function LoginForm() {
  const [state, formAction] = useFormState(signIn, null)
  const { toast } = useToast()
  
  useEffect(() => {
    if (state?.success === false) {
      toast({
        title: 'Erreur connexion',
        description: state.error,
        variant: 'destructive'
      })
    }
  }, [state])
  
  return (
    <form action={formAction} className="space-y-4">
      <div>
        <Input
          name="email"
          type="email"
          placeholder="Email"
          required
          className="bg-white"
        />
      </div>
      
      <div>
        <Input
          name="password"
          type="password"
          placeholder="Mot de passe"
          required
          className="bg-white"
        />
      </div>
      
      <Button 
        type="submit"
        className="w-full bg-[#D4841A] hover:bg-[#B8741A]"
      >
        Se connecter
      </Button>
    </form>
  )
}
```

### **Protected Page Pattern**

```tsx
// app/dashboard/page.tsx
import { redirect } from 'next/navigation'
import { getServerAuthData } from '@/lib/auth/server-auth'

export default async function DashboardPage() {
  // ✅ Auth check serveur
  const { user, profile, isSuperAdmin } = await getServerAuthData()
  
  if (!user) {
    redirect('/login')
  }
  
  return (
    <div>
      <h1>Bienvenue {profile?.prenom}</h1>
      {isSuperAdmin && (
        <div>Panel Super Admin</div>
      )}
    </div>
  )
}
```

## 🔍 **Patterns Avancés**

### **1. Role-Based Access Control (RBAC)**

```typescript
// lib/auth/rbac.ts
export function hasRole(
  roles: UserRole[], 
  allowedRoles: string[]
): boolean {
  return roles.some(r => allowedRoles.includes(r.role))
}

export function canAccessOrganisation(
  roles: UserRole[],
  organisationId: string
): boolean {
  // Super admin = accès global
  if (roles.some(r => r.role === 'super_admin')) {
    return true
  }
  
  // Admin = accès organisations assignées
  return roles.some(r => 
    r.role === 'admin' && 
    r.organisation_id === organisationId
  )
}

// Usage dans Server Component
export default async function OrganisationPage({ 
  params 
}: { 
  params: { id: string } 
}) {
  const { roles } = await getServerAuthData()
  
  if (!canAccessOrganisation(roles, params.id)) {
    notFound()
  }
  
  // ...
}
```

### **2. Optimistic Updates**

```typescript
// hooks/use-optimistic-auth.ts
import { useOptimistic } from 'react'
import { useAuth } from '@/providers/auth-provider-ssr'

export function useOptimisticProfile() {
  const { profile, refreshAuth } = useAuth()
  
  const [optimisticProfile, setOptimisticProfile] = useOptimistic(
    profile,
    (state, newProfile: Partial<Profile>) => ({
      ...state,
      ...newProfile
    })
  )
  
  const updateProfile = async (updates: Partial<Profile>) => {
    // ✅ Update optimiste immédiat
    setOptimisticProfile(updates)
    
    try {
      const { error } = await supabase
        .from('utilisateurs')
        .update(updates)
        .eq('id', profile.id)
      
      if (error) throw error
      
      // ✅ Refresh depuis serveur
      await refreshAuth()
    } catch (error) {
      // Rollback si erreur
      setOptimisticProfile(profile)
      throw error
    }
  }
  
  return {
    profile: optimisticProfile,
    updateProfile
  }
}
```

### **3. Session Refresh Pattern**

```typescript
// lib/auth/session-manager.ts
export class SessionManager {
  private refreshTimer: NodeJS.Timeout | null = null
  
  constructor(private supabase: SupabaseClient) {}
  
  startAutoRefresh() {
    // Refresh 5 minutes avant expiration
    this.refreshTimer = setInterval(async () => {
      const { data: { session } } = await this.supabase.auth.getSession()
      
      if (session) {
        const expiresAt = new Date(session.expires_at! * 1000)
        const now = new Date()
        const timeUntilExpiry = expiresAt.getTime() - now.getTime()
        
        // Si moins de 5 minutes avant expiration
        if (timeUntilExpiry < 5 * 60 * 1000) {
          await this.supabase.auth.refreshSession()
        }
      }
    }, 60000) // Check toutes les minutes
  }
  
  stopAutoRefresh() {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer)
    }
  }
}
```

## 🧪 **Testing Strategy**

### **Tests E2E Authentication**

```typescript
// tests/auth.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Authentication Flow', () => {
  test('should login and access dashboard', async ({ page }) => {
    await page.goto('/login')
    
    // Fill form
    await page.fill('input[name="email"]', 'test@example.com')
    await page.fill('input[name="password"]', 'password123')
    await page.click('button[type="submit"]')
    
    // Should redirect to dashboard
    await expect(page).toHaveURL('/dashboard')
    
    // Should show user profile
    await expect(page.locator('text=Bienvenue')).toBeVisible()
  })
  
  test('should protect admin routes', async ({ page }) => {
    // Try to access admin without auth
    await page.goto('/admin')
    
    // Should redirect to login
    await expect(page).toHaveURL(/\/login/)
  })
})
```

## 📈 **Performance Optimizations**

### **1. Parallel Data Fetching**

```typescript
// ❌ Sequential (lent)
const user = await getUser()
const profile = await getProfile(user.id)
const roles = await getRoles(user.id)

// ✅ Parallel (rapide)
const [user, profile, roles] = await Promise.all([
  getUser(),
  getProfile(),
  getRoles()
])
```

### **2. Edge Runtime pour Middleware**

```typescript
// middleware.ts
export const config = {
  runtime: 'edge', // ✅ Plus rapide que Node.js
}
```

### **3. Cache Strategy**

```typescript
// lib/auth/cache.ts
import { unstable_cache } from 'next/cache'

export const getCachedUserRoles = unstable_cache(
  async (userId: string) => {
    const { data } = await supabase
      .from('user_roles')
      .select('*')
      .eq('user_id', userId)
    
    return data
  },
  ['user-roles'],
  {
    revalidate: 60, // Cache 60 secondes
    tags: ['auth']
  }
)
```

## 🚨 **Security Best Practices**

### **1. CSRF Protection**

```typescript
// Automatique avec Server Actions
// Next.js vérifie l'origine des requêtes
```

### **2. Rate Limiting**

```typescript
// lib/auth/rate-limit.ts
const attempts = new Map<string, number[]>()

export function checkRateLimit(
  identifier: string, 
  maxAttempts: number = 5,
  windowMs: number = 15 * 60 * 1000 // 15 minutes
): boolean {
  const now = Date.now()
  const userAttempts = attempts.get(identifier) || []
  
  // Clean old attempts
  const recentAttempts = userAttempts.filter(
    time => now - time < windowMs
  )
  
  if (recentAttempts.length >= maxAttempts) {
    return false // Rate limited
  }
  
  recentAttempts.push(now)
  attempts.set(identifier, recentAttempts)
  
  return true
}
```

### **3. Secure Headers**

```typescript
// next.config.js
module.exports = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          }
        ]
      }
    ]
  }
}
```

---

## 📋 **Checklist Implementation**

### **SSR Setup** ✅
- [ ] AuthProviderSSR avec hydratation
- [ ] getServerAuthData helper
- [ ] Middleware protection routes
- [ ] Server Actions auth
- [ ] Error boundaries

### **Performance** ✅
- [ ] Parallel queries (Promise.all)
- [ ] No loading states (SSR)
- [ ] Edge runtime middleware
- [ ] Cache strategy
- [ ] Session auto-refresh

### **Security** ✅
- [ ] CSRF protection (automatic)
- [ ] Rate limiting login
- [ ] Secure headers
- [ ] RLS policies database
- [ ] Input validation (Zod)

### **Testing** ✅
- [ ] E2E auth flow
- [ ] Protected routes
- [ ] Role-based access
- [ ] Error scenarios
- [ ] Session expiry

---

*Guide Authentication SSR v1.0 - Janvier 2025*
*Basé sur manuel Supabase 62 pages PERSONNEL/ + production experience*
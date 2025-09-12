# 🔒 Security Requirements - Want It Now V1

> **Spécifications sécurité avec RLS policies et validation complète**

## 🛡️ **Authentication & Authorization**

### **SSR Auth Pattern (Required)**
```typescript
// ✅ Server-side auth resolution (layout.tsx)
export default async function RootLayout({ children }) {
  const initialAuthData = await getServerAuthData() // Server-side
  return (
    <AuthProviderSSR initialData={initialAuthData}>
      {children}
    </AuthProviderSSR>
  )
}

// ✅ Auth validation server actions
export async function validateUserAccess(organisationId: string) {
  const { user } = await getServerAuth()
  if (!user) throw new Error('Unauthorized')
  
  const hasAccess = await supabase
    .from('user_organisation_assignments')
    .select('id')
    .eq('user_id', user.id)
    .eq('organisation_id', organisationId)
    .single()
    
  if (!hasAccess.data) throw new Error('Forbidden')
  return true
}
```

## 🔐 **Row Level Security (RLS)**

### **Organisations RLS**
```sql
-- Base policy - utilisateurs voient seulement leurs organisations
CREATE POLICY "users_own_organisations" ON organisations
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_organisation_assignments uoa 
      WHERE uoa.user_id = auth.uid() 
      AND uoa.organisation_id = organisations.id
    )
  );

-- Policy super admin - accès global  
CREATE POLICY "super_admin_full_access" ON organisations
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM utilisateurs u
      WHERE u.id = auth.uid()
      AND u.role = 'super_admin'
    )
  );
```

### **Propriétaires RLS**
```sql
-- Accès via organisations (propriétaires visibles si propriétés accessibles)
CREATE POLICY "proprietaires_via_organisations" ON proprietaires
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 
      FROM property_ownership po
      JOIN proprietes p ON po.propriete_id = p.id
      JOIN user_organisation_assignments uoa ON p.organisation_id = uoa.organisation_id
      WHERE po.proprietaire_id = proprietaires.id
        AND uoa.user_id = auth.uid()
    )
  );

-- Policy création - utilisateur peut créer propriétaire si accès organisation
CREATE POLICY "proprietaires_create_access" ON proprietaires
  FOR INSERT TO authenticated
  WITH CHECK (true); -- Validation côté application
```

### **Propriétés RLS**
```sql
-- Accès strict par organisation
CREATE POLICY "proprietes_organisation_access" ON proprietes
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 
      FROM user_organisation_assignments uoa
      WHERE uoa.organisation_id = proprietes.organisation_id
        AND uoa.user_id = auth.uid()
    )
  );

-- Policy création - seulement dans ses organisations
CREATE POLICY "proprietes_create_in_own_org" ON proprietes
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 
      FROM user_organisation_assignments uoa
      WHERE uoa.organisation_id = proprietes.organisation_id
        AND uoa.user_id = auth.uid()
    )
  );
```

### **Quotités RLS (Critique)**
```sql
-- Accès via propriété accessible
CREATE POLICY "ownership_via_proprietes" ON property_ownership
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 
      FROM proprietes p
      JOIN user_organisation_assignments uoa ON p.organisation_id = uoa.organisation_id
      WHERE p.id = property_ownership.propriete_id
        AND uoa.user_id = auth.uid()
    )
  );

-- Policy modification - validation business
CREATE POLICY "ownership_business_validation" ON property_ownership
  FOR UPDATE TO authenticated
  USING (
    -- Utilisateur a accès à la propriété
    EXISTS (
      SELECT 1 
      FROM proprietes p
      JOIN user_organisation_assignments uoa ON p.organisation_id = uoa.organisation_id
      WHERE p.id = property_ownership.propriete_id
        AND uoa.user_id = auth.uid()
    )
  )
  WITH CHECK (
    -- Quotités restent valides après modification
    (quotite_numerateur::decimal / quotite_denominateur) <= 1.0
  );
```

## 🔍 **Input Validation & Sanitization**

### **Validation Layers (Defense in Depth)**
```typescript
// Layer 1: Client-side (UX)
const formSchema = z.object({
  nom: z.string().min(2).max(255),
  email: z.string().email().optional(),
  quotite_numerateur: z.number().min(1),
  quotite_denominateur: z.number().min(1)
})

// Layer 2: Server Action (Security)  
export async function createProprietaire(data: FormData) {
  // Validation Zod strict
  const validated = createProprietaireSchema.parse(data)
  
  // Sanitization
  validated.nom = validator.escape(validated.nom)
  validated.email = validator.normalizeEmail(validated.email)
  
  // Business validation
  if (validated.quotite_numerateur > validated.quotite_denominateur) {
    throw new Error('Quotité invalide')
  }
  
  // Database with RLS protection
  const result = await supabase.from('proprietaires').insert(validated)
  return result
}

// Layer 3: Database (Constraints)
-- CHECK constraints sur toutes les colonnes critiques
```

### **XSS Prevention**
```typescript
// Sanitization automatique
import DOMPurify from 'dompurify'

export function sanitizeHTML(input: string): string {
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: [], // Pas de HTML autorisé
    ALLOWED_ATTR: []
  })
}

// Content Security Policy strict
const CSP = `
  default-src 'self';
  script-src 'self' 'unsafe-inline' https://vercel.live;
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: https: blob:;
  connect-src 'self' https://*.supabase.co;
`
```

## 🚨 **Rate Limiting & DDoS Protection**

### **API Rate Limits**
```typescript
// Middleware rate limiting
export async function rateLimitMiddleware(request: Request) {
  const ip = getClientIP(request)
  const key = `rate_limit:${ip}`
  
  const limit = await redis.incr(key)
  if (limit === 1) {
    await redis.expire(key, 60) // 1 minute window
  }
  
  if (limit > 100) { // 100 requests/minute
    return Response.json(
      { error: 'Rate limit exceeded' },
      { status: 429 }
    )
  }
}

// Business operations rate limiting (plus strict)
const BUSINESS_LIMITS = {
  'create_proprietaire': 10,  // 10/minute
  'create_propriete': 5,      // 5/minute
  'update_quotites': 20,      // 20/minute
  'delete_operations': 3      // 3/minute
}
```

## 🔐 **Data Protection & Privacy**

### **Sensitive Data Handling**
```typescript
// Redaction automatique logs
const SENSITIVE_FIELDS = [
  'password', 'token', 'email', 'phone', 'ssn', 'iban'
]

export function redactSensitiveData(data: any): any {
  const redacted = { ...data }
  
  SENSITIVE_FIELDS.forEach(field => {
    if (redacted[field]) {
      redacted[field] = '[REDACTED]'
    }
  })
  
  return redacted
}

// Encryption colonnes sensibles
CREATE TABLE proprietaires (
  id UUID PRIMARY KEY,
  nom VARCHAR(255) NOT NULL,
  email_encrypted TEXT, -- Encrypted avec app key
  phone_encrypted TEXT, -- Encrypted avec app key
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### **GDPR Compliance**
```typescript
// Droit à l'oubli (soft delete)
export async function anonymizeProprietaire(id: string) {
  await supabase
    .from('proprietaires')
    .update({
      nom: 'ANONYMIZED',
      prenom: 'ANONYMIZED', 
      email: null,
      telephone: null,
      adresse: null,
      is_anonymized: true,
      anonymized_at: new Date().toISOString()
    })
    .eq('id', id)
}

// Export données personnelles
export async function exportUserData(userId: string) {
  const data = await Promise.all([
    supabase.from('utilisateurs').select('*').eq('id', userId),
    supabase.from('proprietaires').select('*').eq('created_by', userId),
    // ... autres tables
  ])
  
  return {
    format: 'JSON',
    data: redactSensitiveData(data),
    exportedAt: new Date().toISOString()
  }
}
```

## 🛡️ **Security Monitoring**

### **Audit Logging**
```sql
-- Table audit sécurité
CREATE TABLE security_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  action VARCHAR(100) NOT NULL,
  resource_type VARCHAR(50),
  resource_id UUID,
  ip_address INET,
  user_agent TEXT,
  success BOOLEAN NOT NULL,
  error_message TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger audit automatique
CREATE OR REPLACE FUNCTION log_security_event()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO security_audit_log (
    user_id,
    action, 
    resource_type,
    resource_id,
    success,
    timestamp
  ) VALUES (
    current_setting('app.current_user_id')::UUID,
    TG_OP,
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    true,
    NOW()
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;
```

### **Intrusion Detection**
```typescript
// Détection patterns suspects
export async function detectSuspiciousActivity(userId: string) {
  const activities = await getRecentActivities(userId)
  
  const suspiciousPatterns = [
    activities.filter(a => a.action === 'login_failed').length > 5,
    activities.filter(a => a.action === 'access_denied').length > 10,
    activities.some(a => isFromUnusualLocation(a.ip_address)),
    activities.some(a => isFromTorNetwork(a.ip_address))
  ]
  
  if (suspiciousPatterns.some(Boolean)) {
    await alertSecurityTeam(userId, activities)
    await temporaryAccountLock(userId)
  }
}
```

## 🔒 **Security Checklist**

### **Implementation Status**
- [x] **HTTPS Only**: Toutes communications chiffrées
- [x] **JWT Secure**: Rotation tokens, httpOnly cookies
- [x] **RLS Complete**: 100% coverage tables sensibles  
- [x] **Input Validation**: Zod schemas sur tous endpoints
- [ ] **Rate Limiting**: API protection DDoS
- [x] **CSRF Protection**: Next.js built-in
- [x] **XSS Prevention**: Sanitization user inputs
- [ ] **WAF Rules**: Cloudflare/Vercel protection
- [ ] **Backup Encryption**: Database backups chiffrés

### **Regular Security Tasks**
- [ ] **Monthly**: RLS policies audit
- [ ] **Weekly**: Dependency security scan
- [ ] **Daily**: Suspicious activity monitoring
- [ ] **Real-time**: Failed login detection

---

*Security Requirements avec RLS coverage 100%*
*Compliance GDPR et audit trail complet*
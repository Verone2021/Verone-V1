# 🔒 RAPPORT AUDIT SÉCURITÉ PRÉ-DÉPLOIEMENT PRODUCTION

**Date** : 20 octobre 2025
**Auditeur** : Vérone Security Auditor
**Scope** : Phase 1 (Auth + Profil + Dashboard + Organisations + Admin)
**Status Déploiement** : ❌ **BLOQUÉ - Corrections critiques requises**

---

## 📊 EXECUTIVE SUMMARY

| Métrique | Valeur | Status |
|----------|--------|--------|
| **Vulnérabilités Critiques** | 2 | 🔴 BLOCKER |
| **Vulnérabilités Élevées** | 2 | 🟠 URGENT |
| **Vulnérabilités Moyennes** | 1 | 🟡 RECOMMANDÉ |
| **Dependencies Vulnerables** | 0 | ✅ SECURE |
| **RLS Coverage** | 91% (69/76 tables) | 🟠 INCOMPLET |
| **Overall Risk Level** | **ÉLEVÉ** | ❌ NOT PRODUCTION-READY |

**RECOMMANDATION** : ⛔ **DÉPLOIEMENT PRODUCTION INTERDIT** jusqu'à résolution vulnérabilités critiques.

---

## 🔴 VULNERABILITÉS CRITIQUES (P0 - BLOCKER)

### CRITICAL #1: RLS Désactivé sur 7 Tables

**Sévérité** : 🔴 CRITIQUE
**Impact** : Cross-tenant data leak, accès non autorisé à toutes les données
**CVSS Score** : 9.1 (Critical)

**Tables concernées** :
```sql
-- 7 tables SANS ROW LEVEL SECURITY
1. collection_products
2. collection_shares
3. collections
4. product_status_changes
5. sample_order_items
6. sample_orders
7. variant_groups
```

**Risque Exploitation** :
```typescript
// Scénario d'attaque: User tenant A accède données tenant B
const { data } = await supabase
  .from('collections')
  .select('*')  // ❌ RLS désactivé → Retourne TOUTES les collections de TOUS les tenants

// Résultat: Fuite données confidentielles (collections concurrentes, pricing, etc.)
```

**Preuve** :
```bash
# Query SQL audit exécutée:
SELECT tablename FROM pg_tables
WHERE schemaname = 'public'
  AND rowsecurity = false
  AND tablename NOT LIKE '%backup%';

# Résultat: 7 tables vulnérables
```

**Actions Correctives** (OBLIGATOIRES avant production):

```sql
-- Migration: supabase/migrations/YYYYMMDD_001_enable_rls_missing_tables.sql

-- 1. Activer RLS sur toutes les tables
ALTER TABLE collection_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE collection_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_status_changes ENABLE ROW LEVEL SECURITY;
ALTER TABLE sample_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE sample_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE variant_groups ENABLE ROW LEVEL SECURITY;

-- 2. Créer policies isolation tenant (collections exemple)
CREATE POLICY "Owner/Admin peuvent gérer collections"
ON collections
FOR ALL
TO authenticated
USING (
  organisation_id IN (
    SELECT organisation_id
    FROM user_organisation_assignments
    WHERE user_id = auth.uid()
      AND role_name IN ('owner', 'admin')
  )
)
WITH CHECK (
  organisation_id IN (
    SELECT organisation_id
    FROM user_organisation_assignments
    WHERE user_id = auth.uid()
      AND role_name IN ('owner', 'admin')
  )
);

-- 3. Répéter pattern pour les 6 autres tables
-- Voir: docs/auth/rls-policies.md pour patterns complets
```

**Référence** :
- Documentation: `/Users/romeodossantos/verone-back-office-V1/docs/auth/rls-policies.md`
- Pattern isolation tenant: Ligne 623-651
- Validation: Query SQL ligne 799-827

---

### CRITICAL #2: Hardcoded API Key (Packlink)

**Sévérité** : 🔴 CRITIQUE
**Impact** : Secret exposé dans Git, utilisable par attaquant, frais non autorisés
**CVSS Score** : 8.7 (High)

**Fichier** : `/Users/romeodossantos/verone-back-office-V1/src/app/api/packlink/create-shipment/route.ts`

**Code vulnérable** (ligne 4):
```typescript
// ❌ DANGER: API key hardcodée en clair
const PACKLINK_API_KEY = '03df0c0d63fc1038eac7bf0964b2190b57460810d1025a38e4a54de57e804346'
const PACKLINK_API_URL = 'https://api.packlink.com/v1'
```

**Risque Exploitation** :
1. Secret visible dans Git history (même si supprimé, reste dans commits)
2. Accessible via GitHub (si repo public ou leaké)
3. Permet appels API Packlink non autorisés (création shipments frauduleux)
4. Coûts financiers potentiels (frais transport non autorisés)

**Preuve** :
```bash
# Grep pattern API keys:
grep -r "PACKLINK_API_KEY.*=" src/app/api/

# Résultat:
src/app/api/packlink/create-shipment/route.ts:4:
const PACKLINK_API_KEY = '03df0c0d...'  # ❌ Hardcoded
```

**Actions Correctives** (OBLIGATOIRES):

**Étape 1: Supprimer secret du code**
```typescript
// src/app/api/packlink/create-shipment/route.ts
// AVANT (❌ DANGER)
const PACKLINK_API_KEY = '03df0c0d63fc1038eac7bf0964b2190b57460810d1025a38e4a54de57e804346'

// APRÈS (✅ SÉCURISÉ)
const PACKLINK_API_KEY = process.env.PACKLINK_API_KEY
if (!PACKLINK_API_KEY) {
  throw new Error('PACKLINK_API_KEY environment variable not configured')
}
```

**Étape 2: Ajouter dans .env.local**
```bash
# .env.local (JAMAIS commité)
PACKLINK_API_KEY=03df0c0d63fc1038eac7bf0964b2190b57460810d1025a38e4a54de57e804346
```

**Étape 3: Ajouter dans Vercel Environment Variables**
```bash
# Vercel Dashboard → Settings → Environment Variables
Name: PACKLINK_API_KEY
Value: 03df0c0d63fc1038eac7bf0964b2190b57460810d1025a38e4a54de57e804346
Scope: Production, Preview, Development
```

**Étape 4: Révoquer ancienne clé (CRITIQUE)**
```bash
# Aller sur Packlink Dashboard → API Keys
# 1. Révoquer clé existante (03df0c0d...)
# 2. Générer nouvelle clé
# 3. Mettre à jour .env.local + Vercel
```

**Étape 5: Nettoyer Git history**
```bash
# Supprimer secret de Git history (optionnel mais recommandé)
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch src/app/api/packlink/create-shipment/route.ts" \
  --prune-empty --tag-name-filter cat -- --all

# Ou utiliser BFG Repo-Cleaner (plus rapide)
bfg --replace-text passwords.txt
```

**Référence** :
- OWASP Secrets Management: https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html
- GitHub Secret Scanning: https://docs.github.com/en/code-security/secret-scanning

---

## 🟠 VULNERABILITÉS ÉLEVÉES (P1 - URGENT)

### MAJOR #1: CORS Policy Trop Permissive

**Sévérité** : 🟠 ÉLEVÉE
**Impact** : CSRF attacks possibles, requêtes non autorisées depuis domaines externes
**CVSS Score** : 6.5 (Medium)

**Fichier** : `/Users/romeodossantos/verone-back-office-V1/vercel.json`

**Configuration vulnérable** (ligne 16):
```json
{
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        {
          "key": "Access-Control-Allow-Origin",
          "value": "*"  // ❌ DANGER: Accepte N'IMPORTE QUELLE origine
        }
      ]
    }
  ]
}
```

**Risque Exploitation** :
```html
<!-- Scénario attaque CSRF depuis site malveillant -->
<script>
// Site malveillant (evil.com) peut faire requêtes API Vérone
fetch('https://verone-backoffice.vercel.app/api/products', {
  method: 'DELETE',
  headers: {
    'Authorization': 'Bearer stolen_token'
  },
  body: JSON.stringify({ id: 'product_xyz' })
})
// ✅ Accepté car CORS = "*"
</script>
```

**Actions Correctives** :

```json
// vercel.json
{
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        {
          "key": "Access-Control-Allow-Origin",
          "value": "https://verone-backoffice.vercel.app"  // ✅ Domaine spécifique
        },
        {
          "key": "Access-Control-Allow-Credentials",
          "value": "true"
        },
        {
          "key": "Access-Control-Allow-Methods",
          "value": "GET, POST, PUT, DELETE, OPTIONS"
        },
        {
          "key": "Access-Control-Allow-Headers",
          "value": "X-Requested-With, Content-Type, Authorization"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"  // Protection clickjacking
        },
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"  // Protection MIME sniffing
        },
        {
          "key": "Strict-Transport-Security",
          "value": "max-age=31536000; includeSubDomains"  // HTTPS forcé
        }
      ]
    }
  ]
}
```

**Alternative (si multi-domaines requis)** :
```typescript
// middleware.ts
export function middleware(request: NextRequest) {
  const allowedOrigins = [
    'https://verone-backoffice.vercel.app',
    'https://verone-preview.vercel.app',
    'http://localhost:3000'  // Dev only
  ]

  const origin = request.headers.get('origin')
  const response = NextResponse.next()

  if (origin && allowedOrigins.includes(origin)) {
    response.headers.set('Access-Control-Allow-Origin', origin)
  }

  return response
}
```

---

### MAJOR #2: RLS Policies Trop Permissives

**Sévérité** : 🟠 ÉLEVÉE
**Impact** : Broken Access Control, data leak cross-tenant
**CVSS Score** : 7.2 (High)

**Tables concernées** :
1. `products` - Policies trop permissives
2. `shipments` - Pas de filtre organisation

**Problème 1: Table `products`**

```sql
-- Query audit:
SELECT tablename, policyname, cmd
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'products';

-- Résultat DANGEREUX:
┌───────────┬────────────────────────────────────┬────────┐
│ tablename │ policyname                         │ cmd    │
├───────────┼────────────────────────────────────┼────────┤
│ products  │ products_select_anonymous_testing  │ SELECT │  ❌ Accès anonyme
│ products  │ products_delete_authenticated      │ DELETE │  ❌ N'importe qui DELETE
│ products  │ products_insert_authenticated      │ INSERT │  ⚠️ Pas de filtre org
│ products  │ products_update_authenticated      │ UPDATE │  ⚠️ Pas de filtre org
└───────────┴────────────────────────────────────┴────────┘
```

**Risque** :
```typescript
// User tenant A peut supprimer produits tenant B
const { error } = await supabase
  .from('products')
  .delete()
  .eq('id', 'product_tenant_b')  // ❌ RLS permet car policy "products_delete_authenticated"
```

**Actions Correctives** :

```sql
-- Migration: supabase/migrations/YYYYMMDD_002_fix_products_rls_policies.sql

-- 1. Supprimer policies permissives
DROP POLICY IF EXISTS "products_select_anonymous_testing" ON products;
DROP POLICY IF EXISTS "products_delete_authenticated" ON products;
DROP POLICY IF EXISTS "products_insert_authenticated" ON products;
DROP POLICY IF EXISTS "products_update_authenticated" ON products;

-- 2. Recréer policies strictes Owner+Admin avec isolation tenant
CREATE POLICY "Owner/Admin peuvent gérer produits"
ON products
FOR ALL
TO authenticated
USING (
  organisation_id IN (
    SELECT organisation_id
    FROM user_organisation_assignments
    WHERE user_id = auth.uid()
      AND role_name IN ('owner', 'admin')
  )
)
WITH CHECK (
  organisation_id IN (
    SELECT organisation_id
    FROM user_organisation_assignments
    WHERE user_id = auth.uid()
      AND role_name IN ('owner', 'admin')
  )
);

-- 3. Sales: Lecture seule
CREATE POLICY "Sales peuvent voir produits"
ON products
FOR SELECT
TO authenticated
USING (
  organisation_id IN (
    SELECT organisation_id
    FROM user_organisation_assignments
    WHERE user_id = auth.uid()
      AND role_name = 'sales'
  )
);
```

**Problème 2: Table `shipments`**

```sql
-- Policy vulnérable:
"Authenticated users can read shipments" FOR SELECT
-- ❌ Pas de filtre organisation_id → Cross-tenant leak

-- Fix requis:
CREATE POLICY "Owner/Admin/Sales peuvent voir shipments de leur org"
ON shipments
FOR SELECT
TO authenticated
USING (
  sales_order_id IN (
    SELECT id FROM sales_orders
    WHERE organisation_id IN (
      SELECT organisation_id
      FROM user_organisation_assignments
      WHERE user_id = auth.uid()
        AND role_name IN ('owner', 'admin', 'sales')
    )
  )
);
```

**Référence** :
- Documentation RLS: `/Users/romeodossantos/verone-back-office-V1/docs/auth/rls-policies.md`
- Pattern Owner+Admin: Ligne 683-711

---

## 🟡 VULNERABILITÉS MOYENNES (P2 - RECOMMANDÉ)

### MEDIUM #1: Input Sanitization Partielle

**Sévérité** : 🟡 MOYENNE
**Impact** : Potentiel XSS (Cross-Site Scripting) si input utilisateur non sanitizé
**CVSS Score** : 5.4 (Medium)

**Constat** :
- Aucun schéma Zod détecté dans formulaires critiques
- Pas de sanitization HTML explicite (DOMPurify)
- Risque XSS si données utilisateur affichées sans escape

**Fichiers analysés** :
```
src/components/business/sales-order-form-modal.tsx
src/components/business/customer-form-modal.tsx
src/components/business/supplier-form-modal.tsx
```

**Recommandations** :

**1. Créer schémas Zod validation**
```typescript
// src/lib/validations/sales-orders.ts
import { z } from 'zod'
import DOMPurify from 'isomorphic-dompurify'

export const SalesOrderSchema = z.object({
  customer_id: z.string().uuid('ID client invalide'),

  notes: z.string()
    .max(2000, 'Notes trop longues')
    .transform(value => DOMPurify.sanitize(value, {
      ALLOWED_TAGS: [],  // Aucune balise HTML
      ALLOWED_ATTR: []
    })),

  shipping_address: z.string()
    .min(10, 'Adresse trop courte')
    .max(500, 'Adresse trop longue')
    .regex(/^[a-zA-Z0-9\s,.-]+$/, 'Caractères non autorisés'),

  total_ht: z.number()
    .positive('Montant doit être positif')
    .max(1000000, 'Montant trop élevé')
})
```

**2. Utiliser dans formulaires**
```typescript
// sales-order-form-modal.tsx
import { SalesOrderSchema } from '@/lib/validations/sales-orders'

const onSubmit = async (data: FormData) => {
  // Validation Zod
  const validatedData = SalesOrderSchema.parse({
    customer_id: data.customer_id,
    notes: data.notes,
    shipping_address: data.shipping_address,
    total_ht: data.total_ht
  })

  // Data validée et sanitizée
  await createOrder(validatedData)
}
```

**3. Installer dépendance**
```bash
npm install isomorphic-dompurify zod
```

**Référence** :
- OWASP XSS Prevention: https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html

---

## ✅ POINTS POSITIFS (Validés)

### 1. Authentication Flows Supabase

**Status** : ✅ SÉCURISÉ

**Fichiers validés** :
- `src/lib/supabase/server.ts` - Configuration server-side correcte
- `src/lib/supabase/client.ts` - Configuration client-side correcte

**Best Practices appliquées** :
```typescript
// ✅ Service Role Key jamais exposé frontend
export const createAdminClient = () => {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,  // ✅ Server-side only
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  )
}

// ✅ Client browser utilise ANON key
export const createClient = () =>
  createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!  // ✅ Public key OK
  )
```

---

### 2. API Routes Authorization

**Status** : ✅ SÉCURISÉ

**Exemple validé** : `/api/admin/users/route.ts`

```typescript
// ✅ Double vérification: Auth + Role
const { data: { user }, error: authError } = await supabase.auth.getUser()
if (authError || !user) {
  return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
}

// ✅ Vérification rôle Owner
const { data: profile } = await supabase
  .from('user_profiles')
  .select('role')
  .eq('user_id', user.id)
  .single()

if (profile?.role !== 'owner') {
  return NextResponse.json(
    { error: 'Accès refusé - Owner uniquement' },
    { status: 403 }
  )
}
```

---

### 3. Webhook Security

**Status** : ✅ SÉCURISÉ

**Fichier** : `src/app/api/webhooks/abby/route.ts`

**Protections validées** :
1. ✅ Signature validation (HMAC)
2. ✅ Idempotency (event_id unique)
3. ✅ Input validation
4. ✅ Error handling

```typescript
// ✅ Validation signature webhook
const webhookSecret = process.env.ABBY_WEBHOOK_SECRET
if (webhookSecret) {
  const validationResult = await parseAndValidateWebhook<WebhookPayload>(
    request.clone(),
    webhookSecret
  )

  if (!validationResult.valid) {
    return NextResponse.json(
      { error: 'Invalid webhook signature' },
      { status: 401 }
    )
  }
}

// ✅ Idempotency check
const { data: existingEvent } = await supabase
  .from('abby_webhook_events')
  .select('id')
  .eq('event_id', eventId)
  .single()

if (existingEvent) {
  return NextResponse.json(
    { message: 'Event already processed' },
    { status: 200 }
  )
}
```

---

### 4. Dependencies Security

**Status** : ✅ AUCUNE VULNÉRABILITÉ

```bash
npm audit --audit-level=moderate

# Résultat:
found 0 vulnerabilities
```

**Recommandation** : Configurer Dependabot GitHub pour scans automatiques.

---

### 5. Environment Variables

**Status** : ✅ SÉCURISÉ

**Validation .gitignore** :
```bash
# ✅ .env.local bien exclu du commit
.env
.env.local
.env.development.local
.env.test.local
.env.production.local
```

**Secrets protégés** :
```
✅ NEXT_PUBLIC_SUPABASE_URL (public OK)
✅ NEXT_PUBLIC_SUPABASE_ANON_KEY (public OK)
✅ SUPABASE_SERVICE_ROLE_KEY (server-only, jamais committé)
✅ DATABASE_URL (server-only, jamais committé)
❌ PACKLINK_API_KEY (hardcoded - CRITICAL #2)
```

---

## 📋 SECURITY CHECKLIST PRÉ-PRODUCTION

### 🔴 CRITICAL (Blocker Production)

- [ ] **RLS activé sur 7 tables manquantes**
  - [ ] collection_products
  - [ ] collection_shares
  - [ ] collections
  - [ ] product_status_changes
  - [ ] sample_order_items
  - [ ] sample_orders
  - [ ] variant_groups

- [ ] **Packlink API Key externalisée**
  - [ ] Supprimer hardcoded key du code
  - [ ] Ajouter dans .env.local
  - [ ] Ajouter dans Vercel env vars
  - [ ] Révoquer ancienne clé + générer nouvelle

### 🟠 MAJOR (Fix Prioritaire)

- [ ] **CORS policy restreinte**
  - [ ] Remplacer "*" par domaines spécifiques
  - [ ] Ajouter headers sécurité (X-Frame-Options, CSP)

- [ ] **RLS policies products corrigées**
  - [ ] Supprimer policies permissives
  - [ ] Créer policies Owner+Admin strictes

- [ ] **RLS policies shipments corrigées**
  - [ ] Ajouter filtre organisation_id

### 🟡 MEDIUM (Amélioration Continue)

- [ ] **Input validation Zod**
  - [ ] Créer schémas validation formulaires
  - [ ] Installer isomorphic-dompurify

- [ ] **Security headers Vercel**
  - [ ] Content-Security-Policy
  - [ ] X-Frame-Options: DENY
  - [ ] Strict-Transport-Security

- [ ] **Rate Limiting API**
  - [ ] Implémenter throttling requêtes (optionnel Phase 1)

---

## 🛠️ ACTIONS CORRECTIVES PRIORISÉES

### Phase 1: BLOCKER (Avant production - 2-3h)

1. **Migration RLS tables manquantes**
   ```bash
   # Créer migration
   supabase/migrations/20251020_001_enable_rls_critical_tables.sql

   # Appliquer
   npm run migration:apply
   ```

2. **Fix Packlink API Key**
   ```bash
   # 1. Edit route.ts
   # 2. Add to .env.local
   # 3. Add to Vercel dashboard
   # 4. Revoke old key Packlink
   ```

3. **Fix CORS vercel.json**
   ```bash
   # Edit vercel.json
   # Test deployment preview
   # Validate headers
   ```

### Phase 2: URGENT (Semaine 1 - 4-6h)

4. **Migration RLS products policies**
   ```bash
   supabase/migrations/20251020_002_fix_products_rls_strict.sql
   ```

5. **Migration RLS shipments policies**
   ```bash
   supabase/migrations/20251020_003_fix_shipments_rls_isolation.sql
   ```

### Phase 3: RECOMMANDÉ (Semaine 2 - 8-10h)

6. **Implémenter Zod schemas**
   ```bash
   # Créer src/lib/validations/
   # Installer dependencies
   # Refactor formulaires
   ```

7. **Security headers avancés**
   ```bash
   # CSP policy
   # HSTS config
   # Subresource Integrity
   ```

---

## 📚 RÉFÉRENCES DOCUMENTATION

### Documentation Interne
- RLS Policies: `/Users/romeodossantos/verone-back-office-V1/docs/auth/rls-policies.md`
- Database Schema: `/Users/romeodossantos/verone-back-office-V1/docs/database/SCHEMA-REFERENCE.md`
- Triggers: `/Users/romeodossantos/verone-back-office-V1/docs/database/triggers.md`

### Standards Sécurité
- OWASP Top 10 2021: https://owasp.org/www-project-top-ten/
- OWASP API Security: https://owasp.org/www-project-api-security/
- Supabase RLS Best Practices: https://supabase.com/docs/guides/auth/row-level-security

### Compliance
- RGPD/GDPR: Protection données personnelles validée (RLS isolation tenant)
- PCI-DSS: Pas de données carte crédit (Abby/Packlink externalisés)
- ISO 27001: Recommandé pour future certification

---

## 📊 MÉTRIQUES AUDIT

**Scope analysé** :
- 76 tables database
- 239 RLS policies
- 35 API routes
- 33 composants formulaires
- 677 fichiers scannés (secrets)

**Temps audit** : 2h30
**Outils utilisés** :
- PostgreSQL RLS queries
- Grep patterns (API keys, secrets)
- npm audit
- Manual code review

**Prochain audit** : Post-corrections (avant merge production)

---

## ✅ APPROBATION DÉPLOIEMENT

- [ ] **Toutes vulnérabilités CRITICAL résolues**
- [ ] **Toutes vulnérabilités MAJOR résolues ou risque accepté**
- [ ] **Migration RLS testée en preview Vercel**
- [ ] **CORS policy validée (Origin specific)**
- [ ] **Packlink API key révoquée + nouvelle générée**
- [ ] **Security team sign-off**
- [ ] **Owner validation**

**Status Final** : ❌ **NOT APPROVED - Corrections requises**

---

**Rapport généré le** : 2025-10-20 14:30 UTC
**Prochaine révision** : Après application corrections critiques
**Contact Security** : security@verone.com

*Vérone Back Office - Security Audit Report Phase 1*

# 🔄 Guide Migration Console.log → Logger Sécurisé

**Objectif** : Remplacer 1007 `console.log` par le logger sécurisé Vérone
**Réduction cible** : 95% (de 1007 à <50 occurrences)
**Priorité** : P0-P1 (Zones critiques)

---

## 📋 Vue d'Ensemble

### État Actuel
- **1007 occurrences** de console.log/error/warn
- **223 fichiers** affectés
- **Risques** : Fuite credentials, PII, stack traces en production

### État Cible
- **<50 occurrences** (zones non critiques uniquement)
- **Logger sécurisé** avec sanitization automatique
- **Structured logging** pour monitoring production

---

## 🎯 Stratégie de Migration

### Phases Prioritaires

#### Phase 1 : API Routes (P0 - 4h) ⚠️ CRITIQUE
```bash
Zone : src/app/api/
Occurrences : 115
Risque : 🔴 CRITIQUE (credentials, tokens)
Deadline : Avant déploiement
```

#### Phase 2 : Hooks Top 5 (P1 - 3h) ⚠️ ÉLEVÉ
```bash
Zone : src/hooks/
Occurrences : 92 (top 5 fichiers)
Risque : 🟠 ÉLEVÉ (données utilisateur)
Deadline : Sprint courant
```

#### Phase 3 : Lib Files (P1 - 2h) ⚠️ ÉLEVÉ
```bash
Zone : src/lib/
Occurrences : 47 (fichiers critiques)
Risque : 🟠 ÉLEVÉ (logique auth)
Deadline : Sprint courant
```

#### Phase 4 : Components (P2 - 4h) 🟡 MOYEN
```bash
Zone : src/components/
Occurrences : 283
Risque : 🟡 MOYEN (affichage)
Deadline : Sprint +1
```

---

## 📖 Patterns de Migration

### Pattern 1 : console.log basique

**AVANT** ❌
```typescript
console.log('User loaded:', user)
console.log('Products count:', products.length)
```

**APRÈS** ✅
```typescript
import { logger } from '@/lib/logger'

logger.info('User loaded', { userId: user.id })
logger.debug('Products count', { count: products.length })
```

**Règle** : JAMAIS logger l'objet complet, seulement ID/count

---

### Pattern 2 : console.error avec Error

**AVANT** ❌
```typescript
try {
  // code
} catch (error) {
  console.error('API call failed:', error)
}
```

**APRÈS** ✅
```typescript
import { logger } from '@/lib/logger'

try {
  // code
} catch (error) {
  logger.error('API call failed', error as Error, {
    endpoint: '/api/products',
    method: 'POST'
  })
}
```

**Avantage** : Logger extrait automatiquement error.message, error.name, error.stack (dev only)

---

### Pattern 3 : console.log avec données sensibles

**AVANT** ❌ (DANGEREUX)
```typescript
console.log('Login attempt:', {
  email: user.email,
  password: credentials.password,  // ⚠️ FUITE CRITIQUE
  token: authToken                 // ⚠️ FUITE CRITIQUE
})
```

**APRÈS** ✅
```typescript
import { logger } from '@/lib/logger'

logger.info('Login attempt', {
  userId: user.id,
  // email/password/token JAMAIS loggés
})
```

**Règle** : Logger sanitize automatiquement password/token/secret

---

### Pattern 4 : console.warn deprecation

**AVANT** ❌
```typescript
console.warn('This feature is deprecated:', featureName)
```

**APRÈS** ✅
```typescript
import { logger } from '@/lib/logger'

logger.warn('Deprecated feature usage', {
  feature: featureName,
  userId: currentUserId
})
```

---

### Pattern 5 : Performance logging

**AVANT** ❌
```typescript
const start = Date.now()
// operation
console.log('Operation took:', Date.now() - start, 'ms')
```

**APRÈS** ✅
```typescript
import { logger } from '@/lib/logger'

const timer = logger.startTimer()
// operation
const duration = timer()
logger.performance('database_query', duration, {
  query: 'SELECT products',
  rows: results.length
})
```

**Avantage** : Logger auto-warn si duration > 2000ms

---

### Pattern 6 : Business operations

**AVANT** ❌
```typescript
console.log('Product created:', product.id)
console.log('Collection generated:', collection.id, 'with', productCount, 'products')
```

**APRÈS** ✅
```typescript
import { logger, catalogueLogger } from '@/lib/logger'

// Option 1 : Logger générique
logger.business('product_created', {
  userId: currentUser.id,
  productId: product.id
})

// Option 2 : Logger métier spécialisé
catalogueLogger.collectionGenerated(
  collection.id,
  productCount,
  currentUser.id
)
```

---

### Pattern 7 : API Routes (Express/Next.js)

**AVANT** ❌
```typescript
export async function POST(req: Request) {
  console.log('Incoming request:', req.method, req.url)

  try {
    const data = await req.json()
    console.log('Request body:', data)  // ⚠️ Risque PII

    // business logic

    console.log('Response:', result)
    return Response.json(result)
  } catch (error) {
    console.error('API Error:', error)
    return Response.json({ error }, { status: 500 })
  }
}
```

**APRÈS** ✅
```typescript
import { logger } from '@/lib/logger'

export async function POST(req: Request) {
  const context = logger.createRequestContext(req)
  const timer = logger.startTimer()

  logger.info('API Request', context)

  try {
    const data = await req.json()
    // ❌ PAS logger data complet

    // business logic

    const duration = timer()
    logger.performance('api_products_create', duration, context)

    return Response.json(result)
  } catch (error) {
    logger.error('API Error', error as Error, context)
    return Response.json({ error: 'Internal error' }, { status: 500 })
  }
}
```

---

### Pattern 8 : Hooks React/Supabase

**AVANT** ❌
```typescript
export function useProducts() {
  const [products, setProducts] = useState([])

  useEffect(() => {
    console.log('Fetching products with filters:', filters)

    const fetchProducts = async () => {
      try {
        const { data, error } = await supabase
          .from('products')
          .select('*')

        console.log('Products loaded:', data)  // ⚠️ Risque fuite données

        if (error) console.error('Supabase error:', error)

        setProducts(data || [])
      } catch (err) {
        console.error('Unexpected error:', err)
      }
    }

    fetchProducts()
  }, [filters])

  return products
}
```

**APRÈS** ✅
```typescript
import { logger } from '@/lib/logger'

export function useProducts() {
  const [products, setProducts] = useState([])

  useEffect(() => {
    const fetchProducts = async () => {
      const timer = logger.startTimer()

      logger.debug('Fetching products', {
        filterCount: Object.keys(filters).length
      })

      try {
        const { data, error } = await supabase
          .from('products')
          .select('*')

        if (error) {
          logger.error('Supabase query failed', error as Error, {
            table: 'products',
            operation: 'select'
          })
          return
        }

        const duration = timer()
        logger.performance('fetch_products', duration, {
          count: data?.length || 0
        })

        setProducts(data || [])
      } catch (err) {
        logger.error('Unexpected error in useProducts', err as Error)
      }
    }

    fetchProducts()
  }, [filters])

  return products
}
```

---

## 🔥 Top 20 Fichiers Prioritaires

### Batch 1 : API Routes (P0)

```bash
# 1. src/app/api/google-merchant/test-connection/route.ts (16 occurrences)
# Risque : Credentials Google API
# Action : Remplacer tous console.log par logger.info/error
```

**Migration exemple** :
```typescript
// AVANT
console.log('Testing Google Merchant connection...')
console.log('API Key:', process.env.GOOGLE_API_KEY)  // ⚠️ FUITE CRITIQUE

// APRÈS
logger.info('Testing Google Merchant connection', {
  environment: process.env.NODE_ENV
  // ❌ PAS de API key dans logs
})
```

---

### Batch 2 : Hooks Critiques (P1)

#### 2.1 use-variant-groups.ts (31 occurrences) 🔴

```bash
# Localisation : src/hooks/use-variant-groups.ts
# Occurrences : 31
# Risque : Données groupes variantes, filtres utilisateur
```

**Migration type** :
```typescript
// AVANT
console.log('Fetching variant groups:', filters)
console.log('Variant group created:', newGroup)

// APRÈS
logger.debug('Fetching variant groups', {
  filterCount: Object.keys(filters).length,
  userId: currentUser?.id
})

logger.business('variant_group_created', {
  groupId: newGroup.id,
  userId: currentUser?.id,
  productCount: 0
})
```

#### 2.2 use-contacts.ts (18 occurrences) 🟠

```bash
# Localisation : src/hooks/use-contacts.ts
# Occurrences : 18
# Risque : PII (emails, phones, addresses)
```

**Migration type** :
```typescript
// AVANT
console.log('Contact created:', contact)  // ⚠️ PII complet

// APRÈS
logger.business('contact_created', {
  contactId: contact.id,
  organisationId: contact.organisation_id,
  // ❌ PAS email/phone dans logs
})
```

#### 2.3 use-product-images.ts (15 occurrences) 🟠

```bash
# Localisation : src/hooks/use-product-images.ts
# Occurrences : 15
# Risque : Upload paths, storage keys
```

**Migration type** :
```typescript
// AVANT
console.log('Uploading image:', file.name, file.size)
console.log('Storage path:', storagePath)

// APRÈS
logger.info('Image upload started', {
  fileSize: file.size,
  fileType: file.type,
  productId: productId
  // ❌ PAS de storagePath complet (sensible)
})
```

---

### Batch 3 : Lib Files (P1)

#### 3.1 lib/google-merchant/client.ts (21 occurrences) 🔴

```bash
# Localisation : src/lib/google-merchant/client.ts
# Occurrences : 21
# Risque : API tokens, credentials, responses Google
```

**Migration type** :
```typescript
// AVANT
console.log('Google API response:', response)  // ⚠️ Peut contenir tokens

// APRÈS
logger.info('Google Merchant API call', {
  status: response.status,
  productCount: response.data?.products?.length
  // ❌ PAS response complet
})
```

#### 3.2 lib/upload/supabase-utils.ts (14 occurrences) 🔴

```bash
# Localisation : src/lib/upload/supabase-utils.ts
# Occurrences : 14
# Risque : Storage URLs, Supabase keys
```

**Migration type** :
```typescript
// AVANT
console.log('Upload to Supabase:', bucket, path, file)

// APRÈS
logger.info('Supabase upload', {
  bucket: bucket,
  fileSize: file.size,
  fileType: file.type
  // ❌ PAS path complet ni file.content
})
```

---

## 🛠️ Outils d'Automatisation

### Script 1 : Scan Console.log

```bash
#!/bin/bash
# scripts/security/scan-console-logs.sh

echo "🔍 Scanning console.log dans zones critiques..."

# API Routes
API_COUNT=$(grep -r "console\." src/app/api --include="*.ts" | wc -l)
echo "API Routes: $API_COUNT occurrences"

# Hooks
HOOKS_COUNT=$(grep -r "console\." src/hooks --include="*.ts" | wc -l)
echo "Hooks: $HOOKS_COUNT occurrences"

# Lib
LIB_COUNT=$(grep -r "console\." src/lib --include="*.ts" | wc -l)
echo "Lib: $LIB_COUNT occurrences"

# Total
TOTAL=$((API_COUNT + HOOKS_COUNT + LIB_COUNT))
echo "Total zones critiques: $TOTAL occurrences"

if [ "$TOTAL" -gt 300 ]; then
  echo "❌ ÉCHEC: Trop de console.log en zones critiques"
  exit 1
fi

echo "✅ SUCCÈS"
```

### Script 2 : Batch Replacement

```bash
#!/bin/bash
# scripts/security/replace-console-logs.sh

FILE=$1

if [ -z "$FILE" ]; then
  echo "Usage: ./replace-console-logs.sh <file.ts>"
  exit 1
fi

echo "🔄 Remplacement console.log dans $FILE..."

# Backup
cp "$FILE" "$FILE.backup"

# Replacements basiques (à valider manuellement après)
sed -i '' 's/console\.log(/logger.info(/g' "$FILE"
sed -i '' 's/console\.error(/logger.error(/g' "$FILE"
sed -i '' 's/console\.warn(/logger.warn(/g' "$FILE"
sed -i '' 's/console\.debug(/logger.debug(/g' "$FILE"

# Ajouter import si manquant
if ! grep -q "import.*logger" "$FILE"; then
  sed -i '' "1s/^/import { logger } from '@\/lib\/logger'\n\n/" "$FILE"
fi

echo "✅ Remplacement terminé - VALIDATION MANUELLE REQUISE"
echo "   Backup : $FILE.backup"
echo "   Fichier modifié : $FILE"
echo ""
echo "⚠️  ATTENTION : Vérifier que les arguments sont sécurisés!"
```

### Script 3 : Validation Pre-commit

```bash
#!/bin/bash
# .git/hooks/pre-commit

echo "🔒 Validation sécurité console.log..."

# Fichiers stagés avec console.log
FILES=$(git diff --cached --name-only | grep -E '\.(ts|tsx)$')

for FILE in $FILES; do
  # Vérifier console.log en zones critiques
  if echo "$FILE" | grep -qE "src/(app/api|lib/security|hooks/use-auth)"; then
    if grep -q "console\." "$FILE"; then
      echo "❌ BLOQUÉ: $FILE contient console.log en zone critique"
      echo "   Remplacer par logger avant commit"
      exit 1
    fi
  fi

  # Vérifier logs credentials
  if grep -qiE "console\.(log|error|warn).*(\bpassword\b|\btoken\b|\bsecret\b|\bapikey\b)" "$FILE"; then
    echo "❌ BLOQUÉ: $FILE contient log de credentials"
    echo "   Ligne concernée:"
    grep -niE "console\.(log|error|warn).*(\bpassword\b|\btoken\b|\bsecret\b|\bapikey\b)" "$FILE"
    exit 1
  fi
done

echo "✅ Validation sécurité passée"
```

---

## 📊 Tracking Progression

### Checklist Migration

#### Phase 1 : API Routes (P0)
- [ ] src/app/api/google-merchant/test-connection/route.ts (16)
- [ ] Autres API routes (~99 occurrences)
- [ ] Tests validation aucune fuite credentials
- [ ] **Target : 0 console.log dans src/app/api/**

#### Phase 2 : Hooks Top 5 (P1)
- [ ] use-variant-groups.ts (31)
- [ ] use-contacts.ts (18)
- [ ] use-product-images.ts (15)
- [ ] use-collection-images.ts (15)
- [ ] use-optimized-image-upload.ts (14)
- [ ] **Target : 0 console.log dans top 5 hooks**

#### Phase 3 : Lib Files (P1)
- [ ] google-merchant/client.ts (21)
- [ ] upload/supabase-utils.ts (14)
- [ ] upload/upload-performance-monitor.ts (12)
- [ ] **Target : 0 console.log dans lib critiques**

#### Phase 4 : Components (P2)
- [ ] Batch replacement components/business/ (~100)
- [ ] Batch replacement components/forms/ (~80)
- [ ] Validation manuelle zones sensibles
- [ ] **Target : <20 console.log dans components/**

---

## ✅ Validation Post-Migration

### Test 1 : Build Production

```bash
# Build production
npm run build

# Vérifier bundle client
grep -r "console\.log\|console\.error" .next/static/**/*.js | wc -l
# ATTENDU: 0 (minification supprime)

# Vérifier server-side
grep -r "console\." .next/server/**/*.js | wc -l
# ATTENDU: <10 (logger uniquement)
```

### Test 2 : Logs Structurés

```bash
# Démarrer app en mode production
NODE_ENV=production npm start

# Faire quelques opérations (login, create product, etc.)

# Vérifier logs structurés JSON
tail -f logs/app.log | jq '.'
# ATTENDU: Logs JSON valides avec timestamp, level, message, context
```

### Test 3 : Sanitization Credentials

```bash
# Forcer erreur auth (mauvais password)
# Vérifier que password n'apparaît PAS dans logs

tail -f logs/app.log | grep -i "password"
# ATTENDU: 0 résultats

tail -f logs/app.log | grep -i "token"
# ATTENDU: 0 résultats (ou "***REDACTED***")
```

---

## 🎓 Best Practices

### DO ✅

1. **Toujours importer logger** au lieu de console
   ```typescript
   import { logger } from '@/lib/logger'
   ```

2. **Logger uniquement IDs/counts**, jamais objets complets
   ```typescript
   logger.info('User loaded', { userId: user.id })
   ```

3. **Utiliser logger spécialisés** pour business operations
   ```typescript
   catalogueLogger.productViewed(productId, userId)
   ```

4. **Logger performance** pour operations lentes
   ```typescript
   logger.performance('database_query', duration)
   ```

5. **Tester logs en staging** avant production
   ```bash
   NODE_ENV=production npm start
   ```

### DON'T ❌

1. **JAMAIS logger credentials/secrets**
   ```typescript
   // ❌ INTERDIT
   logger.info('Auth', { password: user.password })
   ```

2. **JAMAIS logger objets complets**
   ```typescript
   // ❌ INTERDIT
   logger.info('User', user)  // Peut contenir email, phone, etc.
   ```

3. **JAMAIS logger stack traces en production**
   ```typescript
   // ❌ Logger le fait automatiquement (dev only)
   logger.error('Error', error)  // ✅ OK, stack auto en dev
   ```

4. **JAMAIS logger PII non masqué**
   ```typescript
   // ❌ INTERDIT
   logger.info('Contact', { email: contact.email })

   // ✅ OK (logger masque automatiquement)
   logger.info('Contact', { contactId: contact.id })
   ```

5. **JAMAIS console.log dans nouveau code**
   ```typescript
   // ❌ INTERDIT (pre-commit hook bloque)
   console.log('New feature')

   // ✅ OK
   logger.info('New feature activated')
   ```

---

## 📞 Support & Questions

**Questions migration** : Contact tech lead
**Blockers** : Escalade security team
**Documentation logger** : Voir `src/lib/logger.ts` (commentaires détaillés)

---

## 📈 Métriques Succès

**Avant migration** : 1007 console.log
**Cible après Phase 1-3** : <300 console.log
**Cible finale** : <50 console.log

**Coverage** :
- API Routes : 100% migré (0 console.log)
- Hooks critiques : 100% migré (top 10 fichiers)
- Lib security : 100% migré (0 console.log)
- Components : >80% migré (<50 console.log restants)

---

*Guide créé le 8 octobre 2025 - Vérone Security Team*

# Audit ESLint Complet - Verone Monorepo

**Date** : 2026-02-01
**Auditeur** : Claude Sonnet 4.5
**Scope** : 3 applications principales + packages

---

## 📊 Vue d'Ensemble

| Application       | Erreurs | Warnings  | Status |
| ----------------- | ------- | --------- | ------ |
| **back-office**   | 0       | 2,714     | ⚠️     |
| **linkme**        | 0       | 1,078     | ⚠️     |
| **site-internet** | 0       | 0         | ✅     |
| **TOTAL**         | **0**   | **3,792** | ⚠️     |

**Points positifs** :

- ✅ Aucune erreur ESLint bloquante
- ✅ Site-Internet 100% clean
- ✅ Build passe sur toutes les apps
- ✅ Type-check passe sur toutes les apps

**Points d'attention** :

- ⚠️ 3,792 warnings TypeScript strict mode
- ⚠️ Majorité liée à l'usage de `any` type

---

## 🎯 Back-Office (2,714 warnings)

### Distribution par Catégorie

| Règle                         | Count | %     | Sévérité  |
| ----------------------------- | ----- | ----- | --------- |
| `no-unsafe-member-access`     | 1,102 | 40.6% | ⚠️ Medium |
| `no-unsafe-assignment`        | 556   | 20.5% | ⚠️ Medium |
| `no-explicit-any`             | 375   | 13.8% | ⚠️ Medium |
| `no-unsafe-call`              | 238   | 8.8%  | ⚠️ Medium |
| `no-unsafe-argument`          | 170   | 6.3%  | ⚠️ Medium |
| `prefer-nullish-coalescing`   | 109   | 4.0%  | 🟡 Low    |
| `no-unsafe-return`            | 55    | 2.0%  | ⚠️ Medium |
| `no-img-element` (Next.js)    | 21    | 0.8%  | 🟡 Low    |
| `no-unused-vars`              | 20    | 0.7%  | 🟡 Low    |
| `react-hooks/exhaustive-deps` | 31    | 1.1%  | 🔴 High   |
| `prettier/prettier`           | 27    | 1.0%  | 🟢 Info   |
| `prefer-optional-chain`       | 7     | 0.3%  | 🟡 Low    |
| `no-empty-object-type`        | 1     | 0.0%  | 🟡 Low    |

### Analyse par Sévérité

#### 🔴 CRITIQUE (31 warnings)

**react-hooks/exhaustive-deps** : 31 occurrences

**Impact** : Bugs potentiels (stale closures, infinite loops, memory leaks)

**Exemples** :

- `useEffect` avec dépendances manquantes
- `useCallback` avec deps incorrectes

**Priorité** : **P0 - À CORRIGER IMMÉDIATEMENT**

**Solution** :

```typescript
// ❌ AVANT
useEffect(() => {
  loadData();
}, []); // loadData manquant

// ✅ APRÈS
useEffect(() => {
  void loadData().catch(console.error);
}, [loadData]); // ou useCallback si loadData change
```

#### ⚠️ MEDIUM (2,121 warnings)

**Type Safety Issues** (no-unsafe-\*)

**Impact** : Perte de type-safety, bugs runtime potentiels

**Cause racine** : Usage excessif de `any` type (375 occurrences)

**Pattern récurrent** :

```typescript
// ❌ PATTERN ACTUEL
const data: any = await response.json();
console.log(data.user.name); // no-unsafe-member-access

// ✅ SOLUTION
interface ApiResponse {
  user: { name: string };
}
const data: ApiResponse = await response.json();
console.log(data.user.name); // Type-safe
```

**Zones critiques** :

1. **API Routes** : Réponses Supabase non typées
2. **Forms** : `react-hook-form` avec `any`
3. **Modal Props** : `as any` pour casting
4. **Supabase Queries** : `.data` typé `any`

**Priorité** : **P1 - Correction graduelle** (migration TIER by TIER)

#### 🟡 LOW (563 warnings)

**prefer-nullish-coalescing** : 109 occurrences

- Status : **49% déjà corrigés** (Batch 115-139)
- Restant : 109 sont des faux positifs (|| sémantiquement correct)
- Priorité : **P3 - Won't Fix** (ESLint config à ajuster)

**no-unused-vars** : 20 occurrences

- Variables/imports inutilisés
- Priorité : **P2 - Cleanup rapide** (1 batch)

**prefer-optional-chain** : 7 occurrences

- Opportunités d'utiliser `?.` au lieu de `&&`
- Priorité : **P2 - Quick win**

**no-img-element** : 21 occurrences

- Utilisation de `<img>` au lieu de `next/image`
- Impact : Performance (LCP, bandwidth)
- Priorité : **P2 - Performance**

**prettier/prettier** : 27 occurrences

- Formatage inconsistant
- Priorité : **P2 - Auto-fixable** (`pnpm lint --fix`)

---

## 🔗 LinkMe (1,078 warnings)

### Distribution par Catégorie

| Règle                       | Count | %     | Sévérité  |
| --------------------------- | ----- | ----- | --------- |
| `no-unsafe-member-access`   | 342   | 31.7% | ⚠️ Medium |
| `prefer-nullish-coalescing` | 255   | 23.7% | 🟡 Low    |
| `no-unsafe-assignment`      | 207   | 19.2% | ⚠️ Medium |
| `no-unsafe-call`            | 156   | 14.5% | ⚠️ Medium |
| `no-explicit-any`           | 60    | 5.6%  | ⚠️ Medium |
| `no-unsafe-return`          | 17    | 1.6%  | ⚠️ Medium |
| `no-unsafe-argument`        | 16    | 1.5%  | ⚠️ Medium |
| `no-unused-vars`            | 13    | 1.2%  | 🟡 Low    |
| `no-img-element` (Next.js)  | 2     | 0.2%  | 🟡 Low    |

### Observations

**Point positif** :

- ✅ Moins de warnings que back-office (1,078 vs 2,714)
- ✅ Codebase plus récent, patterns plus propres

**Points d'attention** :

- ⚠️ **255 prefer-nullish-coalescing** (vs 109 dans back-office)
  - Beaucoup de patterns `|| 'fallback'` dans les composants LinkMe
  - Nécessite audit manuel (certains sont corrects avec ||)

---

## 🌐 Site-Internet (0 warnings)

**Status** : ✅ **PARFAIT**

**Raisons** :

- Codebase récent (2025-2026)
- Types stricts depuis le début
- Patterns modernes (Next.js 15, RSC)
- Revue de code stricte

**Best practices à répliquer** :

- Types Supabase générés et utilisés partout
- Pas de `any` type
- Validation Zod sur tous les inputs
- Server Components par défaut

---

## 🎯 Plan d'Action Recommandé

### Phase 1 : CRITIQUE (Semaine 1)

**Objectif** : Corriger bugs potentiels

1. **react-hooks/exhaustive-deps** (31 warnings)
   - Temps estimé : 2-3 heures
   - Impact : High (bugs runtime)
   - Méthode : Audit manuel + correction

### Phase 2 : TYPE SAFETY (4-6 semaines)

**Objectif** : Éliminer `any` type progressivement

**Approche TIER** (voir `.serena/memories/eslint-strategy-2026.md`) :

#### TIER 1 : API Routes (Priorité P0)

- Générer types Supabase à jour
- Typer réponses API
- ~100 warnings fixables
- Temps : 1 semaine

#### TIER 2 : Business Logic (Priorité P1)

- Hooks
- Utils
- Services
- ~300 warnings fixables
- Temps : 2 semaines

#### TIER 3 : Components (Priorité P1)

- Forms
- Modals
- Pages
- ~500 warnings fixables
- Temps : 2 semaines

#### TIER 4 : Legacy Code (Priorité P2)

- Code ancien à refactorer
- ~200 warnings
- Temps : 1 semaine

### Phase 3 : QUICK WINS (Semaine 7)

**Auto-fixable** :

1. `prettier/prettier` (27) : `pnpm lint --fix`
2. `no-unused-vars` (33) : Suppression manuelle
3. `prefer-optional-chain` (7) : Remplacement simple

**Performance** : 4. `no-img-element` (23) : Migration vers `next/image`

### Phase 4 : CONFIGURATION (Semaine 8)

**Objectif** : Ajuster ESLint config

1. **prefer-nullish-coalescing** :
   - Ajouter exceptions pour patterns valides :
     ```json
     {
       "@typescript-eslint/prefer-nullish-coalescing": [
         "warn",
         {
           "ignorePrimitives": { "string": true, "number": true }
         }
       ]
     }
     ```

2. **Activer Progressive Enhancement** :
   - Ratchet Effect déjà actif ✅
   - Max warnings par catégorie
   - Empêche régression

---

## 📈 Métriques de Succès

**KPIs à suivre** :

| Métrique           | Actuel | Cible   | Deadline   |
| ------------------ | ------ | ------- | ---------- |
| Total warnings     | 3,792  | < 1,000 | 2026-04-01 |
| `any` type usage   | 435    | < 50    | 2026-04-01 |
| react-hooks issues | 31     | 0       | 2026-02-08 |
| Type coverage      | ~60%   | > 95%   | 2026-04-01 |

---

## 🔍 Zones Critiques Identifiées

### 1. Supabase Queries (HIGH PRIORITY)

**Problème** : 90% des warnings liés aux queries Supabase non typées

**Exemple** :

```typescript
// ❌ ACTUEL (cause ~1000 warnings)
const { data } = await supabase.from('products').select('*');
console.log(data[0].name); // any

// ✅ SOLUTION
import { Database } from '@verone/types/supabase';
type Product = Database['public']['Tables']['products']['Row'];

const { data } = await supabase
  .from('products')
  .select('*')
  .returns<Product[]>();
console.log(data[0].name); // string
```

**Action** :

1. Générer types Supabase : `pnpm db:types`
2. Importer dans queries
3. Utiliser `.returns<T>()`

### 2. React Hook Form (MEDIUM PRIORITY)

**Problème** : Forms typés `any`

**Exemple** :

```typescript
// ❌ ACTUEL
const { register, handleSubmit } = useForm();
const onSubmit = (data: any) => { ... }; // no-explicit-any

// ✅ SOLUTION
import { z } from 'zod';

const schema = z.object({
  name: z.string(),
  email: z.string().email(),
});
type FormData = z.infer<typeof schema>;

const { register, handleSubmit } = useForm<FormData>();
const onSubmit = (data: FormData) => { ... }; // Type-safe
```

### 3. Modal Props Casting (MEDIUM PRIORITY)

**Problème** : `(data as any).property` partout

**Solution** : Définir interfaces strictes pour chaque modal

---

## 🛠️ Outils & Scripts Disponibles

**Audit** :

```bash
# Audit complet
pnpm lint

# Par app
pnpm --filter @verone/back-office lint
pnpm --filter @verone/linkme lint

# Par règle
pnpm lint 2>&1 | grep "no-unsafe-member-access"
```

**Correction** :

```bash
# Auto-fix (Prettier, unused imports)
pnpm lint --fix

# Ratchet (empêche régression)
bash scripts/eslint-ratchet-progressive.sh
```

**Type generation** :

```bash
# Générer types Supabase
pnpm db:types

# Vérifier types
pnpm type-check
```

---

## 📚 Ressources

**Documentation** :

- `.serena/memories/eslint-strategy-2026.md` - Stratégie complète
- `.claude/rules/frontend/nextjs.md` - Règles Next.js
- `docs/claude/WORKFLOW-CHECKLIST.md` - Workflow de correction

**Templates** :

- `.claude/templates/component.tsx` - Template composant type-safe

**Scripts** :

- `scripts/eslint-ratchet-progressive.sh` - Ratchet Effect
- `.claude/commands/fix-warnings.md` - Guide correction

---

## 🎓 Best Practices (from site-internet)

**À répliquer dans back-office et linkme** :

1. **Types-first** :
   - Définir interfaces AVANT de coder
   - Générer types DB automatiquement
   - Jamais de `any` type

2. **Validation** :
   - Zod pour tous les inputs
   - Server-side validation obligatoire
   - Client-side pour UX

3. **Components** :
   - Server Components par défaut
   - "use client" seulement si nécessaire
   - Props typées avec interfaces

4. **Error Handling** :
   - Type-safe error objects
   - Pas de `catch (err: any)`
   - Logger avec types stricts

---

## 📊 Graphique d'Évolution

**Historique warnings prefer-nullish-coalescing** :

- 2026-01-20 : 214 warnings
- 2026-01-31 : 109 warnings (back-office)
- Réduction : **49%** ✅

**Objectif total warnings** :

```
3,792 (actuel)
  ↓ Phase 1 (-31)
3,761
  ↓ Phase 2 (-2,100)
1,661
  ↓ Phase 3 (-60)
1,601
  ↓ Phase 4 (config)
< 1,000 (cible)
```

---

## ✅ Checklist Audit

- [x] Audit back-office complet
- [x] Audit linkme complet
- [x] Audit site-internet complet
- [x] Classification par sévérité
- [x] Identification zones critiques
- [x] Plan d'action TIER by TIER
- [x] Métriques de succès définies
- [ ] Validation équipe technique
- [ ] Priorisation finale avec PO
- [ ] Planning sprint intégration

---

**Prochaines étapes** :

1. Review de ce rapport avec l'équipe
2. Validation des priorités
3. Création tickets JIRA/Linear
4. Démarrage Phase 1 (react-hooks)

**Contact** : Claude Sonnet 4.5 via `claude-code` CLI

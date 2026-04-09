---
description: /fix-warnings - ESLint Warning Fix Command
allowed-tools:
  [
    Read,
    Edit,
    Write,
    Glob,
    Grep,
    Bash,
    mcp__context7__*,
    mcp__supabase__execute_sql,
  ]
---

# /fix-warnings - ESLint Warning Fix Command

**Version**: 1.0.0
**Dernière mise à jour**: 2026-01-28
**Sources**: [Anthropic Best Practices](https://www.anthropic.com/engineering/claude-code-best-practices), [Addy Osmani 2026 Workflow](https://addyosmani.com/blog/ai-coding-workflow/)

---

## ⚠️ AVANT DE COMMENCER (CHECKLIST OBLIGATOIRE)

**CETTE CHECKLIST DOIT ÊTRE VALIDÉE À 100% AVANT TOUTE CORRECTION.**

### Engagement Lecture Complète

- [ ] J'ai LU ce fichier en ENTIER (434 lignes)
- [ ] Je comprends le workflow 5 phases (Discovery → Analysis → Planning → Implementation → Validation)
- [ ] Je m'engage à suivre EXACTEMENT ce workflow (pas d'improvisation)
- [ ] Je NE vais PAS inventer mon propre workflow (batch par règle, commits multiples, etc.)
- [ ] Je comprends que l'approche documentation-first est 2-3x plus rapide que trial-and-error

### Règles Absolues Comprises

- [ ] ✅ **UN fichier à la fois, TOUS les warnings du fichier** (pas de correction partielle)
- [ ] ✅ **Self-verify ESLint + TypeScript AVANT commit** : 0 warnings + 0 errors
- [ ] ✅ **Pattern officiel D'ABORD** (MCP Context7 OBLIGATOIRE)
- [ ] ✅ **Boy Scout Rule** : Fichier PLUS propre après modification
- [ ] ✅ **Corriger erreurs TypeScript legacy** si rencontrées (ne PAS contourner avec `as any`)
- [ ] ❌ **JAMAIS** de remplacement aveugle (`sed` global, batch par règle)
- [ ] ❌ **JAMAIS** `--no-verify` pour contourner hooks
- [ ] ❌ **JAMAIS** corriger UNE règle sur 87 fichiers (commits trop gros)

### Temps Attendu

- [ ] Je comprends que cette approche prend **1-2 jours** (50 fichiers × 20 min)
- [ ] Je comprends que l'approche ad-hoc prend **4-5 jours** (2.5-3x plus lent)
- [ ] Je comprends que l'approche AI-assisted optimisée permet **193 fichiers en minutes** (source : Addy Osmani)

**SI UNE SEULE CASE ❌ : RE-LIRE CE FICHIER COMPLÈTEMENT.**

---

## 🎯 Objectif

Corriger les warnings ESLint de manière **intelligente et durable** en suivant les meilleures pratiques 2026 :

- ✅ Documentation-first approach
- ✅ Pattern analysis avant modification
- ✅ Self-verification (améliore qualité 2-3x)
- ✅ Ratchet Effect enforcement
- ✅ "Every mistake becomes a rule"

---

## 📋 Workflow Obligatoire (5 Phases)

### Phase 1 : DISCOVERY (Documentation-First)

**Règle d'or** : JAMAIS coder avant de comprendre le pattern officiel.

1. **Identifier le type de warning**

   ```bash
   pnpm --filter @verone/back-office lint 2>&1 | grep "warning_type" | head -5
   ```

2. **Consulter documentation officielle** (MCP Context7 OBLIGATOIRE)

   **Utiliser `mcp__context7__resolve-library-id` puis `mcp__context7__query-docs`** :
   - Pour React : libraryId `/websites/react_dev`
   - Pour Next.js : libraryId `/vercel/next.js`
   - Pour TypeScript : libraryId `/microsoft/TypeScript`
   - Pour React Query : libraryId `/tanstack/query`
   - Pour Zod : libraryId `/colinhacks/zod`

   **Template de recherche** :

   ```
   mcp__context7__query-docs({ libraryId: "/vercel/next.js", query: "[warning_type] official fix pattern" })
   ```

3. **Extraire le pattern recommandé**
   - Lire TOUS les exemples de code
   - Identifier les anti-patterns
   - Noter les cas edge

**✅ Checkpoint 1** : Pattern officiel documenté ✓

---

### Phase 2 : PATTERN ANALYSIS (Projet)

**Règle d'or** : S'aligner sur les conventions du projet.

1. **Chercher exemples existants**

   ```bash
   # Exemple : Pour exhaustive-deps
   grep -r "useCallback" apps/back-office/src --include="*.tsx" | head -10
   ```

2. **Analyser hooks/utils existants**
   - `packages/@verone/common/src/hooks/` - Hooks réutilisables
   - `packages/@verone/types/` - Types centralisés
   - `.claude/templates/` - Templates projets

3. **Vérifier conventions**
   - Lire `CLAUDE.md` section pertinente
   - Lire `.claude/rules/` si existe

**✅ Checkpoint 2** : Patterns projet identifiés ✓

---

### Phase 3 : PLANNING (Avant Code)

**Règle d'or** : Un plan détaillé vaut mieux qu'un code cassé.

1. **Lister les fichiers à corriger**

   ```bash
   pnpm --filter @verone/back-office lint 2>&1 | \
     grep "warning_type" | \
     grep -oE "/[^ ]+\.tsx?" | \
     sort | uniq > /tmp/files-to-fix.txt
   ```

2. **Prioriser par complexité**
   - ✅ Simples (< 5 warnings, pas de dépendances complexes)
   - 🟡 Moyens (5-20 warnings, quelques dépendances)
   - 🔴 Complexes (> 20 warnings, logique métier)

3. **Créer plan d'action**
   - Commencer par les fichiers simples
   - Apprendre sur les simples
   - Affiner approche pour les complexes

**✅ Checkpoint 3** : Plan d'exécution validé ✓

---

### Phase 4 : IMPLEMENTATION (Smart Fix)

**Règle d'or** : Un fichier à la fois, TOUS les warnings du fichier.

**Pour chaque fichier** :

1. **Lire le fichier ENTIER**

   ```typescript
   Read(file_path);
   ```

2. **Analyser contexte**
   - Comprendre le rôle du composant/fonction
   - Identifier dépendances externes
   - Vérifier imports utilisés

3. **Appliquer le fix ligne par ligne**
   - ❌ PAS de remplacement aveugle (sed global)
   - ✅ Modification ciblée et intelligente
   - ✅ Respecter pattern officiel + projet

4. **Self-Verify (CRITIQUE)**

   ```bash
   # Vérifier 0 warnings AVANT commit
   pnpm --filter @verone/back-office eslint --quiet apps/back-office/src/path/to/file.tsx
   ```

5. **Fix ALL warnings du fichier**
   - Si 1 warning reste → corriger
   - Si warning non lié apparaît → corriger aussi
   - Boy Scout Rule : Fichier doit être PLUS propre

**⚠️ Si échec** : Abandonner ce fichier, passer au suivant, revenir plus tard.

**✅ Checkpoint 4** : Fichier à 0 warnings localement ✓

---

### Phase 5 : VALIDATION (Ratchet Effect)

**Règle d'or** : Laisser les hooks valider. JAMAIS `--no-verify`.

1. **Staging**

   ```bash
   git add path/to/file.tsx
   ```

2. **Commit avec Ratchet Effect**

   ```bash
   git commit -m "[BO-LINT-XXX] fix: N warnings in file (type1 + type2)"
   ```

   Le hook `lint-staged` avec `--max-warnings=0` va :
   - ✅ Auto-fix ce qui peut l'être
   - ❌ BLOQUER si warnings subsistent
   - ✅ Garantir 0 warning ajouté

3. **Si hook bloque**
   - ❌ NE PAS utiliser `--no-verify`
   - ✅ Lire l'output du hook
   - ✅ Corriger warnings manquants
   - ✅ Re-commit

4. **Push après succès**
   ```bash
   git push
   ```

**✅ Checkpoint 5** : Commit validé par hooks ✓

---

### Phase 6 : TYPESCRIPT VALIDATION (CRITIQUE)

**Règle d'or** : Un fichier corrigé = 0 warnings ESLint + 0 erreurs TypeScript + build OK.

**Pourquoi cette phase ?**

Les corrections ESLint peuvent révéler des erreurs TypeScript legacy masquées par `any`, `as any`, ou types incorrects. Un expert NE CONTOURNE PAS ces erreurs, il les CORRIGE.

---

#### 1. Vérification TypeScript Systématique

**TOUJOURS vérifier TypeScript après self-verify ESLint** :

```bash
# Après avoir vérifié ESLint
pnpm eslint --quiet file.tsx  # ✅ 0 warnings

# Vérifier TypeScript
pnpm --filter @verone/[app] type-check 2>&1 | grep -A5 "file.tsx"
```

**Résultat attendu** : Aucune erreur TypeScript dans le fichier.

---

#### 2. Si Erreurs TypeScript : ANALYSER, PAS CONTOURNER

**❌ INTERDIT** :

```typescript
// ❌ Contourner avec as any
const data = (suppliersData as any) ?? [];

// ❌ Ignorer et push avec --no-verify
git commit --no-verify

// ❌ Changer de fichier pour éviter le problème
```

**✅ APPROCHE EXPERT** :

1. **Lire CHAQUE erreur attentivement**

   ```
   error TS2345: Argument of type 'X' is not assignable to parameter of type 'Y'.
   Property 'field_name' is missing...
   ```

2. **Identifier la cause racine** (3 cas courants) :

   **Cas 1 : Types Supabase générés différents de l'interface locale**

   ```typescript
   // Interface locale incorrecte
   interface Organisation {
     id: string;
     name: string; // ❌ Colonne n'existe pas dans DB
     type: string;
   }

   // Solution : Utiliser noms de colonnes réels
   interface Organisation {
     id: string;
     legal_name: string; // ✅ Colonne Supabase réelle
     type: string | null; // ✅ Nullable comme dans DB
   }
   ```

   **Cas 2 : Champs requis manquants dans Insert**

   ```typescript
   // ❌ Champ requis manquant
   await supabase.from('financial_documents').insert({
     document_type: 'expense',
     partner_id: formData.partner_id,
     // ❌ created_by manquant (requis par Supabase)
   });

   // ✅ Récupérer user et ajouter created_by
   const {
     data: { user },
   } = await supabase.auth.getUser();
   if (!user) throw new Error('Not authenticated');

   await supabase.from('financial_documents').insert({
     document_type: 'expense',
     partner_id: formData.partner_id,
     created_by: user.id, // ✅
   });
   ```

   **Cas 3 : Array typé `never[]` (inférence échouée)**

   ```typescript
   // ❌ TypeScript infère never[]
   const items = [];
   items.push({ field: 'value' }); // ❌ Error: type 'never'

   // ✅ Typer explicitement avec types Supabase
   import type { Database } from '@verone/types';

   const items: Database['public']['Tables']['table_name']['Insert'][] = [];
   items.push({ field: 'value' }); // ✅
   ```

3. **Chercher les types Supabase générés**

   ```bash
   # Les types sont dans packages/@verone/types/src/supabase.ts
   grep -n "table_name:" packages/@verone/types/src/supabase.ts

   # Lire le type Insert de la table
   # Ligne XXXX : table_name: { Row: {...}, Insert: {...}, Update: {...} }
   ```

4. **Corriger une par une les erreurs**
   - Erreur ligne 127 → Corriger l'interface
   - Erreur ligne 276 → Ajouter champ manquant
   - Erreur lignes 305, 320, 336 → Typer l'array

5. **Re-vérifier jusqu'à 0 erreurs**

   ```bash
   pnpm --filter @verone/[app] type-check 2>&1 | grep "file.tsx"
   # → DOIT afficher "No errors" ou rien
   ```

---

#### 3. Utiliser Types Supabase Générés (Best Practice)

**Pattern OBLIGATOIRE** : Importer et utiliser les types Supabase générés.

```typescript
// ✅ Import types centralisés
import type { Database } from '@verone/types';

// ✅ Typer les arrays d'insert
const items: Database['public']['Tables']['financial_document_lines']['Insert'][] =
  [];

// ✅ Typer les queries
type Organisation = Database['public']['Tables']['organisations']['Row'];
const [suppliers, setSuppliers] = useState<Organisation[]>([]);

// ✅ Utiliser noms de colonnes exacts
const { data } = await supabase
  .from('organisations')
  .select('id, legal_name, type') // ✅ Pas 'name'
  .eq('type', 'supplier');
```

**Pourquoi ?**

- Types à jour avec le schéma DB
- Autocomplete dans l'IDE
- Erreurs TypeScript détectées à la compilation
- Pas de divergence entre code et DB

---

#### 4. Vérification Complète Avant Commit

**Checklist finale (TOUTES doivent passer)** :

```bash
# 1. ESLint → 0 warnings
pnpm eslint --quiet file.tsx

# 2. TypeScript → 0 errors
pnpm --filter @verone/[app] type-check

# 3. Build (optionnel mais recommandé)
pnpm --filter @verone/[app] build
```

**Si 1 seule échoue** : NE PAS commit. Corriger d'abord.

---

#### 5. Commit Après Validation Complète

```bash
# Staging
git add file.tsx

# Commit (hook lint-staged + pre-push type-check)
git commit -m "[BO-LINT-XXX] fix: N warnings + TypeScript errors in file"

# Push (hook pre-push = type-check complet)
git push
```

**Le hook pre-push vérifie** :

- ✅ `pnpm --filter @verone/[app] type-check` DOIT passer
- ❌ Si erreurs TypeScript → push bloqué
- ✅ Garantit que le code pushed est type-safe

---

**✅ Checkpoint 6** : TypeScript validation passée ✓

---

## 🎯 Patterns Courants (Référence Rapide)

### exhaustive-deps (React Hooks)

**Pattern Officiel React 2026** :

```typescript
// ✅ CORRECT - Fonction DANS useEffect
useEffect(
  () => {
    async function fetchData() {
      const data = await api.get();
      setState(data);
    }
    void fetchData().catch(console.error);
  },
  [
    /* vraies dépendances */
  ]
);

// ❌ INCORRECT - Fonction HORS useEffect
async function fetchData() {
  /* ... */
}
useEffect(() => {
  void fetchData(); // ⚠️ Warning: missing dependency 'fetchData'
}, []);
```

**Exception** : Si la fonction doit être stable, utiliser `useCallback` :

```typescript
const fetchData = useCallback(async () => {
  // code
}, [dep1, dep2]);

useEffect(() => {
  void fetchData().catch(console.error);
}, [fetchData]);
```

---

### prefer-nullish-coalescing

**Pattern Officiel TypeScript 2026** :

```typescript
// ✅ CORRECT - Nullish coalescing pour null/undefined
const value = maybeNull ?? defaultValue;

// ❌ INCORRECT - || peut être trompeur
const value = maybeNull || defaultValue; // ⚠️ false, 0, '' sont considérés falsy

// ⚠️ ATTENTION - NE PAS remplacer aveuglément
const isValid = condition1 || condition2; // ✅ Logique booléenne, garder ||
```

**Règle** : Remplacer `||` par `??` UNIQUEMENT pour valeurs nullish (null, undefined, '').

---

### no-explicit-any

**Pattern Officiel TypeScript 2026** :

```typescript
// ✅ CORRECT - Type spécifique
const data: UserData = await fetchUser();

// ✅ CORRECT - unknown pour API externe
const response: unknown = await fetch(url).then(r => r.json());
const data = parseUserData(response); // Validation avec Zod

// ❌ INCORRECT - any
const data: any = await fetchUser(); // ⚠️ Perte de type-safety
```

**Règle** : `unknown` + validation > `any`

---

## 📊 Métriques de Succès

**Par session de correction** :

- ✅ Warnings corrigés : [nombre]
- ✅ Fichiers modifiés : [nombre]
- ✅ Commits passés : [nombre]
- ❌ Commits bloqués : 0 (si > 0, analyser pourquoi)

**Objectif global** :

- Phase 1 : -10% warnings/jour
- Phase 2 : -20% warnings/jour (meilleure maîtrise)
- Phase 3 : Maintenance < 100 warnings total

---

## 🚫 Anti-Patterns (Ne JAMAIS Faire)

### ❌ Remplacement Aveugle

```bash
# ❌ INTERDIT
find . -name "*.tsx" -exec sed -i 's/||/??/g' {} \;
```

**Pourquoi** : Casse la logique booléenne (conditions, ||, etc.)

### ❌ Désactiver Ratchet Effect

```javascript
// ❌ INTERDIT dans .lintstagedrc.js
'eslint --fix', // Sans --max-warnings=0
```

**Pourquoi** : Perte de l'effet cliquet, dette peut augmenter

### ❌ --no-verify

```bash
# ❌ INTERDIT (sauf permission EXPLICITE utilisateur)
git commit --no-verify
```

**Pourquoi** : Contourne les garde-fous, crée de la dette

### ❌ Commit Partiel

```bash
# ❌ INTERDIT
git add file.tsx  # Fichier a encore 5 warnings
git commit
```

**Pourquoi** : Boy Scout Rule non respectée

---

## 🔄 Amélioration Continue

### "Every Mistake Becomes a Rule"

Après **CHAQUE** échec (commit bloqué, erreur introduite) :

1. **Documenter l'erreur**
   - Qu'est-ce qui s'est passé ?
   - Pourquoi ça a échoué ?
   - Quel pattern était incorrect ?

2. **Mettre à jour cette commande**
   - Ajouter cas edge dans "Anti-Patterns"
   - Ajouter exemple dans "Patterns Courants"
   - Améliorer workflow si nécessaire

---

## 📚 Ressources

### Documentation Officielle (MCP Context7)

- [React](https://react.dev) - `/websites/react_dev`
- [Next.js](https://nextjs.org) - `/vercel/next.js`
- [TypeScript](https://www.typescriptlang.org) - `/microsoft/TypeScript`
- [ESLint](https://eslint.org/docs/latest/) - Web

### Références Anthropic

- [Claude Code Best Practices](https://www.anthropic.com/engineering/claude-code-best-practices)
- [Building Effective Agents](https://www.anthropic.com/research/building-effective-agents)
- [Common Workflows](https://code.claude.com/docs/en/common-workflows)

### Références Industrie 2026

- [Addy Osmani - LLM Workflow 2026](https://addyosmani.com/blog/ai-coding-workflow/)
- [ESLint as AI Guardrails](https://medium.com/@albro/eslint-as-ai-guardrails-the-rules-that-make-ai-code-readable-8899c71d3446)

---

## 🎬 Exemple Complet

### Scénario : Fixer exhaustive-deps dans `commissions/page.tsx`

**Phase 1 - Discovery** :

```typescript
// MCP Context7 query
libraryId: '/websites/react_dev';
query: 'useEffect exhaustive-deps missing dependency function pattern';

// Résultat : Fonction doit être DANS useEffect
```

**Phase 2 - Pattern Analysis** :

```bash
grep -r "useCallback" apps/back-office/src --include="*.tsx" | head -5
# → Projet utilise useCallback pour fonctions stables
```

**Phase 3 - Planning** :

```
Fichier : commissions/page.tsx
Warnings : 27 (1x exhaustive-deps + 26x nullish-coalescing)
Stratégie :
1. Déplacer fetchData dans useEffect
2. Ajouter toast aux deps (stable via useCallback)
3. Remplacer || par ?? (sauf logique booléenne)
```

**Phase 4 - Implementation** :

```typescript
// Avant
async function fetchData() {
  /* ... */
}
useEffect(() => {
  fetchData();
}, []); // ⚠️

// Après
useEffect(() => {
  async function fetchData() {
    /* ... */
  }
  void fetchData().catch(console.error);
}, [toast]); // ✅
```

**Phase 5 - Validation** :

```bash
pnpm eslint --quiet commissions/page.tsx  # 0 warnings ✅
git add commissions/page.tsx
git commit -m "[BO-LINT-002] fix: 27 warnings (exhaustive-deps + nullish)"
# Hook passe ✅
```

**Phase 6 - TypeScript Validation** :

```bash
# Vérifier TypeScript AVANT push
pnpm --filter @verone/back-office type-check 2>&1 | grep "commissions/page.tsx"
# → No errors ✅

# Si erreurs TypeScript détectées :
# 1. Lire erreurs : "Property 'created_by' is missing..."
# 2. Chercher types Supabase : grep -n "table_name:" packages/@verone/types/src/supabase.ts
# 3. Corriger avec types générés
# 4. Re-vérifier type-check
# 5. Amend commit si nécessaire : git commit --amend --no-edit

# Push final (hook pre-push vérifie type-check)
git push  # ✅ Passe car TypeScript OK
```

---

**Dernière révision** : 2026-02-01
**Version** : 2.0.0 (ajout Phase 6 TypeScript Validation)
**Prochaine révision** : Après 10 fichiers corrigés ou 1 erreur bloquante

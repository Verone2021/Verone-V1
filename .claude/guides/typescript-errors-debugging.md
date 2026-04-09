# Guide Audit : Déboguer Erreurs TypeScript

**Version** : 1.0.0
**Date** : 2026-02-01
**Contexte** : Que faire quand bloqué sur des erreurs TypeScript après corrections ESLint

---

## 🎯 Objectif

Ce guide documente le **workflow expert** pour diagnostiquer et corriger les erreurs TypeScript, en particulier celles révélées après corrections ESLint (suppression de `any`, typage strict, etc.).

---

## 📋 Workflow Audit TypeScript (7 Étapes)

### Étape 1 : IDENTIFIER - Lister Toutes les Erreurs

**Commande** :

```bash
pnpm --filter @verone/[app] type-check 2>&1 | tee typescript-errors.log
```

**Analyse** :

- Compter le nombre d'erreurs : `grep "error TS" typescript-errors.log | wc -l`
- Grouper par fichier : `grep "error TS" typescript-errors.log | cut -d: -f1 | sort | uniq -c`
- Grouper par type d'erreur : `grep "error TS" typescript-errors.log | grep -o "TS[0-9]*" | sort | uniq -c`

**Sortie attendue** :

```
5 errors found:
  - 2 × TS2345 (Type 'X' is not assignable to 'Y')
  - 2 × TS2769 (No overload matches this call)
  - 1 × TS2339 (Property does not exist)
```

---

### Étape 2 : CATEGORISER - Identifier la Cause Racine

**3 catégories d'erreurs TypeScript courantes** :

#### A. Types Supabase Divergents

**Symptômes** :

```
error TS2345: Argument of type '{ id: string; name: string }[]'
is not assignable to parameter of type 'Organisation[]'.
  Property 'name' does not exist on type 'Organisation'.
```

**Cause** : Interface locale utilise des noms de colonnes qui n'existent pas dans la DB Supabase.

**Solution** : Utiliser les types Supabase générés.

---

#### B. Champs Requis Manquants

**Symptômes** :

```
error TS2769: No overload matches this call.
  Property 'created_by' is missing in type {...} but required in type {...}
```

**Cause** : Le type `Insert` Supabase définit certains champs comme requis (`field: Type` sans `?`).

**Solution** : Ajouter les champs manquants (récupérer `user.id` pour `created_by`, etc.).

---

#### C. Types Inférés Incorrects

**Symptômes** :

```
error TS2345: Argument of type '{ field: string }'
is not assignable to parameter of type 'never'.
```

**Cause** : Array déclaré comme `const items = []` est inféré comme `never[]`.

**Solution** : Typer explicitement l'array avec le type Supabase.

---

### Étape 3 : CHERCHER - Localiser Types Supabase

**Fichier central** : `packages/@verone/types/src/supabase.ts`

**Commandes utiles** :

```bash
# Trouver une table spécifique
grep -n "nom_table:" packages/@verone/types/src/supabase.ts

# Exemple : organisations à la ligne 4828
# Lire le type complet
sed -n '4828,4950p' packages/@verone/types/src/supabase.ts

# Voir le type Insert
grep -A50 "nom_table:" packages/@verone/types/src/supabase.ts | grep -A30 "Insert:"
```

**Informations à extraire** :

1. **Row** : Colonnes existantes (ce qui est stocké en DB)
2. **Insert** : Colonnes requises pour insertion (champs requis = sans `?`)
3. **Update** : Colonnes modifiables

---

### Étape 4 : COMPARER - Interface Locale vs Supabase

**Exemple concret** :

**Interface locale** (dans le fichier .tsx) :

```typescript
interface Organisation {
  id: string;
  name: string; // ❌ Colonne n'existe pas
  type: string; // ❌ Devrait être nullable
}
```

**Type Supabase généré** :

```typescript
organisations: {
  Row: {
    id: string;
    legal_name: string; // ✅ Nom réel
    trade_name: string | null;
    type: 'supplier' | 'customer' | 'partner' | null; // ✅ Nullable
    // ... 50 autres champs
  }
}
```

**Divergences identifiées** :

1. `name` n'existe pas → utiliser `legal_name`
2. `type` est nullable → ajouter `| null`
3. SELECT doit demander `legal_name` au lieu de `name`

---

### Étape 5 : CORRIGER - Appliquer les Fixes

**Fix 1 : Mettre à jour l'interface**

```typescript
interface Organisation {
  id: string;
  legal_name: string; // ✅ Nom correct
  type: string | null; // ✅ Nullable
}
```

**Fix 2 : Mettre à jour le SELECT**

```typescript
// Avant
const { data } = await supabase.from('organisations').select('id, name, type'); // ❌

// Après
const { data } = await supabase
  .from('organisations')
  .select('id, legal_name, type'); // ✅
```

**Fix 3 : Mettre à jour l'UI**

```typescript
// Avant
{
  suppliers.map(s => <div>{s.name}</div>);
}

// Après
{
  suppliers.map(s => <div>{s.legal_name}</div>);
}
```

---

### Étape 6 : VERIFIER - Type-Check Itératif

**Workflow** :

1. Corriger UNE erreur
2. Re-run type-check
3. Vérifier que l'erreur a disparu
4. Passer à l'erreur suivante

```bash
# Boucle de correction
pnpm --filter @verone/[app] type-check 2>&1 | grep "file.tsx"

# Corriger erreur 1
# ...

pnpm --filter @verone/[app] type-check 2>&1 | grep "file.tsx"
# → 1 erreur en moins ✅

# Corriger erreur 2
# ...

pnpm --filter @verone/[app] type-check 2>&1 | grep "file.tsx"
# → 0 erreurs ✅
```

**Ne PAS** :

- ❌ Corriger toutes les erreurs en une fois puis vérifier
- ❌ Espérer que tout passe du premier coup
- ❌ Utiliser `as any` pour contourner

---

### Étape 7 : DOCUMENTER - Créer Mémoire si Pattern Récurrent

**Si le même problème se répète** (ex: 5 fichiers utilisent `name` au lieu de `legal_name`) :

```bash
# Créer mémoire Serena
cat > .serena/memories/supabase-organisations-columns.md <<EOF
# Supabase Organisations - Colonnes Réelles

**Table** : organisations
**Colonne name** : ❌ N'EXISTE PAS
**Colonnes correctes** :
- legal_name (string) - Raison sociale
- trade_name (string | null) - Nom commercial

**Pattern** :
\`\`\`typescript
// ❌ INCORRECT
.select('id, name, type')

// ✅ CORRECT
.select('id, legal_name, type')
\`\`\`

**Fichiers corrigés** :
- expense-form.tsx (2026-02-01)
- ...
EOF
```

---

## 🛠️ Outils de Diagnostic

### 1. Grep Patterns pour Détecter Problèmes

**Chercher `as any` restants** :

```bash
grep -rn "as any" apps/back-office/src --include="*.tsx"
```

**Chercher interfaces locales** :

```bash
grep -rn "^interface.*Organisation" apps/back-office/src --include="*.tsx"
```

**Chercher SELECTs avec colonnes suspectes** :

```bash
grep -rn "\.select.*name" apps/back-office/src --include="*.tsx"
```

---

### 2. Validation Automatique

**Script de vérification** :

```bash
#!/bin/bash
# scripts/verify-typescript.sh

echo "🔍 Vérification TypeScript..."

pnpm --filter @verone/back-office type-check > /tmp/typescript-errors.log 2>&1

ERRORS=$(grep "error TS" /tmp/typescript-errors.log | wc -l)

if [ "$ERRORS" -eq 0 ]; then
  echo "✅ 0 erreurs TypeScript"
  exit 0
else
  echo "❌ $ERRORS erreurs TypeScript détectées"
  cat /tmp/typescript-errors.log
  exit 1
fi
```

---

## 📊 Métriques de Succès

**Avant corrections** :

```
src/components/forms/expense-form.tsx(127,20): error TS2345
src/components/forms/expense-form.tsx(276,10): error TS2769
src/components/forms/expense-form.tsx(305,24): error TS2345
src/components/forms/expense-form.tsx(320,24): error TS2345
src/components/forms/expense-form.tsx(336,22): error TS2345

5 errors found
```

**Après corrections** :

```
✅ No TypeScript errors in expense-form.tsx
```

**Temps expert** : 15-20 minutes pour 5 erreurs (pattern identifié + corrigé)

---

## 🎓 Leçons Apprises

### Pattern 1 : Types Supabase Divergents

**Problème** : 90% des erreurs TypeScript viennent de types locaux incorrects.

**Solution** : TOUJOURS importer et utiliser `Database` de `@verone/types`.

```typescript
// ✅ MEILLEURE PRATIQUE
import type { Database } from '@verone/types';

type Organisation = Database['public']['Tables']['organisations']['Row'];
const [suppliers, setSuppliers] = useState<Organisation[]>([]);
```

---

### Pattern 2 : Champs Requis Manquants

**Problème** : Supabase génère des types stricts (`created_by: string` sans `?`).

**Solution** : Lire le type `Insert` pour identifier TOUS les champs requis.

```bash
# Vérifier quels champs sont requis
grep -A50 "financial_documents:" packages/@verone/types/src/supabase.ts | grep -A30 "Insert:"
# → created_by: string (requis, sans ?)
```

---

### Pattern 3 : Never[] Inference

**Problème** : `const items = []` → TypeScript infère `never[]`.

**Solution** : Typer explicitement avec type Supabase Insert.

```typescript
// ✅ CORRECT
const items: Database['public']['Tables']['financial_document_lines']['Insert'][] =
  [];
```

---

## 🔗 Ressources

- **Types Supabase générés** : `packages/@verone/types/src/supabase.ts`
- **Workflow fix-warnings** : `.claude/commands/fix-warnings.md` (Phase 6)
- **Workflow expert** : `.claude/guides/expert-workflow.md`

---

**Auteur** : Claude Code (Expert Mentor Mode)
**Dernière mise à jour** : 2026-02-01
**Prochaine révision** : Après 20 fichiers corrigés

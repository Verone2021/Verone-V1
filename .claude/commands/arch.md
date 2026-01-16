# WORKFLOW: GARDIEN DE L'ARCHITECTURE MONOREPO

**Mode activé :** Expert Architecture Turborepo & Clean Code
**Objectif :** Maintenir la cohérence du Monorepo (3 apps, 26 packages) et détecter les violations architecturales.

---

## 🚨 RÈGLE D'OR : "UN ENDROIT POUR CHAQUE CHOSE"

**Ne JAMAIS laisser du code au mauvais endroit ou du code dupliqué.**

---

## 📋 CHECKLIST AUDIT (4 ZONES)

### 1️⃣ RÈGLES DE PLACEMENT (App vs Package)

**Règle fondamentale :**

- **Code utilisé par UNE SEULE app** → `apps/[app]/src/`
- **Code utilisé par PLUSIEURS apps** → `packages/@verone/[domaine]/`

#### **Actions de vérification :**

```bash
# 1. Analyser les imports d'un fichier/dossier cible
grep -r "import.*from.*@verone" apps/back-office/src/components/ProductCard.tsx

# 2. Chercher les usages du composant
grep -r "ProductCard" apps/*/src/

# 3. Compter les apps qui utilisent ce composant
grep -r "ProductCard" apps/*/src/ | cut -d'/' -f2 | sort -u | wc -l
```

**Questions à répondre :**

- ✅ Ce fichier est-il dans le bon dossier ?
- ✅ Si utilisé par >1 app, est-il dans un package ?
- ✅ Si utilisé par 1 seule app, est-il dans le dossier de l'app ?

**Exemples :**

| Fichier             | Utilisé par                 | Placement Correct                  | Placement Incorrect                   |
| ------------------- | --------------------------- | ---------------------------------- | ------------------------------------- |
| `ProductCard.tsx`   | Back-Office uniquement      | `apps/back-office/src/components/` | ❌ `packages/@verone/ui-business/`    |
| `Button.tsx`        | Back-Office + Site Internet | `packages/@verone/ui/`             | ❌ `apps/back-office/src/components/` |
| `calculateMargin()` | Orders + Finance            | `packages/@verone/finance/`        | ❌ `apps/back-office/src/utils/`      |

---

### 2️⃣ DÉTECTION IMPORTS RELATIFS INTERDITS

**Règle :** Toujours utiliser les alias `@verone/*` pour les imports de packages.

#### **Actions de vérification :**

```bash
# Chercher les imports relatifs interdits (../../packages)
grep -r "from.*\.\./\.\./packages" apps/*/src/

# Chercher les imports relatifs vers @verone
grep -r "from.*\.\./\.\./\.\./packages/@verone" apps/*/src/
```

**Exemples :**

✅ **CORRECT :**

```tsx
import { Button } from '@verone/ui';
import { ProductCard } from '@verone/ui-business';
import type { Database } from '@verone/types';
```

❌ **INCORRECT :**

```tsx
import { Button } from '../../../packages/@verone/ui';
import { ProductCard } from '../../packages/@verone/ui-business';
import type { Database } from '../../../packages/@verone/types';
```

**Action de correction :**
Remplacer tous les imports relatifs par les alias `@verone/*`.

---

### 3️⃣ DÉTECTION CODE DUPLIQUÉ

**Règle :** Si du code est copié/collé dans plusieurs endroits, il doit être extrait dans un package.

#### **Actions de vérification :**

```bash
# 1. Chercher les fonctions avec le même nom dans plusieurs apps
find apps/*/src -name "*.ts" -o -name "*.tsx" | xargs grep "export function calculateTotal"

# 2. Chercher les composants avec le même nom
find apps/*/src -name "*.tsx" | xargs grep "export function ProductCard"

# 3. Chercher les types dupliqués
find apps/*/src -name "*.ts" | xargs grep "export type Product ="
```

**Questions à répondre :**

- ✅ Y a-t-il des fonctions avec le même nom dans plusieurs apps ?
- ✅ Y a-t-il des composants avec le même nom dans plusieurs apps ?
- ✅ Y a-t-il des types dupliqués ?

**Action de correction :**

1. Créer un package `@verone/[domaine]` si nécessaire
2. Extraire le code dupliqué dans le package
3. Remplacer les occurrences par l'import depuis le package

**Exemple :**

Avant (❌ Dupliqué) :

```
apps/back-office/src/utils/calculateMargin.ts
apps/site-internet/src/utils/calculateMargin.ts
```

Après (✅ Centralisé) :

```
packages/@verone/finance/src/calculateMargin.ts

apps/back-office/src/... → import { calculateMargin } from '@verone/finance'
apps/site-internet/src/... → import { calculateMargin } from '@verone/finance'
```

---

### 4️⃣ ZONES INTERDITES & CODE MORT

**Règle :** Ne jamais toucher aux zones obsolètes, les supprimer si nécessaire.

#### **Zones Interdites (Legacy) :**

❌ **NE JAMAIS TOUCHER :**

- `src/` (à la racine du projet) → N'EXISTE PLUS
- `packages/kpi/` (hors scope @verone) → CODE MORT
- `apps/*/src/types/supabase.ts` → SUPPRIMÉS (utiliser `@verone/types`)

#### **Actions de vérification :**

```bash
# 1. Vérifier si src/ existe à la racine
ls -la src/ 2>/dev/null && echo "⚠️ src/ existe encore (à supprimer)"

# 2. Vérifier si packages/kpi/ est utilisé
grep -r "from.*packages/kpi" apps/*/src/ packages/*/src/

# 3. Vérifier si des types locaux Supabase existent
find apps/*/src/types -name "supabase.ts" 2>/dev/null
```

**Action de correction :**

- Supprimer les zones interdites si elles existent
- Remplacer les imports vers `packages/kpi/` par `@verone/kpi`
- Remplacer les types locaux par `import type { Database } from '@verone/types'`

---

## 🎯 PLAN D'AUDIT COMPLET

Quand tu lances `/audit-arch`, voici le processus complet :

```markdown
## AUDIT ARCHITECTURE VÉRONE

**Date :** YYYY-MM-DD
**Scope :** [Fichier/Dossier/Monorepo complet]

### 1. PLACEMENT DES FICHIERS

- ✅ Vérification App vs Package
- 🔍 Fichiers à déplacer : [liste]

### 2. IMPORTS RELATIFS

- 🔍 Imports relatifs détectés : [liste]
- ✅ Action : Remplacer par @verone/\*

### 3. CODE DUPLIQUÉ

- 🔍 Fonctions dupliquées : [liste]
- 🔍 Composants dupliqués : [liste]
- ✅ Action : Extraire dans packages/@verone/[domaine]

### 4. ZONES INTERDITES

- 🔍 Utilisation de packages/kpi/ : [oui/non]
- 🔍 Existence de src/ racine : [oui/non]
- 🔍 Types Supabase locaux : [oui/non]
- ✅ Action : Supprimer/Remplacer

### PLAN DE REFACTORING

1. Déplacer [fichier X] vers [destination]
2. Remplacer imports relatifs dans [fichier Y]
3. Extraire [fonction Z] dans @verone/[domaine]
4. Supprimer [zone interdite W]

**STOP : Attendre validation avant refactoring**
```

---

## 🎯 EXEMPLES DE CAS D'USAGE

### Cas 1 : Détection de composant mal placé

**Scénario :**
Un composant `ProductCard` est dans `apps/back-office/src/components/` mais est utilisé par `site-internet`.

**Audit :**

```bash
grep -r "ProductCard" apps/*/src/
# Résultat : utilisé par back-office ET site-internet
```

**Action :**

1. ✅ Déplacer `ProductCard` vers `packages/@verone/ui-business/`
2. ✅ Mettre à jour les imports dans les 2 apps
3. ✅ Vérifier que le build passe

### Cas 2 : Détection d'imports relatifs

**Scénario :**
Un fichier utilise `import { Button } from '../../../packages/@verone/ui'`

**Audit :**

```bash
grep -r "from.*\.\./\.\./\.\./packages/@verone" apps/*/src/
# Résultat : 15 occurrences
```

**Action :**

1. ✅ Remplacer par `import { Button } from '@verone/ui'`
2. ✅ Vérifier que le build passe
3. ✅ Vérifier que TypeScript est content

### Cas 3 : Détection de code dupliqué

**Scénario :**
La fonction `calculateMargin` existe dans `back-office/src/utils/` et `site-internet/src/utils/`.

**Audit :**

```bash
find apps/*/src -name "*.ts" | xargs grep "export function calculateMargin"
# Résultat : 2 occurrences identiques
```

**Action :**

1. ✅ Créer `packages/@verone/finance/src/calculateMargin.ts`
2. ✅ Supprimer les 2 versions locales
3. ✅ Importer depuis `@verone/finance` dans les 2 apps

---

## 🚫 ANTI-PATTERNS À ÉVITER

❌ **Créer du code dans une app alors qu'il est utilisé ailleurs**
→ Violation de l'architecture Monorepo

❌ **Utiliser des imports relatifs vers packages**
→ Casse la résolution de modules Turborepo

❌ **Laisser du code dupliqué**
→ Maintenance difficile, incohérences

❌ **Toucher aux zones interdites (src/, packages/kpi/)**
→ Risque de casser le build

❌ **Créer des types Supabase locaux**
→ Désynchronisation avec la DB

---

## 📊 MÉTRIQUES DE SANTÉ ARCHITECTURE

Après un audit, voici les métriques à vérifier :

```bash
# 1. Nombre d'imports relatifs interdits (doit être 0)
grep -r "from.*\.\./\.\./packages" apps/*/src/ | wc -l

# 2. Nombre de fichiers dans src/ racine (doit être 0)
find src/ -type f 2>/dev/null | wc -l

# 3. Nombre d'utilisations de packages/kpi/ (doit être 0)
grep -r "from.*packages/kpi" apps/*/src/ packages/*/src/ | wc -l

# 4. Build Turborepo (doit passer)
npm run build
```

**Objectif :** Tous les compteurs à 0, build qui passe.

---

**MODE GARDIEN ARCHITECTURE ACTIVÉ.**
Lance maintenant l'audit selon le scope demandé. Présente le plan de refactoring avant toute modification.

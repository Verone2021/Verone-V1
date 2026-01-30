# Verone Back Office - Instructions Claude

CRM/ERP modulaire pour décoration et mobilier d'intérieur haut de gamme.

---

## AVANT DE COMMENCER (OBLIGATOIRE)

**Consulter SYSTEMATIQUEMENT:**

1. **Credentials**: `.serena/memories/` → Chercher `*-credentials-*.md`
2. **Context metier**: `docs/current/serena/INDEX.md`
3. **Database**: `.mcp.env` → DATABASE_URL
4. **Supabase Cloud**: `.serena/memories/supabase-*.md` → OBLIGATOIRE avant toute migration

**Voir `AGENTS.md` pour instructions detaillees.**

**Regle d'or:** JAMAIS inventer credentials. TOUJOURS chercher dans `.serena/memories/`.

**📚 Documentation Scripts & Commandes**: `docs/claude/SCRIPTS-AND-COMMANDS.md` → Liste COMPLETE de tous les scripts npm, scripts shell, commandes slash, et agents disponibles.

---

## 🌐 MCP Browser (Playwright)

**Configuration**: Playwright MCP actif avec 2 lanes parallèles.

### Commandes Disponibles

| Action                   | Commande                                             |
| ------------------------ | ---------------------------------------------------- |
| Vérifier erreurs console | `browser_console_messages({ onlyErrors: true })`     |
| Screenshot rapide        | `browser_take_screenshot({ filename: "nom.png" })`   |
| Snapshot UI              | `browser_snapshot()` (préférer au screenshot)        |
| Naviguer                 | `browser_navigate({ url: "http://localhost:3002" })` |
| Cliquer élément          | `browser_click({ selector: "#btn-submit" })`         |

### Bonnes Pratiques

1. **Logs DEBUG**: Utiliser `LOG_LEVEL=debug pnpm dev` pour activer
2. **Screenshots**: Nettoyage auto `.playwright-mcp/` (fichiers > 1 jour)
3. **Console**: Utiliser `onlyErrors: true` pour vérifications rapides (éviter 25000+ tokens)

**Documentation**: `docs/current/serena/mcp-browser-revolution-2025.md`

---

## Commandes

```bash
pnpm dev             # Dev (localhost:3000)
pnpm build           # Production build
pnpm type-check      # TypeScript validation
pnpm lint            # ESLint validation
pnpm lint:fix        # ESLint auto-fix
```

### 🛡️ Prévention ESLint (Automatique)

**Protection 3 couches** (Phase 0 implémentée ✅) :

1. **Pre-commit Hook** (Husky + lint-staged)
   - Valide fichiers modifiés uniquement
   - Bloque si ERREURS (bugs async)
   - Tolère WARNINGS (type-safety)

2. **Configuration ESLint**
   - Règles async = ERROR (no-floating-promises, no-misused-promises)
   - Règles type-safety = WARN (migration graduelle)

3. **CI/CD** (GitHub Actions)
   - Valide chaque PR
   - Bloque merge si erreurs

**Documentation complète** : `docs/current/eslint-strategy-2026.md`

**État actuel** :

- 🔴 119 erreurs async (DOIT FIXER - bugs production)
- 🟡 1,946 warnings type-safety (tolérés, migration graduelle)

---

## 🚨 RÈGLE ABSOLUE - JAMAIS CONTOURNER LES HOOKS (CRITIQUE)

**INTERDICTION TOTALE ET DÉFINITIVE**

Claude **NE DOIT JAMAIS** :

- ❌ Désactiver les hooks (`chmod -x .husky/*`)
- ❌ Renommer les hooks (`.husky/pre-push.bak`)
- ❌ Utiliser `--no-verify` pour push (sauf permission EXPLICITE utilisateur)
- ❌ Utiliser `git push --force` sans que type-check passe

**Pourquoi cette règle est ABSOLUE** :

1. **Protection équipe** : Type-check garantit que PERSONNE ne pull du code cassé
2. **CI/CD** : Erreurs TypeScript = build échoue en production
3. **Historique Git** : Commits cassés polluent l'historique
4. **Confiance** : Hooks = dernière ligne de défense

**Approche CORRECTE si type-check bloque** :

1. ✅ **Corriger TOUTES les erreurs TypeScript** localement
2. ✅ **Tester** : `pnpm type-check` passe à 100%
3. ✅ **Push** : Le hook passe naturellement

**Cette règle a été violée le 2026-01-28. JAMAIS PLUS.**

---

## ⚠️ RÈGLES CRITIQUES - Erreurs Async (OBLIGATOIRE)

### 🎯 Les 3 Erreurs à NE JAMAIS Faire

Ces erreurs causent des bugs production silencieux (commandes perdues, données obsolètes, cache corrompu).

#### 1. Promesses Flottantes (no-floating-promises)

**❌ INTERDIT** - Promise lancée sans gestion d'erreur :

```typescript
onClick={() => {
  createOrder(orderData); // Promise ignorée - si ça échoue, aucune erreur visible
}}
```

**✅ OBLIGATOIRE** - Pattern void + .catch() :

```typescript
onClick={() => {
  void createOrder(orderData).catch((error) => {
    console.error('[Component] Order creation failed:', error);
    toast.error('Erreur lors de la création de la commande');
  });
}}
```

#### 2. Async dans Event Handlers (no-misused-promises)

**❌ INTERDIT** - Fonction async directe dans handler :

```typescript
<form onSubmit={handleSubmit}>  {/* handleSubmit est async */}
```

**✅ OBLIGATOIRE** - Wrapper avec void + .catch() :

```typescript
<form onSubmit={(e) => {
  void handleSubmit(e).catch(error => {
    console.error('[Form] Submit failed:', error);
  });
}}>
```

#### 3. React Query invalidateQueries sans await

**❌ INTERDIT** - invalidateQueries sans await :

```typescript
const mutation = useMutation({
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['orders'] }); // Promise ignorée
    // L'UI peut s'afficher AVANT que le cache soit invalidé = données obsolètes
  },
});
```

**✅ OBLIGATOIRE** - onSuccess async avec await :

```typescript
const mutation = useMutation({
  onSuccess: async () => {
    await queryClient.invalidateQueries({ queryKey: ['orders'] });
    toast.success('Commande créée avec succès');
  },
  onError: error => {
    console.error('[Mutation] Failed:', error);
    toast.error('Une erreur est survenue');
  },
});
```

### 📝 Checklist Avant Commit

Avant **CHAQUE** commit :

```bash
# 1. Type-check DOIT passer
pnpm type-check

# 2. Build DOIT passer
pnpm build

# 3. ESLint 0 ERREUR (warnings tolérés)
pnpm lint | grep "error"  # Doit afficher 0 errors
```

**Si ESLint bloque** : Corriger TOUTES les erreurs avant de commit.

### 🎨 Template Composant

**AVANT de créer un nouveau composant** :

1. **Copier le template** : `.claude/templates/component.tsx`
2. **Chercher l'existant** : Glob `**/*{nom-similaire}*.tsx`
3. **Vérifier les packages** : @verone/ui, @verone/customers, etc.
4. **Suivre les patterns** : ButtonV2, useMutation, toast

Le template contient **TOUS** les patterns async corrects (event handlers, React Query, custom hooks).

**Documentation complète** : Voir `.claude/templates/component.tsx` (header comments)

### Tests E2E

**Guide rapide**: `packages/e2e-linkme/QUICKSTART.md` 📖

```bash
# Démarrer apps (un seul terminal - Turborepo démarre tout)
pnpm dev

# Lancer tests E2E LinkMe (depuis root OU depuis packages/e2e-linkme)
cd packages/e2e-linkme
pnpm test:e2e

# Mode UI pour déboguer
pnpm test:e2e:ui

# Voir le guide complet
cat packages/e2e-linkme/QUICKSTART.md
```

---

## 🔄 Workflow de Développement (5 Étapes)

### Méthodologie Standard

**TOUJOURS suivre cet ordre** :

📋 **Checklist détaillée** : `docs/claude/WORKFLOW-CHECKLIST.md`

#### 1. 🔍 RESEARCH (Comprendre l'existant)

Lire fichiers pertinents SANS coder :

- Comprendre architecture actuelle
- Identifier patterns existants
- Localiser fichiers critiques

**Outils** : Glob, Grep, Read, Serena (symbolic search)

#### 2. 📝 PLAN (Concevoir la solution)

Créer plan détaillé AVANT de coder :

- Utiliser EnterPlanMode ou `/plan` pour tasks complexes
- Recommander LA meilleure solution (pas d'options multiples)
- Identifier edge cases et risques

**Outils** : EnterPlanMode, AskUserQuestion (pour clarifications)

#### 3. 🧪 TEST (TDD si applicable)

Écrire tests AVANT le code (quand pertinent) :

```bash
npm run test:e2e          # Tests E2E avec Playwright
npm run type-check        # Validation TypeScript
```

**Pattern TDD** : RED (test échoue) → GREEN (code minimal) → REFACTOR

> "TDD est un superpower quand on travaille avec des AI agents" — Kent Beck

#### 4. ⚙️ EXECUTE (Implémenter le minimum)

Coder en suivant le plan :

- Suivre patterns existants
- Minimum nécessaire (pas de sur-engineering)
- Commits petits et fréquents (save points)

#### 5. ✅ VERIFY (Valider)

Valider à chaque modification :

```bash
npm run type-check        # TypeScript sans erreurs
npm run build             # Build production réussit
npm run e2e:smoke         # Tests UI si modification frontend
```

##### 🎯 Build Sélectif (OBLIGATOIRE)

**❌ INTERDIT** : `pnpm build` (build tout le monorepo = 3-5 minutes)

**✅ OBLIGATOIRE** : Build avec filtre Turborepo (30-60 secondes)

```bash
# Identifier le package actuel (ex: back-office)
pnpm --filter @verone/back-office build
pnpm --filter @verone/back-office type-check

# LinkMe
pnpm --filter @verone/linkme build

# Site Internet
pnpm --filter @verone/site-internet build
```

**Packages disponibles** :

- `@verone/back-office` (port 3000)
- `@verone/linkme` (port 3002)
- `@verone/site-internet` (port 3001)
- `@verone/ui`, `@verone/types`, etc.

**Exception** : Build complet UNIQUEMENT si :

- Changement dans `@verone/types` ou `@verone/ui`
- PR finale (vérification complète)
- Demande explicite utilisateur

📖 **Règle complète** : `.claude/rules/dev/build-commands.md`

#### 🔧 Correction ESLint (Si warnings détectés)

**Workflow `/fix-warnings`** : Si ESLint détecte des warnings, utiliser le workflow intelligent :

📖 **Documentation complète** : `.claude/commands/fix-warnings.md`

**Approche 2026 (Documentation-First)** :

1. **Discovery** : Consulter docs officielles (MCP Context7) pour pattern correct
2. **Analysis** : Chercher patterns existants dans le projet
3. **Planning** : Prioriser fichiers simples → complexes
4. **Fix** : Un fichier à la fois, TOUS les warnings du fichier
5. **Validate** : Ratchet Effect (--max-warnings=0) valide automatiquement

**Règles strictes** :

- ❌ Jamais de remplacement aveugle (`sed` global)
- ❌ Jamais `--no-verify` pour contourner hooks
- ✅ Pattern officiel (React, Next.js, TypeScript) d'abord
- ✅ Boy Scout Rule : Fichier plus propre après modification

---

### Actions Git (après VERIFY réussi)

**COMMIT** - Sauvegardes fréquentes sur feature branch :

```bash
git commit -m "[APP-DOMAIN-NNN] step: description"
git push  # Backup + CI check
```

**PR** - Une seule PR à la fin de la feature :

```bash
gh pr create --title "[APP-DOMAIN-NNN] feat: description"
```

**Règle d'or** : 1 feature = 1 branche = N commits = **1 PR**

**Source** : [Claude Code: Best practices for agentic coding](https://www.anthropic.com/engineering/claude-code-best-practices)

---

## 🧱 RÈGLES UI & COMPOSANTS (STRICT)

**INTERDICTION FORMELLE DE CRÉER DES DOUBLONS.**

Avant de créer un fichier `.tsx` :

### 1. SCANNER (Obligatoire)

Chercher dans `packages/@verone/ui/**` et `components/**` :

```bash
# Rechercher composant existant
find packages/@verone/ui -name "*Button*" -type f
grep -r "export.*Button" packages/@verone/ui/src

# Utiliser Glob tool pour recherche pattern
# Utiliser Grep tool pour recherche dans contenu
```

### 2. RÉUTILISER (Si existe)

```typescript
// ✅ CORRECT - Réutiliser composant existant
import { Button } from '@verone/ui';

<Button variant="outline">Cliquer</Button>
```

### 3. ADAPTER (Si presque bon)

**❌ NE PAS créer** `ButtonV2`, `MyButton`, `CustomButton`

**✅ AJOUTER variant** au composant existant :

```typescript
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@verone/ui/lib/utils';

// Dans packages/@verone/ui/src/components/button.tsx
const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-md',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground',
        outline: 'border border-input bg-background',
        // ✅ Ajouter nouveau variant ici
        custom: 'bg-gradient-to-r from-blue-500 to-purple-600',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 rounded-md px-3',
        lg: 'h-11 rounded-md px-8',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

// Utilisation
<Button variant="custom" size="lg">Mon Bouton</Button>
```

**Composition avec `cn()`** :

```typescript
import { Button } from '@verone/ui';
import { cn } from '@verone/ui/lib/utils';

// ✅ Surcharger classes sans créer nouveau composant
<Button
  variant="outline"
  className={cn("hover:scale-105 transition-transform")}
>
  Hover Effect
</Button>
```

### 4. CRÉER (Si vraiment nécessaire)

**Process shadcn/ui** :

1. Vérifier catalogue : https://ui.shadcn.com/docs/components
2. Installer si existe : `npx shadcn-ui@latest add <component>`
3. Adapter avec variants si besoin
4. Centraliser dans `@verone/ui` si réutilisable entre apps

**Pattern atomique obligatoire** :

```typescript
// Nouveau composant = Atomique + CVA + shadcn/ui base
import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@verone/ui/lib/utils';

const myComponentVariants = cva(
  'base-classes-here',
  {
    variants: {
      variant: {
        default: 'default-classes',
        secondary: 'secondary-classes',
      },
    },
  }
);

export interface MyComponentProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof myComponentVariants> {
  // Props spécifiques
}

export const MyComponent = React.forwardRef<HTMLDivElement, MyComponentProps>(
  ({ className, variant, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(myComponentVariants({ variant }), className)}
        {...props}
      />
    );
  }
);
MyComponent.displayName = 'MyComponent';
```

### Exemples Interdits

- ❌ `ButtonV2.tsx`, `MyButton.tsx`, `CustomButton.tsx`
- ❌ `components/ui/custom-dialog.tsx` (si Dialog shadcn existe)
- ❌ Copier-coller composant shadcn modifié dans app locale
- ❌ Créer variantes dans fichiers séparés (ex: `button-variants.tsx`)

### Checklist Création Composant

Avant de créer un `.tsx` :

- [ ] Vérifié catalogue shadcn/ui : https://ui.shadcn.com/docs/components
- [ ] Cherché dans `packages/@verone/ui` avec Glob/Grep
- [ ] Cherché dans `components/` locaux
- [ ] Si existe : réutiliser ou adapter avec variants
- [ ] Si nouveau : atomique + CVA + shadcn base
- [ ] Centralisé dans `@verone/ui` si réutilisable

**Tout nouveau composant UI doit être atomique, dynamique et utiliser `shadcn/ui` comme base.**

---

## 🔧 Mode de Travail

**MODE MANUEL** : Claude ne crée ni ne merge de PR sans instruction explicite.

**Documentation complète** : Voir `.claude/MANUAL_MODE.md`

**En bref** :

- ✅ Claude développe, teste, commit, push autonome
- ⚠️ Claude **DEMANDE** avant de créer/merger PR
- ⚠️ Claude **DEMANDE** avant toute action critique (déploiement, migration DB, etc.)

---

## 🌳 Stratégie Git & Pull Requests

### Trunk-Based Development (TBD)

**Principe** : Short-lived feature branches, intégration rapide.

**Référence** : [Trunk-based Development](https://trunkbaseddevelopment.com/continuous-review/)

### Workflow Standard

#### 1. Créer Feature Branch

```bash
git checkout -b feat/APP-DOMAIN-NNN-description
# Exemples:
# - feat/BO-PARAMS-003-settings-menu
# - fix/LM-ORD-042-validation-bug
```

#### 2. Commits Fréquents (Save Points)

```bash
# Commits petits et atomiques
git add .
git commit -m "[BO-PARAMS-003] step 1: add settings icon"
git push

git commit -m "[BO-PARAMS-003] step 2: create submenu"
git push

git commit -m "[BO-PARAMS-003] step 3: add tests"
git push

# Chaque push = backup + CI check
```

**Avantages** :

- ✅ Backup continu sur GitHub
- ✅ CI valide chaque étape
- ✅ Facile de revenir en arrière
- ✅ Historique clair des étapes

#### 3. UNE PR à la Fin (Tous les Commits)

```bash
# Quand feature complète :
gh pr create \
  --title "[BO-PARAMS-003] feat: add settings menu with tests" \
  --body "
## Summary
- Added settings icon to sidebar
- Created submenu with 4 items
- Added comprehensive Playwright tests

## Test Plan
- [x] Type-check passes
- [x] Build succeeds
- [x] E2E tests pass
- [x] Manual testing on localhost:3000

## Commits
- step 1: add settings icon
- step 2: create submenu
- step 3: add tests
"
```

**Règle d'or** : 1 feature = 1 branche = N commits = **1 PR**

### Format de Commit Requis

```
[APP-DOMAIN-NNN] type: description courte

Details optionnels...
```

**Exemples** :

- `[LM-ORD-009] feat: refonte workflow order form`
- `[BO-DASH-001] fix: cache invalidation`
- `[NO-TASK] chore: update dependencies`

**Validation automatique** : Hook PreToolUse bloque si format invalide

### Revue de PR

**Délai cible** : < 1 heure (idéalement quelques minutes)

**Checklist automatique** :

- [ ] CI passe (tests, build, type-check)
- [ ] Pas de conflits
- [ ] Format commits respecté
- [ ] Tests ajoutés si nouvelle feature

**Checklist humaine** :

- [ ] Code review (logique, sécurité)
- [ ] Validation fonctionnelle
- [ ] Approbation déploiement si prod

### Merge Strategy

```bash
# Pour feature branches (User merge après validation)
gh pr merge 123 --squash  # Squash commits en 1

# Pour hotfix critique (après validation)
gh pr merge 124 --merge --admin  # Preserve commits
```

**⚠️ Jamais de force push sur main** : Protégé en production

### Branches

- `main`: Production
- `feat/*`: Features
- `fix/*`: Bug fixes
- `docs/*`: Documentation

---

## Plans de Projet (.plans/)

**Structure** : Plans de projet pour features complexes.

```
.plans/
├── README.md                                   # Documentation structure
├── batch1-linkme-hooks-checklist.md           # Plan exemple
└── enforce-professional-workflow-2026.md      # Plan exemple
```

**Utilisation** : Créer plan avec `/plan` ou `EnterPlanMode` pour features nécessitant architecture détaillée.

---

## Stack Technique

- Next.js 15 (App Router, RSC)
- shadcn/ui + Tailwind CSS
- Supabase (PostgreSQL + Auth + RLS)
- Turborepo v2.6.0 + pnpm

---

## Structure `.claude/` (Standards Anthropic 2026)

### Dossiers Requis

- **`agents/`** - Agents spécialisés (4 agents core)
- **`commands/`** - Commandes slash (5 commandes actives)
- **`rules/`** - Règles comportement (nouveau 2026)
- **`scripts/`** - Scripts hooks (statusline, task-completed, etc.)
- **`audits/`** - Documentation audit + rapports générés

### Fichiers Configuration

- **`settings.json`** - Config MCP + permissions (tracké Git)
- **`settings.local.json`** - Overrides locaux (gitignored)
- **`README.md`** - Documentation structure kit
- **`MANUAL_MODE.md`** - Règles workflow manuel

### ❌ À NE PAS METTRE dans `.claude/`

- **Mémoires** → `.serena/memories/` (MCP Serena)
- **Plans** → `.plans/` (Plans projet à la racine)
- **Documentation** → `docs/` (canonique) ou `docs/claude/` (spécifique)
- **Archives** → `docs/archive/YYYY-MM/`
- **Travail actif** → Pas de `.claude/work/` (non standard Anthropic 2026)
- **Plans internes** → Pas de `.claude/plans/` (utiliser `.plans/` racine)

### Portabilité

Cette structure `.claude/` est portable entre repos :

1. Copier dossier `.claude/` complet
2. Adapter `settings.json` (chemins absolus → `$CLAUDE_PROJECT_DIR`)
3. Installer dépendances globales : `bun install -g ccusage@17.2.1`

---

## Ports

| Application   | Port |
| ------------- | ---- |
| back-office   | 3000 |
| site-internet | 3001 |
| linkme        | 3002 |

---

**Version**: 10.0.0 (Restructuration Complète 2026-01-30)

**Changements v10.0.0** :

- ✅ Structure `.claude/` conforme standards Anthropic 2026
- ✅ Suppression dossiers non-standard (`.claude/docs/`, `.claude/plans/`, `.claude/work/`)
- ✅ Migration `.tasks/` → `.plans/` (plans) + `docs/archive/tasks-2026-01/` (archives)
- ✅ Suppression 14 fichiers temporaires racine (PNG, TXT)
- ✅ Suppression scripts Python obsolètes
- ✅ Documentation complète scripts/commandes : `docs/claude/SCRIPTS-AND-COMMANDS.md`

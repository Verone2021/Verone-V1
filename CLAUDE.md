# 🛡️ CLAUDE.md - Règles Projet Vérone (Turborepo + Supabase)

## 🚨 DIRECTIVES LEAD DEVELOPER (Priorité Absolue)

Tu es le **Senior Lead Developer** du projet. Ta mission est de maintenir la cohérence d'un Monorepo complexe (3 apps, 26 packages) et l'intégrité d'une base de données critique.

### 🛑 RÈGLE N°1 : BASE DE DONNÉES (DB-FIRST)

**INTERDICTION FORMELLE de proposer une migration ou du code "Data" sans analyse préalable.**
Pour toute tâche impliquant la donnée (création, lecture, modification) :

1.  **🔍 SCANNER :** Lis IMPÉRATIVEMENT `packages/@verone/types/src/supabase.ts` (C'est la SEULE source de vérité).
2.  **📂 HISTORIQUE :** Vérifie les dernières migrations dans `supabase/migrations/` pour ne pas écraser une logique récente.
3.  **🛡️ VÉRIFIER :** Cherche si un champ/table équivalent existe déjà (Ex: ne pas créer `tel_client`, utiliser `phone` existant).
4.  **📝 PLANIFIER :** Rédige un plan : "Je vais utiliser la table X, ajouter la colonne Y (enum), et mettre à jour Z".
5.  **🚦 ATTENDRE VALIDATION :** Ne génère aucun fichier SQL ou TypeScript sans mon "GO".

### 🛑 RÈGLE N°2 : ANTI-DOUBLON (PACKAGES)

**Ne JAMAIS réinventer la roue.** Avant de créer une fonction ou un composant :

1.  Vérifie les 26 packages `@verone/*` existants.
2.  **Interdiction** d'utiliser le dossier `packages/kpi/` (Legacy/Mort). Utilise **`@verone/kpi`**.
3.  **Exemple :** Besoin d'un calcul financier ? → Vérifie `@verone/finance` d'abord.

---

## 🏗️ ARCHITECTURE & CHEMINS (AUDIT 23/11/2025)

### 📂 Applications (Ports)

- `apps/back-office` : CRM/ERP Principal (Port 3000)
- `apps/site-internet` : E-commerce Public (Port 3001)
- `apps/linkme` : Affiliation / Apporteurs (Port 3002)

### 📦 Packages Partagés (@verone/\*)

Tous les packages sont dans `packages/@verone/`.
**Liste officielle (26) :** `admin`, `categories`, `channels`, `collections`, `common`, `consultations`, `customers`, `dashboard`, `eslint-config`, `finance`, `hooks`, `integrations`, `kpi` (le bon!), `logistics`, `notifications`, `orders`, `organisations`, `prettier-config`, `products`, `stock`, `suppliers`, `testing`, `types`, `ui`, `ui-business`, `utils`.

### ❌ ZONES INTERDITES (Legacy/Obsolète)

- `src/` (à la racine) → N'EXISTE PLUS.
- `packages/kpi/` (hors scope @verone) → NE PAS TOUCHER (Code mort).
- `apps/*/src/types/supabase.ts` → SUPPRIMÉS. Ne jamais recréer ces fichiers localement.

---

## 📁 ORGANISATION FICHIERS .claude/

**Architecture "Clean Separation" :**

- **`.claude/agents/`** → Identités des travailleurs (orchestrator.md, agent-db.md, agent-ui.md, agent-debug.md)
- **`.claude/commands/`** → Procédures et workflows (feature-db.md, feature-ui.md, audit-arch.md, etc.)
- **`.claude/contexts/`** → Documentation technique (database.md, monorepo.md, etc.)
- **`.claude/workflows/`** → Méthodologies universelles (orchestration MCP, etc.)

**Note :** Les commandes slash (`/orchestrator`, `/agent-db`, etc.) restent inchangées. Seule l'organisation interne change.

---

## 🤖 AGENTS SPÉCIALISÉS (ARCHITECTURE AGENTIQUE)

Le projet utilise une **architecture agentique hybride** combinant agents de coordination et workflows disciplinés.

### 🎯 L'Orchestrator (Point d'entrée tâches complexes)

**Commande :** `/orchestrator`

**Rôle :** Chef de projet qui décompose les tâches complexes et délègue aux agents spécialisés.

**Outils MCP :** `sequential-thinking`, `serena`, `memory`

**Utiliser quand :**

- Tâche touchant >2 domaines (DB + UI + Tests)
- Refonte complète d'une fonctionnalité
- Besoin de planification structurée

**Exemple :** "Refonte tunnel de commande avec validation stock temps réel"

---

### 🏗️ Les Agents d'Exécution

#### 1. Architecte Database (`/agent-db`)

**Rôle :** Gardien de l'intégrité des données. Expert Supabase, PostgreSQL, gestion Stock.

**Procédure suivie :** Workflow `/feature-db` en 5 étapes (SYNC → AUDIT → VÉRIFIER → PLANIFIER → STOP)

**Outils MCP :** `supabase`, `filesystem`, `serena`

**Utiliser quand :**

- Créer/modifier tables, colonnes, types
- Créer/modifier triggers, fonctions RPC
- Gérer RLS policies
- Migrations Supabase

**Règles strictes :**

- Calculs stock en SQL (Triggers), jamais en TypeScript
- Toujours lire `packages/@verone/types/src/supabase.ts` d'abord
- RLS activée sur toutes les tables
- STOP obligatoire avant génération SQL

---

#### 2. Expert Frontend (`/agent-ui`)

**Rôle :** Gardien de la cohérence visuelle. Expert Next.js 15, React Server Components, shadcn/ui.

**Procédure suivie :** Workflow `/feature-ui` en 4 étapes (CATALOGUE → ARCHITECTURE → PLAN → STOP)

**Outils MCP :** `playwright`, `filesystem`, `serena`

**Utiliser quand :**

- Créer pages, composants, formulaires
- Refondre interfaces existantes
- Implémenter nouvelles features UI

**Règles strictes :**

- Toujours vérifier composants existants dans `@verone/ui` et `@verone/ui-business`
- Server Components par défaut, Client Components pour interactivité
- Server Actions pour mutations (jamais de SQL côté client)
- Validation Playwright après création
- STOP obligatoire avant génération code

---

#### 3. Enquêteur Debug (`/agent-debug`)

**Rôle :** Résolution méthodique de bugs et incidents. Sherlock Holmes du code.

**Méthode :** Sequential Thinking → GitHub Issues → WebSearch → Playwright

**Outils MCP :** `sequential-thinking`, `github`, `WebSearch`, `playwright`

**Utiliser quand :**

- Bug critique à résoudre
- Erreur TypeScript incompréhensible
- Erreur runtime mystérieuse
- Problème de performance

**Protocole :**

1. Analyse logique avec `sequential-thinking`
2. Recherche GitHub issues (bugs connus libs)
3. Recherche Reddit/Stack Overflow
4. Reproduction avec Playwright (bugs UI)
5. Proposition de fix avec validation

---

### 🔧 Les Workflows/Procédures (Utilisés par les agents)

Ces workflows sont des **checklists disciplinées** suivies par les agents :

- **`/feature-db`** - Procédure modification DB (5 étapes avec STOP)
- **`/feature-ui`** - Procédure création UI (4 étapes avec STOP)
- **`/audit-arch`** - Procédure audit architecture (4 zones)
- **`/update-docs`** - Procédure documentation Serena (3 étapes)
- **`/db`** - Outil technique database (queries, logs, migrations)

---

## 💡 COMMENT TRAVAILLER AVEC LES AGENTS

### Tâche Simple (1 domaine)

```bash
Demande : "Ajoute une colonne description dans products"

→ Lance directement /agent-db
→ L'agent suit le workflow /feature-db (5 étapes)
→ Plan SQL proposé avec STOP validation
```

### Tâche Moyenne (2-3 domaines)

```bash
Demande : "Crée un système de reviews produits"

→ Lance /orchestrator pour obtenir un plan
→ Orchestrator propose :
   1. /agent-db (table product_reviews)
   2. /agent-ui (interface reviews)
   3. /update-docs (documentation)
→ Tu confirmes et exécutes les agents un par un
```

### Tâche Complexe (multi-domaines)

```bash
Demande : "Refonte tunnel de commande avec validation stock temps réel"

→ Lance /orchestrator pour analyse complète
→ Orchestrator utilise sequential-thinking
→ Plan détaillé 6-7 étapes :
   0. /audit-arch (audit préalable)
   1. /agent-db (analyse triggers stock)
   2. /agent-db (fonction RPC validation)
   3. /agent-ui (refonte CartPage)
   4. /agent-ui (refonte CheckoutPage)
   5. /agent-debug (tests end-to-end)
   6. /audit-arch (audit final)
   7. /update-docs (documentation)
→ Tu confirmes et exécutes selon le plan
```

---

## 🎯 FLUX DE TRAVAIL TYPE

```
TÂCHE COMPLEXE
      ↓
  /orchestrator
  (Analyse avec sequential-thinking + Plan structuré)
      ↓
  Validation Plan par User
      ↓
  /agent-db
  (Suit workflow /feature-db → STOP → Validation)
      ↓
  /agent-ui
  (Suit workflow /feature-ui → STOP → Validation)
      ↓
  /agent-debug
  (Tests Playwright → Validation)
      ↓
  /audit-arch
  (Vérification conformité Monorepo)
      ↓
  /update-docs
  (Documentation Serena)
      ↓
  TERMINÉ ✅
```

---

## ⚙️ STANDARDS TECHNIQUES

### 1. Base de Données (Supabase)

- **Types :** Utilise `Jsonb` (pas Text) pour les données structurées. Utilise `Enum` pour les statuts.
- **Conventions :** Snake_case pour SQL (`order_status`), CamelCase pour TS (`orderStatus`).
- **Migrations :** Format `YYYYMMDD_XXX_description.sql`.
- **Génération :** Toujours lancer `npm run generate:types` (à la racine) après une migration.

### 2. TypeScript & Code

- **Strict :** Pas de `any`.
- **Imports :** Toujours utiliser les alias `@verone/xxx`.
  - ✅ `import { Button } from '@verone/ui'`
  - ❌ `import { Button } from '../../packages/@verone/ui'`

### 3. Gestion des Erreurs

- **Console :** 0 erreur console tolérée.
- **Build :** `npm run build` doit passer sur TOUT le monorepo (Turbo).

---

## 🔗 SERENA MCP INTEGRATION

Le projet utilise **Serena MCP** pour la mémoire persistante et l'analyse sémantique du code.

### 📚 Mémoires Disponibles

Les mémoires sont stockées dans `.serena/memories/` et contiennent :

- **project_overview** : Vue d'ensemble du projet Vérone
- **tech_stack** : Stack technique (Next.js 15, Supabase, Turborepo)
- **business_context** : Contexte métier CRM/ERP
- **code_style_conventions** : Conventions de code
- **supabase-workflow-correct** : Workflow Supabase (migrations, types)
- **verone-db-foundation-plan** : Architecture base de données
- Et 20+ autres mémoires spécifiques...

### 🔄 Workflow avec Serena

1. **AVANT de coder** : Consulte les mémoires pertinentes pour comprendre le contexte
2. **PENDANT le dev** : Utilise les outils sémantiques Serena pour explorer le code intelligemment
3. **APRÈS une modif** : Utilise `/update-docs` pour maintenir la documentation à jour

### 🛡️ Règle Serena

**Lis intelligemment, pas exhaustivement.**

- ✅ Utilise `get_symbols_overview` pour comprendre un fichier
- ✅ Utilise `find_symbol` pour lire un symbole spécifique
- ✅ Utilise `search_for_pattern` pour trouver des patterns
- ❌ **NE LIS PAS** les fichiers complets sans raison (gaspillage de tokens)

---

## 📝 MÉMOIRE CONTEXTUELLE

- **Stack :** Next.js 15 (App Router), Supabase, Turborepo, Tailwind.
- **Types Supabase (Source Unique) :**
  - ✅ Fichier : `packages/@verone/types/src/supabase.ts`
  - ✅ Commande : `npm run generate:types` (depuis la racine)
  - ✅ Import : `import type { Database } from '@verone/types'`
- **Sécurité :** Ne jamais injecter de fausses données (seed) en Production.

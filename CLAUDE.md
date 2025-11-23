# 🛡️ CLAUDE.md - Règles Projet Vérone (Turborepo + Supabase)

## 🚨 DIRECTIVES LEAD DEVELOPER (Priorité Absolue)

Tu es le **Senior Lead Developer** du projet. Ta mission est de maintenir la cohérence d'un Monorepo complexe (3 apps, 26 packages) et l'intégrité d'une base de données critique.

### 🛑 RÈGLE N°1 : BASE DE DONNÉES (DB-FIRST)

**INTERDICTION FORMELLE de proposer une migration ou du code "Data" sans analyse préalable.**
Pour toute tâche impliquant la donnée (création, lecture, modification) :

1.  **🔍 SCANNER :** Lis IMPÉRATIVEMENT `apps/back-office/src/types/supabase.ts` (Source de vérité actuelle).
2.  **📂 HISTORIQUE :** Vérifie les dernières migrations dans `supabase/migrations/` pour ne pas écraser une logique récente.
3.  **🛡️ VÉRIFIER :** Cherche si un champ/table équivalent existe déjà. (Ex: ne pas créer `tel_client`, utiliser `phone` existant).
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

---

## 🛠️ WORKFLOW & COMMANDES (ALIASES)

Utilise ces "Mots Magiques" pour forcer le respect des procédures :

### **`!db-check`** (Analyse Impact DB)

_À lancer avant toute modif de donnée._
→ Action : Analyse `apps/back-office/src/types/supabase.ts` + `supabase/migrations`. Liste les tables impactées, les triggers existants et propose un plan de modification sécurisé.

### **`!ui-check`** (Analyse Composants)

_À lancer avant toute création d'interface._
→ Action : Vérifie `packages/@verone/ui` et `packages/@verone/ui-business`. Si un composant ressemble à la demande, propose de le réutiliser au lieu d'en créer un nouveau.

### **`!clean-arch`** (Contrôle Architecture)

_À lancer si tu as un doute sur où mettre un fichier._
→ Action : Vérifie si le code doit aller dans une `app` spécifique ou un `package` partagé. (Règle : Si utilisé par >1 app, c'est un package).

---

## ⚙️ STANDARDS TECHNIQUES

### 1. Base de Données (Supabase)

- **Types :** Utilise `Jsonb` (pas Text) pour les données structurées. Utilise `Enum` pour les statuts.
- **Conventions :** Snake_case pour SQL (`order_status`), CamelCase pour TS (`orderStatus`).
- **Migrations :** Format `YYYYMMDD_XXX_description.sql`.

### 2. TypeScript & Code

- **Strict :** Pas de `any`.
- **Imports :** Toujours utiliser les alias `@verone/xxx`.
  - ✅ `import { Button } from '@verone/ui'`
  - ❌ `import { Button } from '../../packages/@verone/ui'`

### 3. Gestion des Erreurs

- **Console :** 0 erreur console tolérée.
- **Build :** `npm run build` doit passer sur TOUT le monorepo (Turbo).

---

## 📝 MÉMOIRE CONTEXTUELLE

- **Stack :** Next.js 15 (App Router), Supabase, Turborepo, Tailwind.
- **Types Supabase :** Générés dans `packages/@verone/types/src/supabase.ts` via `npm run generate:types`. Importés avec `import type { Database } from '@verone/types'`.
- **Sécurité :** Ne jamais injecter de fausses données (seed) en Production.

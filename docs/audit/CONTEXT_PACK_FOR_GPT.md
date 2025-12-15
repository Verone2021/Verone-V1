# CONTEXT PACK FOR GPT - Vérone Back Office

**Date** : 2025-12-15
**Purpose** : Handoff document for external AI assistants
**Anti-Hallucination Rule** : Every factual claim cites a proof (file/commit/log). Otherwise marked "NON CONFIRMÉ".

---

## 1. ARCHITECTURE

### Schéma ASCII

```
┌──────────────────────────────────────────────────────────────────────┐
│                    VERONE MONOREPO (Turborepo)                        │
│                    Repository: Verone2021/Verone-V1                   │
├──────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐       │
│  │   back-office   │  │     linkme      │  │  site-internet  │       │
│  │   (Port 3000)   │  │   (Port 3002)   │  │   (Port 3001)   │       │
│  │   CRM/ERP       │  │   Affiliation   │  │   E-commerce    │       │
│  │   ✅ PROD       │  │   ✅ PROD       │  │   🔜 En cours   │       │
│  └────────┬────────┘  └────────┬────────┘  └────────┬────────┘       │
│           │                    │                    │                 │
│           └────────────────────┼────────────────────┘                 │
│                                │                                      │
│                    ┌───────────┴───────────┐                          │
│                    │  packages/@verone/*   │                          │
│                    │  (25 packages partagés)│                          │
│                    │  ui, products, orders, │                          │
│                    │  stock, types, utils   │                          │
│                    └───────────────────────┘                          │
│                                                                       │
├──────────────────────────────────────────────────────────────────────┤
│                           INFRASTRUCTURE                              │
│                                                                       │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐               │
│  │   GitHub    │───►│   Vercel    │◄───│  Supabase   │               │
│  │  (Repo)     │    │  (Deploy)   │    │  (DB+Auth)  │               │
│  │  Rulesets   │    │  Auto-build │    │  1 Project  │               │
│  └─────────────┘    └─────────────┘    └─────────────┘               │
│                                                                       │
└──────────────────────────────────────────────────────────────────────┘
```

### Tableau Structure

| Composant        | Chemin                       | Description                   | Status        |
| ---------------- | ---------------------------- | ----------------------------- | ------------- |
| **Apps**         |                              |                               |               |
| back-office      | `apps/back-office/`          | CRM/ERP complet               | ✅ Production |
| linkme           | `apps/linkme/`               | Affiliation vendeurs          | ✅ Production |
| site-internet    | `apps/site-internet/`        | E-commerce public             | 🔜 En cours   |
| **Packages**     |                              |                               |               |
| @verone/ui       | `packages/@verone/ui/`       | Design System (54 composants) | ✅ Stable     |
| @verone/products | `packages/@verone/products/` | Composants produits           | ✅ Stable     |
| @verone/orders   | `packages/@verone/orders/`   | Composants commandes          | ✅ Stable     |
| @verone/stock    | `packages/@verone/stock/`    | Gestion stock                 | ✅ Stable     |
| @verone/types    | `packages/@verone/types/`    | Types TypeScript              | ✅ Stable     |
| @verone/utils    | `packages/@verone/utils/`    | Utilitaires                   | ✅ Stable     |

**Preuve** : `CLAUDE.md` (lignes 13-35)

---

## 2. USER FLOWS CLÉS

### Auth / Login

```
1. User accède à /login
2. Choix : Email/Password OU Google OAuth
3. Supabase Auth valide credentials
4. Création session + JWT
5. Redirect vers /dashboard
6. RLS appliqué selon user.organisation_id
```

**Fichiers** :

- `apps/back-office/src/app/(auth)/login/page.tsx`
- `apps/back-office/src/lib/auth/` (NON CONFIRMÉ - chemin exact)

### Back-Office : Produits/Catalogue

```
1. /produits - Liste produits avec filtres
2. /produits/[id] - Détail produit
3. /produits/nouveau - Création produit
4. Variantes, images, pricing par canal
5. Sync Google Merchant (optionnel)
```

**Tables** : `products`, `product_variants`, `product_images`, `categories`, `channel_pricing`

### Back-Office : Stock

```
1. /stock - Vue stock global
2. /stock/mouvements - Historique mouvements
3. /stock/alertes - Alertes stock bas
4. Triggers automatiques sur réceptions/expéditions
5. Stock prévisionnel (forecasted_stock)
```

**Tables** : `stock_movements`, `stock_alerts`, `receptions`, `expeditions`
**Triggers** : ~20 triggers stock (voir `supabase/migrations/20251124_*.sql`)

### Back-Office : Pricing

```
1. Prix de base sur product_variant
2. Prix par canal (channel_pricing)
3. Listes de prix (price_lists)
4. Calcul TTC automatique (TVA 20%)
```

**Tables** : `channel_pricing`, `channel_price_lists`, `price_tiers`

### LinkMe : Affiliation

```
1. Affilié s'inscrit via /register
2. Accède au catalogue LinkMe
3. Crée des sélections de produits
4. Partage liens avec clients
5. Commission sur ventes générées
```

**Tables** : `linkme_affiliates`, `linkme_selections`, `linkme_commissions`, `linkme_catalog`

---

## 3. DÉPLOIEMENT (Vérité Actuelle)

### Comment ça déploie aujourd'hui

```
1. Développeur crée branche feature/*
2. Push + ouvre PR vers main
3. Vercel build automatique (preview)
4. Status checks : Vercel – verone-back-office + Vercel – linkme
5. Review + Merge vers main
6. Auto-deploy production via webhook
```

**Preuve** : `docs/DEPLOYMENT.md` (2025-12-13)

### Env Vars par App

#### Back-Office

| Variable                        | Required |
| ------------------------------- | -------- |
| `NEXT_PUBLIC_SUPABASE_URL`      | ✅       |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅       |
| `SUPABASE_SERVICE_ROLE_KEY`     | ✅       |
| `NEXTAUTH_URL`                  | ✅       |
| `NEXTAUTH_SECRET`               | ✅       |
| `GOOGLE_CLIENT_ID`              | ✅       |
| `GOOGLE_CLIENT_SECRET`          | ✅       |

#### LinkMe

| Variable                        | Required |
| ------------------------------- | -------- |
| `NEXT_PUBLIC_SUPABASE_URL`      | ✅       |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅       |
| `NEXT_PUBLIC_LINKME_URL`        | ✅       |

**Preuve** : `docs/DEPLOYMENT.md` (lignes 54-82)

---

## 4. SUPABASE

### Tables Principales (~78 total)

| Domaine  | Tables                                                                         |
| -------- | ------------------------------------------------------------------------------ |
| Products | `products`, `product_variants`, `product_images`, `categories`                 |
| Orders   | `sales_orders`, `sales_order_items`, `purchase_orders`, `purchase_order_items` |
| Stock    | `stock_movements`, `stock_alerts`, `receptions`, `expeditions`                 |
| Users    | `organisations`, `user_profiles`, `user_roles`, `contacts`                     |
| Finance  | `invoices`, `invoice_items`, `bank_transactions`, `expenses`                   |
| LinkMe   | `linkme_affiliates`, `linkme_selections`, `linkme_commissions`                 |
| Pricing  | `channel_pricing`, `channel_price_lists`, `price_tiers`                        |

**Preuve** : `apps/back-office/src/types/supabase.ts`

### RLS/Policies - Principes

```sql
-- Pattern multi-tenant (toutes tables avec organisation_id)
CREATE POLICY "tenant_isolation"
ON table_name FOR ALL
USING (organisation_id = (auth.jwt() ->> 'organisation_id')::uuid);
```

**Fichiers définition** : `supabase/migrations/*.sql` (239 policies)

### Enums/Types Principaux

| Enum                  | Valeurs                                                  |
| --------------------- | -------------------------------------------------------- |
| `user_role`           | owner, admin, employee, affiliate                        |
| `order_status`        | draft, pending, validated, shipped, delivered, cancelled |
| `stock_movement_type` | in, out, adjustment                                      |
| `client_type`         | b2b, b2c                                                 |
| `bank_provider`       | qonto, bridge, ...                                       |

**Preuve** : `apps/back-office/src/types/supabase.ts` (section Enums)

---

## 5. DECISION LOG (10 Décisions Majeures)

### 1. Turborepo Monorepo

**Décision** : Migrer vers Turborepo avec apps/ + packages/
**Date** : Nov 2025 (Phase 4)
**Preuve** : `docs/architecture/AUDIT-MIGRATION-TURBOREPO.md`

### 2. Main = Production

**Décision** : `main` est la branche de production (pas `develop`)
**Date** : Dec 2025
**Preuve** : `docs/BRANCHING.md` (ligne 12)

### 3. Single Supabase Project

**Décision** : 1 seul projet Supabase pour DEV/PREVIEW/PROD
**Preuve** : `.serena/memories/project-decisions-non-negotiable-2025-12.md`

### 4. No Co-Authored-By Claude

**Décision** : Interdit dans commits (bloque Vercel)
**Date** : Dec 2025
**Preuve** : `.serena/memories/git-commits-no-coauthor-claude.md`

### 5. PR Obligatoire

**Décision** : Aucun push direct sur main, PR + status checks requis
**Preuve** : `docs/governance/GITHUB-RULESETS.md`

### 6. Auto-Deploy Vercel

**Décision** : Webhook GitHub → Vercel auto-deploy sur merge main
**Preuve** : `docs/DEPLOYMENT.md` (ligne 21)

### 7. pnpm Package Manager

**Décision** : pnpm (pas npm, pas yarn) pour le monorepo
**Preuve** : `pnpm-lock.yaml` existe, `vercel.json` (ligne 8)

### 8. shadcn/ui Design System

**Décision** : Utiliser shadcn/ui + Radix UI pour composants
**Preuve** : `packages/@verone/ui/` existe

### 9. Server Actions + Zod

**Décision** : Next.js 15 Server Actions avec validation Zod
**Preuve** : `docs/architecture/decisions/0008-migration-server-actions*.md`

### 10. RLS Multi-Tenant

**Décision** : Isolation données par organisation_id via RLS
**Preuve** : Pattern dans `supabase/migrations/` (239 policies)

---

## 6. KNOWN SHARP EDGES (Warnings)

### 1. GoTrueClient Multiple Instances

**Problème** : Supabase client peut créer plusieurs instances
**Impact** : Warnings console, potentielle confusion auth
**Mitigation** : Utiliser singleton pattern dans lib/supabase

### 2. Types Supabase Désynchronisés

**Problème** : `supabase.ts` peut être désynchronisé après migrations
**Impact** : Erreurs TypeScript, runtime errors
**Mitigation** : Toujours régénérer après migration : `supabase gen types typescript --local > apps/back-office/src/types/supabase.ts`

### 3. Triggers Stock Complexes

**Problème** : ~20 triggers interdépendants sur stock
**Impact** : Difficile à débugger, effets cascade
**Preuve** : `supabase/migrations/20251124_*.sql` (12 fichiers triggers)

### 4. Mémoires Serena Obsolètes

**Problème** : Certaines mémoires contredisent les docs canon
**Impact** : Mauvaises décisions si mémoire consultée avant doc
**Mitigation** : Audit fait (2025-12-15), mémoires obsolètes supprimées

### 5. Project IDs Hardcodés

**Problème** : `aorroydfjsrygmosnzrl` hardcodé dans 37 fichiers
**Impact** : Non-portable pour forks
**Mitigation** : Acceptable pour ce projet, documenter si fork

---

## 7. DO / DON'T POUR PROCHAINS AGENTS

### DO (À faire)

1. **Toujours consulter docs canon EN PREMIER**
   - `docs/DEPLOYMENT.md`
   - `docs/BRANCHING.md`
   - `docs/governance/GITHUB-RULESETS.md`

2. **Créer une branche avant toute modification**

   ```bash
   git checkout main && git pull
   git checkout -b feature/ma-feature
   ```

3. **Vérifier types après modification DB**

   ```bash
   supabase gen types typescript --local > apps/back-office/src/types/supabase.ts
   npm run type-check
   ```

4. **Exécuter l'audit avant PR majeure**

   ```bash
   ./scripts/repo-audit.sh
   ```

5. **Citer des preuves (fichier:ligne ou commit)**
   - Jamais affirmer sans preuve
   - Marquer "NON CONFIRMÉ" si incertain

6. **Utiliser composants existants**
   - Consulter `docs/architecture/COMPOSANTS-CATALOGUE.md`
   - Import depuis `@verone/*`

7. **Respecter le workflow PDCA**
   - PLAN → DO → CHECK → ACT
   - Preuves techniques obligatoires (logs)

### DON'T (Ne jamais faire)

1. **JAMAIS push direct sur main**

   ```bash
   # INTERDIT
   git push origin main
   ```

2. **JAMAIS bypass les rulesets GitHub**
   - Pas de `--force`
   - Pas de merge sans status checks

3. **JAMAIS ajouter Co-Authored-By Claude**

   ```bash
   # INTERDIT
   Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
   ```

4. **JAMAIS utiliser GH_TOKEN/GITHUB_TOKEN**
   - OAuth keychain uniquement
   - Si absolument nécessaire : `env -u GH_TOKEN ...` + documenter

5. **JAMAIS créer données test en prod**
   - Base Supabase = PROD
   - Pas de seed/mock sans autorisation explicite

6. **JAMAIS inventer sans vérifier**
   - Toujours vérifier Git history si "ça marchait avant"
   - `git log --since="[date]" -- [file]`

7. **JAMAIS modifier rulesets sans GO explicite**
   - Documenter la raison
   - Proposer patch
   - Attendre validation owner

8. **JAMAIS ignorer erreurs console**
   - 1 erreur = ÉCHEC
   - Zéro tolérance

---

## 8. FICHIERS CRITIQUES À CONNAÎTRE

| Fichier                                  | Rôle                             |
| ---------------------------------------- | -------------------------------- |
| `CLAUDE.md`                              | Instructions agent principal     |
| `docs/DEPLOYMENT.md`                     | Canon déploiement                |
| `docs/BRANCHING.md`                      | Canon branches                   |
| `docs/governance/GITHUB-RULESETS.md`     | Canon rulesets                   |
| `vercel.json`                            | Config Vercel root               |
| `apps/back-office/src/types/supabase.ts` | Types DB générés                 |
| `supabase/migrations/`                   | Migrations SQL                   |
| `scripts/repo-audit.sh`                  | Audit automatique                |
| `.serena/memories/`                      | Cache mémoires (pas autoritaire) |
| `.claude/commands/`                      | Commandes slash                  |
| `.claude/agents/`                        | Agents spécialisés               |

---

## 9. COMMANDES UTILES

```bash
# Développement
npm run dev                    # Lance tous les apps
npm run build                  # Build production
npm run type-check             # Validation TypeScript

# Audit
./scripts/repo-audit.sh        # Détection contradictions
./scripts/repo-doctor.sh       # Santé repo

# Database
supabase db push               # Appliquer migrations
supabase gen types typescript --local > apps/back-office/src/types/supabase.ts

# Git
gh pr create --base main       # Créer PR
gh pr list                     # Lister PRs
```

---

## 10. RÉSUMÉ EN 1 MINUTE

> Vérone est un **CRM/ERP pour mobilier haut de gamme** construit en **monorepo Turborepo** avec 3 apps Next.js 15 (back-office, linkme, site-internet) et 25 packages partagés. Il utilise **Supabase** (PostgreSQL + Auth + RLS) comme backend unique.
>
> Le déploiement est **automatique via Vercel** sur merge vers `main`. Les PRs sont obligatoires avec 2 status checks (back-office + linkme).
>
> **Règles critiques** : pas de push direct sur main, pas de Co-Authored-By Claude, pas de bypass rulesets, Serena = cache pas vérité.
>
> **Pour tout agent** : consulter les docs canon (`docs/DEPLOYMENT.md`, `docs/BRANCHING.md`, `docs/governance/GITHUB-RULESETS.md`) AVANT toute action.

---

**Pack créé** : 2025-12-15
**Pour transfert à** : Assistants externes (GPT, autres agents)
**Maintenir à jour** : Après chaque changement majeur d'architecture

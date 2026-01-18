# WORKFLOW: DOCUMENTATION & MÉMOIRE (SERENA MCP)

**Mode activé :** Expert Documentation & Gestion de la Mémoire Projet
**Objectif :** Maintenir la documentation technique à jour après des modifications importantes.

---

## 🚨 RÈGLE D'OR : "LE CODE EST LA VÉRITÉ, LA DOC EXPLIQUE LE POURQUOI"

**Ne JAMAIS laisser la documentation devenir obsolète.**

---

## 📋 WORKFLOW DE MISE À JOUR (3 ÉTAPES)

### 1️⃣ IDENTIFIER LE DOMAINE MODIFIÉ

**Questions à répondre :**

- ✅ Quel domaine a été modifié ? (Stock, Auth, UI, Database, etc.)
- ✅ S'agit-il d'une règle métier, d'une architecture, ou d'un workflow ?
- ✅ Y a-t-il une mémoire Serena existante pour ce domaine ?

#### **Mapping Domaine → Mémoire**

| Domaine Modifié                               | Mémoire à Mettre à Jour                                            |
| --------------------------------------------- | ------------------------------------------------------------------ |
| **Base de données** (tables, colonnes, types) | `verone-db-foundation-plan`                                        |
| **Migrations Supabase**                       | `supabase-workflow-correct`, `database-migrations-convention`      |
| **Stock** (calculs, triggers)                 | `verone-db-foundation-plan` (section Stock)                        |
| **Authentification**                          | `auth-multi-canal-phase1-phase2-complete-2025-11-19`               |
| **Système de prix**                           | `mission-systeme-prix-multi-canaux-complete`                       |
| **Architecture**                              | `project_overview`, `turborepo-paths-reference-2025-11-20`         |
| **Types TypeScript**                          | `types-centralisation-verone-types-2025-11-23`                     |
| **Workflow Vercel**                           | `vercel-workflow-no-docker`, `vercel-deployment-status-2025-10-20` |
| **Business Rules**                            | `business_context`, `business-rules-organisations`                 |
| **Code Style**                                | `code_style_conventions`                                           |
| **Tech Stack**                                | `tech_stack`                                                       |

#### **Actions de vérification :**

```bash
# Lister les mémoires disponibles
ls -la .serena/memories/

# Chercher une mémoire par mot-clé
grep -r "stock" .serena/memories/*.md

# Lire une mémoire spécifique
cat .serena/memories/verone-db-foundation-plan.md
```

---

### 2️⃣ ANALYSER L'IMPACT DE LA MODIFICATION

**Déterminer le type de mise à jour nécessaire :**

#### **A. Nouvelle Règle Métier**

Si une nouvelle règle métier a été ajoutée (ex: nouveau statut de commande, nouvelle contrainte de stock) :

**Action :**

1. ✅ Ajouter la règle dans la mémoire correspondante
2. ✅ Expliquer le "Pourquoi" (contexte métier)
3. ✅ Documenter les impacts sur le code existant

**Exemple :**

```markdown
## Nouvelle Règle : Validation Quantité Minimale

**Date :** 2025-11-23
**Contexte :** Les commandes doivent avoir une quantité minimale de 10 unités pour les produits en gros.

**Implémentation :**

- Ajout du champ `minimum_order_quantity` dans la table `products`
- Ajout d'un trigger `validate_minimum_quantity` sur `sales_orders`
- Validation côté client dans `ProductOrderForm.tsx`

**Impact :**

- Les anciennes commandes (< 10 unités) restent valides (non rétroactif)
- L'UI affiche un message d'erreur si quantité < minimum
```

#### **B. Modification d'Architecture**

Si l'architecture a changé (ex: nouveau package, déplacement de code) :

**Action :**

1. ✅ Mettre à jour le diagramme d'architecture si existant
2. ✅ Mettre à jour la liste des packages/apps
3. ✅ Documenter les nouvelles dépendances

**Exemple :**

```markdown
## Nouveau Package : @verone/analytics

**Date :** 2025-11-23
**Objectif :** Centraliser la logique de tracking et d'analytics.

**Contenu :**

- `src/track.ts` : Fonction de tracking événements
- `src/hooks/useTracking.ts` : Hook React pour tracking
- `src/types.ts` : Types pour les événements

**Utilisé par :**

- `apps/back-office` : Tracking actions admin
- `apps/site-internet` : Tracking comportement utilisateur
```

#### **C. Nouveau Workflow**

Si un nouveau workflow a été créé (ex: nouveau processus de validation) :

**Action :**

1. ✅ Créer une nouvelle section "Workflow" dans la mémoire
2. ✅ Documenter les étapes du workflow
3. ✅ Ajouter des exemples d'utilisation

**Exemple :**

```markdown
## Workflow : Annulation Commande Validée

**Date :** 2025-11-23

**Étapes :**

1. Admin clique sur "Annuler" dans OrderDetailsPage
2. Trigger `handle_order_cancellation` :
   - Met `order_status` à 'cancelled'
   - Recalcule le stock (`forecasted_stock` + quantity)
   - Enregistre `cancelled_by` et `cancelled_at`
3. Notification envoyée au client (email)
4. Stock movements créé avec `movement_type` = 'cancellation'

**Code concerné :**

- Trigger: `supabase/migrations/20251113_xxx_handle_order_cancellation.sql`
- UI: `apps/back-office/src/app/orders/[id]/page.tsx`
- Action: `apps/back-office/src/app/orders/actions.ts`
```

---

### 3️⃣ METTRE À JOUR LA MÉMOIRE

**Actions à exécuter :**

```bash
# Utiliser l'outil Serena MCP pour mettre à jour
# (Exemple avec l'outil d'édition de mémoire)

# Ou éditer manuellement
nano .serena/memories/[nom-memoire].md
```

**Structure de mise à jour :**

```markdown
# [Nom de la Mémoire]

## Historique des Modifications

### 2025-11-23 : [Titre de la Modification]

- **Auteur :** Claude Code
- **Contexte :** [Pourquoi cette modification]
- **Changements :**
  - [Liste des changements]
- **Impact :**
  - [Impact sur le code existant]
- **Références :**
  - Fichiers modifiés : [liste]
  - Migrations : [liste]
  - Commits : [hash si disponible]

[... reste de la documentation ...]
```

---

## 🎯 EXEMPLES DE CAS D'USAGE

### Cas 1 : Après ajout d'une table en base

**Scénario :**
Ajout de la table `product_reviews` avec migration Supabase.

**Actions :**

1. ✅ Ouvrir `verone-db-foundation-plan.md`
2. ✅ Ajouter la nouvelle table dans la section "Tables"
3. ✅ Documenter les relations (FK vers `products`, `customers`)
4. ✅ Documenter les triggers/RLS associés
5. ✅ Ajouter la date et le contexte métier

**Mise à jour :**

```markdown
### 2025-11-23 : Ajout Table product_reviews

**Contexte :** Permettre aux clients de laisser des avis sur les produits.

**Nouvelle Table :** `product_reviews`

- `id` (uuid, PK)
- `product_id` (uuid, FK → products)
- `customer_id` (uuid, FK → customers)
- `rating` (integer, 1-5)
- `comment` (text)
- `created_at` (timestamp)

**RLS Policies :**

- Lecture : Public (tous les avis visibles)
- Création : Authenticated (clients connectés uniquement)
- Modification : Owner (seul l'auteur peut modifier)

**Migration :** `20251123_001_add_product_reviews.sql`
```

### Cas 2 : Après création d'un nouveau package

**Scénario :**
Création du package `@verone/analytics` pour centraliser le tracking.

**Actions :**

1. ✅ Ouvrir `project_overview.md`
2. ✅ Ajouter le package dans la liste des 26 packages (devient 27)
3. ✅ Ouvrir `turborepo-paths-reference-2025-11-20.md`
4. ✅ Documenter l'emplacement et les dépendances

**Mise à jour :**

```markdown
### 2025-11-23 : Nouveau Package @verone/analytics

**Packages Vérone (27) :**

- admin, categories, channels, collections, common, consultations, customers,
  dashboard, eslint-config, finance, hooks, integrations, kpi, logistics,
  notifications, orders, organisations, prettier-config, products, stock,
  suppliers, testing, types, ui, ui-business, utils, **analytics** (nouveau)

**@verone/analytics :**

- **Chemin :** `packages/@verone/analytics/`
- **Objectif :** Tracking événements et analytics
- **Dépendances :** `@verone/types`, `@verone/utils`
- **Utilisé par :** `back-office`, `site-internet`
```

### Cas 3 : Après modification d'une règle métier

**Scénario :**
Modification de la règle de calcul de la marge (ajout d'une remise fournisseur).

**Actions :**

1. ✅ Ouvrir `business-rules-organisations.md`
2. ✅ Mettre à jour la règle de calcul de marge
3. ✅ Documenter l'impact sur les calculs existants
4. ✅ Ajouter des exemples

**Mise à jour :**

```markdown
### 2025-11-23 : Prise en compte Remise Fournisseur dans Marge

**Ancienne Règle :**
Marge = Prix de Vente - Prix d'Achat

**Nouvelle Règle :**
Marge = Prix de Vente - (Prix d'Achat - Remise Fournisseur)

**Impact :**

- Les marges calculées augmentent si remise fournisseur présente
- Recalcul automatique via trigger `calculate_product_margin`
- L'UI affiche maintenant "Marge (avec remise)" dans ProductCard

**Exemple :**

- Prix de Vente : 100€
- Prix d'Achat : 70€
- Remise Fournisseur : 10€
- Ancienne Marge : 30€
- Nouvelle Marge : 40€

**Code concerné :**

- Trigger: `supabase/migrations/20251123_002_update_margin_calculation.sql`
- Function: `packages/@verone/finance/src/calculateMargin.ts`
```

---

## 📚 MÉMOIRES DISPONIBLES (Liste Complète)

Voici toutes les mémoires Serena disponibles dans le projet :

1. **project_overview** - Vue d'ensemble du projet
2. **tech_stack** - Stack technique
3. **business_context** - Contexte métier CRM/ERP
4. **code_style_conventions** - Conventions de code
5. **suggested_commands** - Commandes utiles
6. **verone-db-foundation-plan** - Architecture base de données
7. **supabase-workflow-correct** - Workflow Supabase
8. **database-migrations-convention** - Conventions migrations
9. **auth-multi-canal-phase1-phase2-complete-2025-11-19** - Authentification multi-canal
10. **mission-systeme-prix-multi-canaux-complete** - Système de prix
11. **types-centralisation-verone-types-2025-11-23** - Centralisation types
12. **turborepo-paths-reference-2025-11-20** - Référence chemins Turborepo
13. **vercel-workflow-no-docker** - Workflow Vercel
14. **vercel-deployment-status-2025-10-20** - Statut déploiement Vercel
15. **business-rules-organisations** - Règles métier organisations
16. **purchase-orders-validated-workflow-2025-11-19** - Workflow commandes validées
17. **supabase-cloud-migrations-workflow-critical-2025-11-22** - Workflow migrations cloud
18. **Et d'autres...**

---

## 🚫 ANTI-PATTERNS À ÉVITER

❌ **Modifier le code sans mettre à jour la documentation**
→ Documentation obsolète, confusion

❌ **Créer une nouvelle mémoire pour chaque petite modification**
→ Fragmentation, difficulté à retrouver l'info

❌ **Documenter le "Comment" au lieu du "Pourquoi"**
→ Le code montre déjà le "comment", la doc doit expliquer le "pourquoi"

❌ **Copier/coller du code dans la documentation**
→ Duplication, désynchronisation rapide

❌ **Ne pas dater les modifications**
→ Impossible de savoir quand la règle a changé

---

## ✅ CHECKLIST FINALE

Avant de considérer la documentation à jour :

- ✅ Ai-je identifié la bonne mémoire à mettre à jour ?
- ✅ Ai-je ajouté une date et un contexte ?
- ✅ Ai-je expliqué le "Pourquoi" (pas seulement le "Comment") ?
- ✅ Ai-je documenté les impacts sur le code existant ?
- ✅ Ai-je ajouté des exemples si nécessaire ?
- ✅ Ai-je référencé les fichiers/migrations concernés ?

---

**MODE DOCUMENTATION ACTIVÉ.**
Identifie maintenant le domaine modifié, analyse l'impact, et mets à jour la mémoire appropriée.

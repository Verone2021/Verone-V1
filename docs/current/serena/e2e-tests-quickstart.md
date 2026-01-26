---
Status: CRITICAL
Last_verified_commit: 9dd82d81
Primary_sources:
  - packages/e2e-linkme/QUICKSTART.md
  - packages/e2e-linkme/README.md
Owner: Romeo Dos Santos
Created: 2026-01-21
Updated: 2026-01-21
---

# Tests E2E LinkMe - Guide Rapide

## 📍 Fichier Source

**Guide de démarrage rapide**: `packages/e2e-linkme/QUICKSTART.md`

## 🎯 Pourquoi cette Memory ?

Les tests E2E sont critiques pour valider la cohérence des données entre Back-Office et LinkMe (SSOT). Le guide QUICKSTART.md contient toutes les instructions pour :

1. Installer les dépendances
2. Démarrer les applications (pnpm dev)
3. Lancer les tests E2E (18 tests automatisés)
4. Déboguer avec MCP Playwright Browser

## 🚀 Commandes Essentielles

```bash
# Installation
cd packages/e2e-linkme
pnpm install
pnpm exec playwright install chromium

# Démarrer apps (UN SEUL terminal - Turborepo démarre tout)
cd /Users/romeodossantos/verone-back-office-V1
pnpm dev

# Lancer tests
cd packages/e2e-linkme
pnpm test:e2e
pnpm test:e2e:ui  # Mode UI pour déboguer
```

## 📊 Suite de Tests (18 Total)

- **Data Consistency** (4 tests): Cohérence BO ↔ LinkMe
- **Product Creation** (3 tests): Création produits avec/sans stockage
- **Editing Restrictions** (6 tests): Restrictions selon statut approbation
- **Approval Workflow** (3 tests): Workflow submit/approve/reject
- **Data Isolation** (2 tests): RLS policies (Pokawa vs test-org)

## 🔗 Documentation Complète

- **QUICKSTART.md**: Guide rapide (~10 min)
- **README.md**: Documentation complète (392 lignes)
- **MIGRATION.md**: Détails migration vers package dédié
- **CHECKLIST.md**: Validation post-migration

## 🧪 Tests Manuels vs Automatisés

**Tests Automatisés**: Validation systématique des 18 scénarios prédéfinis

**Tests Manuels** (MCP Playwright Browser):
- Déboguer erreurs spécifiques
- Explorer nouvelles fonctionnalités
- Créer nouveaux tests après bugs

**Les deux approches se complètent !**

## ⚠️ Règles Critiques

1. **Ne PAS installer Chromium** si Chrome déjà installé (utiliser MCP Parallel Browser)
2. **UN SEUL terminal** suffit : `pnpm dev` démarre toutes les apps via Turborepo
3. **18 tests doivent passer** avant toute PR touchant LinkMe
4. **Credentials test** : Voir `.serena/memories/*-credentials-*.md`

## 🔄 Quand Consulter ce Guide ?

- ✅ Avant toute modification LinkMe (valider non-régression)
- ✅ Après ajout nouvelle fonctionnalité LinkMe (ajouter tests)
- ✅ En cas d'erreur tests E2E CI/CD
- ✅ Pour créer nouveaux tests automatisés

---

**Dernière vérification**: 2026-01-21 (commit 9dd82d81)

# 🚀 Pull Request - Vérone Back Office

## 📋 Description

<!-- Décrire brièvement les changements apportés en 2-3 phrases -->

**Type de changement:**
- [ ] ✨ Feature (nouvelle fonctionnalité)
- [ ] 🐛 Fix (correction de bug)
- [ ] 🔧 Refactor (refactoring sans changement fonctionnel)
- [ ] 📝 Docs (documentation uniquement)
- [ ] 🎨 Style (formatage, pas de changement logique)
- [ ] ⚡ Performance (amélioration performance)
- [ ] 🚨 Hotfix (correction urgente production)
- [ ] 📦 Data (insertion/migration données)

---

## 🎯 Objectif

<!-- Expliquer POURQUOI ces changements sont nécessaires -->

**Contexte:**
<!-- Issue GitHub liée, demande client, bug découvert, amélioration technique -->

**Résultat attendu:**
<!-- Qu'est-ce qui doit fonctionner après ce merge? -->

---

## 🔍 Changements détaillés

### Fichiers modifiés principaux

<!-- Lister les fichiers importants et expliquer brièvement -->

- `src/app/...` :
- `src/components/...` :
- `src/hooks/...` :
- `src/lib/...` :

### Migrations base de données

- [ ] Aucune migration nécessaire
- [ ] Migration ajoutée: `supabase/migrations/YYYYMMDD_*.sql`
- [ ] Migration appliquée localement: ✅
- [ ] Migration testée: ✅

---

## ✅ Checklist de validation

### Tests locaux

- [ ] **Développement local testé** (`npm run dev`)
- [ ] **Build production OK** (`npm run build`)
- [ ] **Lint passé** (`npm run lint`)
- [ ] **TypeScript OK** (pas d'erreurs de types)

### Vérifications console (OBLIGATOIRE)

- [ ] **Aucune erreur console** (vérifié avec MCP Playwright)
- [ ] **Aucun warning bloquant**
- [ ] **Pas de console.log debug oublié**

### Qualité code

- [ ] **Code commenté** si logique complexe
- [ ] **Pas de secrets exposés** (tokens, passwords, API keys)
- [ ] **Gestion des erreurs** implémentée
- [ ] **Types TypeScript** corrects et complets

### Documentation

- [ ] **README mis à jour** (si nécessaire)
- [ ] **MEMORY-BANK actualisé** (si changements importants)
- [ ] **Commentaires code** ajoutés si logique complexe

---

## 🧪 Plan de test

### Tests manuels effectués

<!-- Décrire les tests réalisés localement -->

1. **Navigation:**
   - [ ] Page chargée sans erreur
   - [ ] Navigation entre pages OK

2. **Fonctionnalité:**
   - [ ] Feature principale testée
   - [ ] Cas limites vérifiés
   - [ ] Erreurs gérées correctement

3. **Performance:**
   - [ ] Temps de chargement acceptable
   - [ ] Pas de ralentissement visible

### Scénarios de test suggérés (pour reviewer)

<!-- Comment tester cette PR? -->

1. Aller sur la page `/...`
2. Cliquer sur le bouton "..."
3. Vérifier que ...

---

## 📸 Captures d'écran / Vidéos

<!-- Si changements UI, ajouter des captures -->

**Avant:**
<!-- Image ou description état avant -->

**Après:**
<!-- Image ou description état après -->

---

## 🔗 Références

### Issues liées

<!-- Mentionner les issues GitHub si applicable -->

- Closes #
- Fixes #
- Related to #

### Documentation connexe

- [Guide workflow](../docs/guides/GITHUB-WORKFLOW-POST-PRODUCTION.md)
- [Business rules](../manifests/business-rules/)

---

## ⚠️ Points d'attention

### Breaking changes

- [ ] Aucun breaking change
- [ ] Breaking changes documentés ci-dessous:

<!-- Si breaking changes, décrire impact + migration nécessaire -->

### Dépendances

- [ ] Aucune dépendance ajoutée
- [ ] Dépendances ajoutées (listées ci-dessous):

```json
// package.json nouvelles dépendances
```

### Configuration requise

- [ ] Aucune configuration requise
- [ ] Configuration nécessaire:

```bash
# Variables d'environnement à ajouter
```

---

## 🚀 Déploiement

### Impact production

- [ ] **Risque faible** (changements mineurs, UI uniquement)
- [ ] **Risque moyen** (nouvelles features, logique métier)
- [ ] **Risque élevé** (changements critiques, données sensibles)

### Rollback plan

- [ ] Rollback simple (revert commit)
- [ ] Rollback complexe (procédure ci-dessous):

<!-- Expliquer comment revenir en arrière si problème -->

### Monitoring post-déploiement

- [ ] Vérifier logs Sentry (erreurs temps réel)
- [ ] Vérifier métriques Vercel (performance)
- [ ] Tester workflow utilisateur complet
- [ ] Vérifier données Supabase (cohérence)

---

## 👤 Reviewer notes

<!-- Notes pour vous-même ou futurs collaborateurs -->

### Points à vérifier en priorité

1.
2.
3.

### Zones de code sensibles

<!-- Code complexe ou critique à examiner attentivement -->

---

## 📝 Notes additionnelles

<!-- Toute autre information utile pour la review -->

---

## ✍️ Signature

**Développeur:** Romeo Dos Santos
**Date:** <!-- Date de création PR -->
**Branche source:** `feature/...` ou `fix/...`
**Branche cible:** `main`

---

**🎯 Review Guidelines (Rappel)**

- ✅ Console errors = 0 (OBLIGATOIRE)
- ✅ Tester sur Preview Vercel
- ✅ Respect design system Vérone (noir/blanc/gris uniquement)
- ✅ Performance targets (Dashboard <2s, Catalogue <3s)
- ✅ Pas de secrets exposés
- ✅ TypeScript sans erreurs

---

**🤖 Template Pull Request Vérone Back Office - Version 2025 (Mise à jour 8 octobre 2025)**

<!--
Ce template guide la création de PR complètes et professionnelles.
Supprimez les sections non applicables, mais gardez les checklists importantes!

Guide complet: docs/guides/GITHUB-WORKFLOW-POST-PRODUCTION.md
-->

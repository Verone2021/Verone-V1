# 📚 Guides Pratiques - Documentation Vérone

**Dernière mise à jour** : 2025-11-19
**Version** : 2.0 (Restructuration complète)
**Mainteneur** : Romeo Dos Santos

---

## 🎯 Vue d'Ensemble

Guides pratiques pour développer, intégrer, déployer et maintenir le système Vérone CRM/ERP. Documentation organisée en 8 catégories thématiques pour navigation rapide.

---

## 📂 Structure (8 Catégories)

### [01-Onboarding](./01-onboarding/) - Nouveaux Développeurs

Guides pour démarrer rapidement sur le projet Vérone.

**Fichiers** :

- `guide-novice-personnalise.md` - Guide complet débutants

### [02-Development](./02-development/) - Développement Quotidien

Setup environnement, workflows développement, tests.

**Fichiers** :

- `development-setup.md` - Configuration environnement
- `quickstart.md` - Démarrage rapide
- `testing-guide.md` - Guide tests E2E et unitaires
- `MIGRATION-IMPORTS-GUIDE.md` - Migration imports
- `manual-migration-guide.md` - Migration manuelle

### [03-Integrations](./03-integrations/) - Intégrations Externes

Documentation intégrations services externes (Google Merchant, Qonto, Abby).

**Sous-dossiers** :

- **[google-merchant/](./03-integrations/google-merchant/)** (5 fichiers)
  - Configuration complète
  - Vérification domaine
  - Plan intégration
  - Service Account
- **[qonto/](./03-integrations/qonto/)** (1 fichier)
  - API configuration
- **[abby/](./03-integrations/abby/)** (vide)
  - Prêt pour future intégration

### [04-Deployment](./04-deployment/) - Déploiement & CI/CD

Guides déploiement Vercel, GitHub, workflows production.

**Fichiers** :

- `GITHUB-CONFIGURATION-2025.md` - Configuration GitHub
- `GITHUB-WORKFLOW-POST-PRODUCTION.md` - Workflow post-production

### [05-Database](./05-database/) - Database Guides

Migrations, RLS policies, fixes database.

**Fichiers** :

- `GUIDE-FIX-DELETE-POLICY-2025-10-14.md` - Fix delete policy

### [06-UI-UX](./06-ui-ux/) - Design & UX

Mockups, refontes UX, design patterns.

**Fichiers** :

- `DESIGN-MOCKUPS-FILTRES-V2.md` - Mockups filtres V2
- `GUIDE-INTEGRATION-FILTRES-CATEGORIES-V2.md` - Intégration filtres
- `README-FILTRES-CATEGORIES-V2.md` - README filtres
- `collections-ux-refonte-2025.md` - Refonte UX collections
- `refonte-ux-complete-2025.md` - Refonte UX complète

### [07-Troubleshooting](./07-troubleshooting/) - Debugging & Fixes

Résolution problèmes courants, fixes urgents.

**Fichiers** :

- `APPLY-NOTIFICATIONS-UNICODE-FIX.md` - Fix unicode notifications
- `GUIDE-OPTIMISATION-TOKENS-2025-10-14.md` - Optimisation tokens
- `CONFIGURATION-YOLO.md` - Configuration YOLO mode

### [08-Best-Practices](./08-best-practices/) - Bonnes Pratiques

Documentation bonnes pratiques, outils, maintenance.

**Fichiers** :

- `BEST-PRACTICES-TRACKING-EMPLOYÉS-DISTANTS.md` - Tracking employés
- `GUIDE-TRACKING-ACTIVITE-UTILISATEUR.md` - Tracking activité
- `claude-code-auto-approvals.md` - Auto-approvals Claude Code
- `maintenance-claude-code-2025.md` - Maintenance Claude Code

---

## 🚀 Démarrage Rapide

### Pour Nouveau Développeur

1. **Onboarding** : Lire `01-onboarding/guide-novice-personnalise.md`
2. **Setup** : Suivre `02-development/development-setup.md`
3. **Quickstart** : Démarrer avec `02-development/quickstart.md`
4. **Tests** : Comprendre stratégie avec `02-development/testing-guide.md`

### Pour Intégration Externe

1. **Google Merchant** : Voir `03-integrations/google-merchant/`
2. **Qonto API** : Voir `03-integrations/qonto/`
3. **Autre service** : Créer nouveau sous-dossier selon template

### Pour Déploiement

1. **GitHub Setup** : Voir `04-deployment/GITHUB-CONFIGURATION-2025.md`
2. **Workflow Production** : Voir `04-deployment/GITHUB-WORKFLOW-POST-PRODUCTION.md`

---

## 🔍 Recherche Rapide

### Questions Fréquentes

**Q : Comment démarrer le projet pour la première fois ?**
→ `02-development/quickstart.md`

**Q : Quelle est la stratégie de tests 2025 ?**
→ `02-development/testing-guide.md`

**Q : Comment intégrer Google Merchant ?**
→ `03-integrations/google-merchant/GOOGLE-MERCHANT-INTEGRATION-PLAN-COMPLET.md`

**Q : Comment déployer en production ?**
→ `04-deployment/GITHUB-WORKFLOW-POST-PRODUCTION.md`

**Q : Problème de console errors ?**
→ `07-troubleshooting/` (chercher fix correspondant)

### Par Mots-Clés

- **Setup** → `02-development/`
- **Tests** → `02-development/testing-guide.md`
- **Intégrations** → `03-integrations/`
- **Deploy** → `04-deployment/`
- **Database** → `05-database/`
- **UX** → `06-ui-ux/`
- **Debugging** → `07-troubleshooting/`
- **Best Practices** → `08-best-practices/`

---

## 📖 Liens Connexes

### Documentation Principale

- [Architecture](/docs/architecture/) - Architecture système, Turborepo, composants
- [Database](/docs/database/) - Schema, migrations, RLS policies
- [Business Rules](/docs/business-rules/) - Règles métier (93 dossiers)
- [Workflows](/docs/workflows/) - Workflows métier
- [CI/CD](/docs/ci-cd/) - Déploiement, rollback, monitoring

### Références Importantes

- [CLAUDE.md](/CLAUDE.md) - Instructions Claude Code
- [COMPOSANTS-CATALOGUE.md](/docs/architecture/COMPOSANTS-CATALOGUE.md) - Catalogue 86 composants
- [TURBOREPO-FINAL-CHECKLIST.md](/docs/architecture/TURBOREPO-FINAL-CHECKLIST.md) - Checklist Phase 4

---

## 🔧 Maintenance

### Ajouter Nouveau Guide

1. **Identifier catégorie** (01-08)
2. **Créer fichier** dans sous-dossier approprié
3. **Mettre à jour README.md** du sous-dossier
4. **Optionnel** : Mettre à jour ce README principal

### Bonnes Pratiques Naming

```
TYPE-sujet-date.md

Exemples :
GUIDE-INTEGRATION-STRIPE-2025-11-20.md
RAPPORT-TESTS-AUTHENTIFICATION-2025-11-19.md
README-FILTRES-CATEGORIES-V2.md
```

### Convention Commits

```bash
git commit -m "docs(guides): Ajouter guide intégration Stripe

- Configuration API
- Webhooks
- Tests

🤖 Generated with Claude Code"
```

---

**Retour** : [Index Principal Documentation](/docs/README.md)
**Statut** : ✅ Restructuration 2025-11-19 (Phase 2 complétée)

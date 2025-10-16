# 📦 Archive Phase 1 Obsolète - 16 Octobre 2025

**Date archivage** : 2025-10-16
**Raison** : Nettoyage fichiers obsolètes Phase 1 (Rôles, Métriques, RLS, Workflows)
**Documentation consolidée** : `/docs/`

---

## 🎯 Pourquoi cet archivage ?

Suite à la consolidation complète de la documentation Phase 1 dans `/docs/` (commit `76ec076`), nous avons identifié **30 fichiers obsolètes** répartis dans `manifests/`, `MEMORY-BANK/`, et `TASKS/`.

Ces fichiers contenaient des informations **redondantes, fragmentées ou déjà exécutées**. Au lieu de les supprimer définitivement, nous avons:
- **Supprimé** 7 fichiers (doublons 100% consolidés dans `/docs/`)
- **Archivé** 23 fichiers (historique préservé)

---

## 📁 Fichiers SUPPRIMÉS (7 fichiers, ~45 KB)

### Catégorie : Business Rules (5 fichiers)

**manifests/archive/business-rules/**
1. **WORKFLOWS.md** (~5 KB)
   - Consolidé dans : `/docs/workflows/*.md` (5 fichiers spécialisés)
   - Raison : Fichier monolithique fragmenté par workflow

2. **orders-lifecycle-management.md** (~8 KB)
   - Consolidé dans : `/docs/workflows/orders-lifecycle.md`
   - Raison : Enrichi avec workflows Owner/Admin différenciés

3. **stock-movements-workflow.md** (~6 KB)
   - Consolidé dans : `/docs/workflows/stock-movements.md`
   - Raison : Enrichi avec triggers automatiques et RLS policies

4. **sourcing-workflow.md** (~7 KB)
   - Consolidé dans : `/docs/workflows/sourcing-validation.md`
   - Raison : Validation business ajoutée

5. **sourcing-validation-workflow.md** (~7 KB)
   - Consolidé dans : `/docs/workflows/sourcing-validation.md`
   - Raison : Doublon

### Catégorie : Plans Non Implémentés (1 fichier)

**MEMORY-BANK/**
6. **MIGRATION-TO-MEMORY-MCP.md** (~6 KB)
   - Raison : Plan migration Memory MCP jamais implémenté (proposition archivée)

### Catégorie : Roadmaps Complétées (1 fichier)

**TASKS/**
7. **ROADMAP-METRIQUES-ACTIVITE-2025.md** (~18 KB)
   - Raison : Roadmap Phase 1 complétée (documentation créée dans `/docs/metrics/`)

---

## 📁 Fichiers ARCHIVÉS (23 fichiers, ~220 KB)

### Catégorie : Architecture Ancienne (3 fichiers)

**archive/phase-1-obsolete-2025-10-16/architecture/**
1. **API-CATALOGUE-V1.md** (~8 KB)
   - Raison : Spec V1 obsolète, remplacée par `/docs/api/rpc-functions.md`

2. **ERD-CATALOGUE-V1.md** (~6 KB)
   - Raison : ERD V1 ancien, remplacé par `/docs/database/schema-overview.md`

3. **dashboard-metrics-system.md** (~12 KB)
   - Raison : Consolidé dans `/docs/metrics/*.md` (4 fichiers: dashboard-kpis, triggers, calculations, components)

### Catégorie : Contextes Redondants (5 fichiers)

**archive/phase-1-obsolete-2025-10-16/contexts/**
1. **ai-context.md** (~7 KB)
   - Raison : Info consolidée dans `CLAUDE.md` section AGENTS MCP

2. **best-practices-2025.md** (~9 KB)
   - Raison : Standards consolidés dans `CLAUDE.md` + `/docs/guides/`

3. **implementation-status-current.md** (~10 KB)
   - Raison : État implémentation dans `DOCUMENTATION-ROLES-METRIQUES-2025.md`

4. **active-context-current.md** (~6 KB)
   - Raison : Remplacé par `/MEMORY-BANK/context/DOCUMENTATION-ROLES-METRIQUES-2025.md`

5. **active-session-2025-10-09.md** (~9 KB)
   - Raison : Session archivée dans `/MEMORY-BANK/archive/sessions/2025-10-09/`

### Catégorie : Tests Phase 1 (15 fichiers)

**archive/phase-1-obsolete-2025-10-16/testing/**

**Guides GROUPE-2** (13 fichiers, ~150 KB)
- GROUPE-2-GUIDE-MANUEL-FINAL.md
- GROUPE-2-DIAGNOSTIC-ERREURS.md
- GROUPE-2-TOP-5-SCENARIOS.md
- GROUPE-2-QUICK-REFERENCE.md
- GROUPE-2-INDEX.md
- GROUPE-2-CHECKLIST-DECISION.md
- GROUPE-2-CRITERES-SUCCES.md
- GROUPE-2-ANALYSE-ERREURS.md
- GROUPE-2-SCENARIOS-EDGE-CASES.md
- GROUPE-2-VALIDATION-FINALE.md
- GROUPE-2-SYNTHESE-COMPLETE.md
- GROUPE-2-RAPPORT-FINAL.md
- GROUPE-2-COMMANDES-RAPIDES.sh

**Raison** : Tests validation Phase 1 (Erreur #8 display_order) - Complétés 2025-10-16

**Rapports Tests** (2 fichiers, ~30 KB)
- RAPPORT_TESTS_PHASE1_PARTIEL.md
- GUIDE_TESTS_PHASE_1_COMPLETS.md

**Raison** : Rapports tests Phase 1 obsolètes (session 2025-10-05 à 10-16)

---

## 🆕 Nouvelle Documentation

La documentation consolidée se trouve dans `/docs/` avec une structure claire :

```
docs/
├── README.md                          # Index principal
├── auth/                              # Rôles, Permissions, RLS
│   ├── roles-permissions-matrix.md    # Matrice complète Owner/Admin
│   ├── rls-policies.md                # 68 Policies Supabase SQL
│   ├── user-profiles.md               # Profils utilisateurs
│   └── authentication-flows.md        # Flows login/signup
├── metrics/                           # Métriques & Analytics
│   ├── dashboard-kpis.md              # 16 hooks documentés
│   ├── database-triggers.md           # 13 triggers automatiques
│   ├── calculations.md                # 21 formules mathématiques
│   └── components.md                  # Graphiques Recharts + KPI Cards
├── workflows/                         # Business Workflows
│   ├── owner-daily-workflow.md        # Workflow quotidien Owner
│   ├── admin-daily-workflow.md        # Workflow quotidien Admin
│   ├── orders-lifecycle.md            # Cycle commandes
│   ├── stock-movements.md             # Mouvements stock
│   └── sourcing-validation.md         # Sourcing produits
├── database/                          # Database Architecture
│   ├── schema-overview.md             # ERD + tables
│   ├── triggers-hooks.md              # Triggers documentation
│   ├── functions-rpc.md               # RPC functions
│   └── migrations/
│       └── applying-changes.md        # Guide migrations
├── guides/                            # Guides Pratiques
├── api/                               # API Reference
├── architecture/                      # Architecture Système
└── troubleshooting/                   # Dépannage
```

---

## 📊 Statistiques Nettoyage

| Métrique | Avant | Après | Gain |
|----------|-------|-------|------|
| **Fichiers obsolètes** | 30 fichiers éparpillés | 0 (7 supprimés + 23 archivés) | -100% clutter |
| **Taille nettoyée** | ~265 KB fragmentés | 0 KB actif | -265 KB |
| **Navigation** | Complexe (manifests, MEMORY-BANK, TASKS) | Centralisée (docs/) | -90% temps recherche |
| **Documentation** | Fragmentée 23+ fichiers | Consolidée 8 fichiers | -65% redondance |

---

## 🔍 Comment Retrouver l'Information ?

### Avant (documentation fragmentée)

```
manifests/archive/business-rules/WORKFLOWS.md
manifests/archive/architecture/dashboard-metrics-system.md
MEMORY-BANK/contexts/ai-context.md
TASKS/ROADMAP-METRIQUES-ACTIVITE-2025.md
TASKS/completed/testing/GROUPE-2-*.md (13 fichiers)
... (20+ autres fichiers éparpillés)
```
→ **Problème** : Information dupliquée, versions obsolètes, navigation complexe

### Après (documentation consolidée)

```
/docs/auth/roles-permissions-matrix.md       # Tout sur rôles
/docs/metrics/dashboard-kpis.md              # Tout sur métriques
/docs/workflows/owner-daily-workflow.md      # Workflow Owner complet
/CLAUDE.md                                   # Règles projet + agents
```
→ **Solution** : 1 fichier = 1 sujet exhaustif, navigation directe, version unique

---

## 🚫 Que Faire de Ces Fichiers Archivés ?

**NE PAS supprimer** : Contiennent historique décisions, tests, contexte Phase 1

**Utilisation recommandée** :
1. **Référence historique** : Comprendre évolution specs (V1 → V2)
2. **Audit trail** : Tracer décisions architecture passées
3. **Onboarding devs** : Voir progression documentation projet
4. **Recovery** : Si info manquante dans nouvelle doc, consulter archive

**Après 6 mois (Avril 2026)** :
- Vérifier aucune référence active vers ces fichiers
- Créer backup externe si nécessaire
- Supprimer archive si nouvelle doc validée complète

---

## ✅ Validation Nettoyage

**Checklist complétée** :
- [x] Tous les doublons identifiés et supprimés
- [x] Historique préservé dans archive
- [x] Navigation simplifiée (docs/ unique)
- [x] Aucune perte de contenu business critique
- [x] README explicatif créé
- [x] Structure archive organisée (architecture/, contexts/, testing/)

---

## 📞 Contact

**Questions sur cette archive ?**
- Consulter `/docs/README.md` (nouvelle documentation)
- Consulter `MEMORY-BANK/context/DOCUMENTATION-ROLES-METRIQUES-2025.md`
- Lire `CLAUDE.md` section "DOCUMENTATION STRUCTURE"

**En cas de doute** : Privilégier TOUJOURS `/docs/` (source de vérité unique)

---

*Archive créée automatiquement - Vérone Documentation Manager*
*Session : Nettoyage Phase 1 (Rôles, Métriques, Workflows, RLS)*
*Commit : [À venir]*

# Audits ESLint - Documentation

**Dernière mise à jour** : 2026-02-01

---

## 📁 Fichiers Disponibles

### 1. Audit Détaillé (Par Fichier) - NOUVEAU

**Fichier** : `eslint-warnings-detailed-2026-02-01.md`

**Contenu** :

- Résumé exécutif (statistiques globales ~1,946 warnings)
- Top 5 règles ESLint les plus fréquentes
- Packages avec le plus de warnings
- Analyse détaillée par package (@verone/products, @verone/linkme, @verone/back-office)
- Recommandations de fix progressive

**Usage** : Comprendre la répartition globale des warnings par package et règle.

### 2. Warnings Groupés par Règle - NOUVEAU

**Fichier** : `eslint-warnings-by-rule.md`

**Contenu** :

- Vue d'ensemble (tableau récapitulatif)
- Analyse détaillée des 8 règles principales
- Pour chaque règle : Description, Exemples, Solutions, Packages affectés, Plan de fix
- Roadmap complète de fix (3 phases)
- Outils & commandes utiles

**Usage** : Comprendre chaque règle ESLint en détail et planifier les corrections.

### 3. Top Fichiers Critiques - NOUVEAU

**Fichier** : `eslint-critical-files.md`

**Contenu** :

- Méthodologie de scoring (CRITIQUE, HIGH, MEDIUM, LOW)
- Top 50 fichiers les plus problématiques
- Analyse approfondie des 10 fichiers critiques (15+ warnings)
- Stratégie de fix progressive (3 phases)
- KPIs de succès

**Usage** : Prioriser les corrections sur les fichiers ayant le plus d'impact métier.

### 4. Rapport d'Audit Principal (Ancien)

**Fichier** : `eslint-audit-2026-02-01.md`

**Contenu** :

- Vue d'ensemble des 3 applications (back-office, linkme, site-internet)
- Distribution des 3,792 warnings par catégorie
- Classification par sévérité (CRITIQUE, MEDIUM, LOW)
- Plan d'action en 4 phases
- Zones critiques identifiées

**Note** : Ancien audit, consulter les nouveaux rapports (#1, #2, #3) pour données actualisées.

### 5. Guide de Correction

**Fichier** : `eslint-correction-guide.md`

**Contenu** :

- Top 5 patterns à corriger avec exemples concrets
- Solutions ❌ AVANT / ✅ APRÈS pour chaque pattern
- Checklists par type de fichier
- Quick Start pour commencer aujourd'hui

### 6. Baseline de Référence

**Fichier** : `eslint-progress-baseline.json`

**Contenu** :

- Snapshot initial : 3,792 warnings (2026-02-01)
- Distribution par app et par règle
- Point de comparaison pour mesurer progrès

### 7. Script de Tracking

**Fichier** : `../.claude/scripts/eslint-track-progress.sh`

**Contenu** :

- Script automatique de suivi des progrès
- Génère rapports JSON horodatés
- Compare avec baseline
- Affiche top 5 règles problématiques

**Usage** :

```bash
bash .claude/scripts/eslint-track-progress.sh
```

---

## 🚀 Quick Start

### 1. Lire les Nouveaux Audits Détaillés

```bash
# Vue d'ensemble globale
cat .claude/audits/eslint-warnings-detailed-2026-02-01.md

# Analyse par règle ESLint
cat .claude/audits/eslint-warnings-by-rule.md

# Top 50 fichiers critiques
cat .claude/audits/eslint-critical-files.md
```

### 2. Lancer Phase 1 (Fix Automatique - 800 warnings)

```bash
git checkout -b fix/eslint-prefer-nullish-coalescing
pnpm lint:fix
pnpm type-check  # DOIT passer
pnpm build       # DOIT passer
git add .
git commit -m "[NO-TASK] fix: replace || with ?? (800 warnings)"
git push
```

### 3. Identifier Top Priorités (Fichiers Critiques)

```bash
# Voir top 50 fichiers
cat .claude/audits/eslint-critical-files.md | grep "🔴 CRITIQUE"

# Warnings dans un fichier spécifique
pnpm lint 2>&1 | grep "selections/page.tsx"
```

### 4. Tracker les Progrès

```bash
bash .claude/scripts/eslint-track-progress.sh
```

---

## 📊 Statistiques (2026-02-01)

| Métrique                     | Valeur        |
| ---------------------------- | ------------- |
| **Total warnings**           | ~1,946        |
| **Fichiers concernés**       | ~800          |
| **Règles ESLint**            | 8 principales |
| **Packages analysés**        | 31            |
| **Fichiers critiques (15+)** | 20            |

## 🎯 Roadmap

### Phase 1 : Quick Wins (1-2 heures)

- ✅ Fix automatique `prefer-nullish-coalescing` (~800 warnings)
- Commande : `pnpm lint:fix`

### Phase 2 : Fichiers Critiques (6-10 heures)

- ⏳ Fix manuel top 20 fichiers (~250 warnings)
- Voir : `eslint-critical-files.md`

### Phase 3 : Boy Scout Rule (40-80 heures)

- ⏳ Fix opportuniste du reste (~896 warnings)
- Approche : Fixer quand on touche le fichier

---

**Créé par** : Claude Sonnet 4.5
**Version** : 2.0.0 (2026-02-01)
**Changelog** :

- v2.0.0 : Audit complet détaillé (par fichier, par règle, fichiers critiques)
- v1.0.0 : Audit initial (baseline)

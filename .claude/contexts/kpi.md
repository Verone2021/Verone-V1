# 📊 KPI CONTEXT - Vérone Back Office

**Chargement** : Uniquement si travail KPI, métriques, documentation YAML

---

## 📊 FORMAT KPI (YAML)

Tous les KPI métier doivent être documentés en YAML dans `packages/kpi/`.

**Structure obligatoire** :

```yaml
# packages/kpi/stock-turnover-rate.yaml
id: kpi-stock-turnover-rate
name: Stock Turnover Rate
description: Mesure la vitesse de rotation du stock sur une période
module: Stock
category: Métriques
owner: Romeo Dos Santos
formula: |
  turnover_rate = cost_of_goods_sold / average_inventory_value
inputs:
  - name: cost_of_goods_sold
    type: number
    source: sales_order_items.unit_cost * quantity
    query: |
      SELECT SUM(unit_cost * quantity) as cogs
      FROM sales_order_items
      WHERE created_at BETWEEN :start_date AND :end_date
  - name: average_inventory_value
    type: number
    source: products.stock_real * price_list_items.cost_price
    query: |
      SELECT AVG(p.stock_real * pli.cost_price) as avg_inventory
      FROM products p
      LEFT JOIN price_list_items pli ON pli.product_id = p.id
      WHERE pli.price_list_id = :default_price_list_id
output:
  type: number
  unit: ratio
  format: "0.00"
source:
  table: sales_order_items + products + price_list_items
  hook: use-stock-metrics.ts
  query: (voir section inputs)
displayed_in:
  - src/app/dashboard/page.tsx:125
  - src/components/stock/stock-metrics-card.tsx:45
thresholds:
  excellent: "> 8"
  good: "4-8"
  warning: "2-4"
  critical: "< 2"
tests:
  - scenario: "Stock rapide (turnover = 10)"
    inputs:
      cost_of_goods_sold: 100000
      average_inventory_value: 10000
    expected_output: 10.0
  - scenario: "Stock lent (turnover = 1.5)"
    inputs:
      cost_of_goods_sold: 30000
      average_inventory_value: 20000
    expected_output: 1.5
references:
  - docs/metrics/calculations.md
  - src/hooks/use-stock-metrics.ts
metadata:
  created_at: 2025-10-21
  validated_by: Romeo Dos Santos
  version: 1.0.0
  status: active
```

---

## 📋 CHECKLIST SECTIONS YAML OBLIGATOIRES

- [ ] `id` : Unique, format `kpi-module-nom-kebab-case`
- [ ] `name` : Nom lisible français
- [ ] `description` : Minimum 2 phrases explicatives
- [ ] `module` : Organisations | Profil et rôles | Dashboard | Stock | etc.
- [ ] `category` : Compteurs | Métriques | Engagement | Activité | etc.
- [ ] `owner` : Romeo Dos Santos (par défaut)
- [ ] `formula` : Formule mathématique explicite
- [ ] `inputs` : Liste complète avec sources
- [ ] `output` : Type, unit, format
- [ ] `source.table` : Table database
- [ ] `source.hook` : Hook React
- [ ] `source.query` : Query SQL complète
- [ ] `displayed_in` : Au moins 1 composant avec ligne exacte
- [ ] `thresholds` : Seuils interprétation (si applicable)
- [ ] `tests` : Au moins 1 scénario de test
- [ ] `metadata.created_at` : Date création (YYYY-MM-DD)
- [ ] `metadata.validated_by` : Validateur
- [ ] `metadata.version` : 1.0.0 (SemVer)
- [ ] `metadata.status` : active | draft | deprecated

**Sections optionnelles mais recommandées** :
- `references` : Liens docs/code/database
- `business_notes` : Contexte métier Vérone spécifique
- `alerts` : Alertes automatiques futures

---

## 🔄 WORKFLOW AUDIT KPI AUTOMATISÉ

```typescript
// WORKFLOW OBLIGATOIRE pour tout nouveau KPI

1. **Identification** : Repérer un compteur/métrique dans l'UI
   - Exemple : "Total Organisations", "Score engagement", "CA du mois"
   - Vérifier si déjà documenté dans packages/kpi/

2. **Recherche source** :
   - Identifier le hook React (use*Metrics, use*Stats)
   - Trouver la table database source
   - Identifier la query SQL ou le calcul

3. **Documentation YAML** :
   - Copier template : packages/kpi/EXAMPLE.yaml
   - Remplir TOUTES les sections obligatoires
   - Ajouter au moins 1 scénario de test
   - Référencer composant affichant le KPI

4. **Mise à jour catalogue** :
   - Ajouter entrée dans packages/kpi/catalogue.md
   - Mettre à jour statistiques globales
   - Ajouter dans index alphabétique

5. **Validation** :
   - Vérifier format YAML valide
   - Tester formule avec scénarios
   - Vérifier références code existent
```

---

## 📊 ÉTAT ACTUEL KPI (Audit 2025-10-22)

**KPI documentés** : 11/48 (23% coverage)
**Dernier audit** : 2025-10-22
**Catalogue** : `packages/kpi/catalogue.md` version 2.0.0

### Module Organisations (8 KPI) ✅
- Total Organisations
- Total Fournisseurs
- Fournisseurs Actifs
- Fournisseurs Archivés
- Fournisseurs Favoris
- Total Clients Professionnels
- Total Prestataires
- Produits référencés (par fournisseur)

### Module Profil et rôles (3 KPI) ✅
- Sessions totales (utilisateur)
- Score d'engagement (utilisateur)
- Temps passé par module (utilisateur)

### KPI À DOCUMENTER (37 restants)

#### Dashboard (4 KPI - PRIORITÉ CRITIQUE)
- [ ] CA du mois
- [ ] Valeur stock
- [ ] Commandes ventes (count)
- [ ] Commandes achats (count)

#### Organisations - Onglets (3 KPI - PRIORITÉ HAUTE)
- [ ] Contacts par organisation
- [ ] Commandes par organisation
- [ ] Produits par organisation (compteur onglet)

#### Utilisateurs (5 KPI - PRIORITÉ HAUTE)
- [ ] Durée moyenne session
- [ ] Fréquence de connexion
- [ ] Ancienneté compte (jours)
- [ ] Statut activité (actif/dormant)
- [ ] Type de compte (staff/standard)

**Objectif Q4 2025** : Coverage 100% (48/48 KPI documentés)

---

## 🎯 HOOKS REACT KPI (Convention)

**Convention naming** : `use-[kpi-id]-kpi.ts`

```typescript
// Exemple : packages/kpi/hooks/use-total-organisations-kpi.ts
import { useOrganisations } from '@/hooks/use-organisations'

export function useTotalOrganisationsKPI(includeArchived = false) {
  const { organisations, loading, error } = useOrganisations({})

  const total = organisations.filter(o =>
    includeArchived || !o.archived_at
  ).length

  const threshold =
    total > 200 ? 'excellent' :
    total > 100 ? 'good' :
    total > 50 ? 'warning' : 'critical'

  return { total, threshold, loading, error }
}
```

**Avantages hooks KPI** :
- Logique calcul centralisée
- Réutilisable cross-composants
- Tests unitaires isolés
- Seuils interprétation inclus

---

## 🔧 CI/CD INTÉGRATION (Future - Phase 2)

**GitHub Actions workflow** à implémenter :

```yaml
# .github/workflows/kpi-validation.yml
name: KPI Validation & Auto-Update

on:
  pull_request:
    paths:
      - 'packages/kpi/**/*.yaml'
      - 'src/hooks/**/*-metrics.ts'
      - 'src/components/**/stats*.tsx'

  schedule:
    - cron: '0 0 * * 0' # Audit hebdomadaire dimanche 00:00

jobs:
  validate-yaml:
    runs-on: ubuntu-latest
    steps:
      - Vérifier syntaxe YAML
      - Valider sections obligatoires présentes
      - Vérifier références code existent
      - Exécuter tests scenarios YAML

  auto-update-catalogue:
    needs: validate-yaml
    runs-on: ubuntu-latest
    steps:
      - Compter KPI par module
      - Régénérer packages/kpi/catalogue.md automatiquement
      - Commit + Push si changements

  kpi-audit:
    runs-on: ubuntu-latest
    if: github.event_name == 'schedule'
    steps:
      - Scanner tous composants pour nouveaux KPI
      - Comparer avec KPI documentés
      - Générer rapport audit tools/reports/<date>/kpi-audit.md
      - Créer issue si coverage < 80%
```

---

## 📈 MÉTRIQUES SUCCÈS KPI

**Coverage** :
- Phase 1 (Oct 2025) : 23% (11/48) ✅
- Phase 2 (Nov 2025) : 75% (36/48) 🎯
- Phase 3 (Déc 2025) : 100% (48/48) 🎯

**Qualité** :
- Format YAML valide : 100%
- Sections obligatoires complètes : 100%
- Tests scenarios présents : 100%
- References code valides : 100%

**Automatisation** :
- CI/CD validation YAML : ⏳ À implémenter
- Auto-update catalogue : ⏳ À implémenter
- Hooks React KPI : ⏳ À créer
- Tests unitaires Vitest : ⏳ À implémenter

---

**Dernière mise à jour** : 2025-10-23
**Mainteneur** : Romeo Dos Santos

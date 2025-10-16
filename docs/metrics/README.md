# Métriques & Analytics - Documentation Vérone

**Dernière mise à jour** : 2025-10-16
**Version** : 1.0
**Mainteneur** : Vérone Documentation Team

---

## Vue d'Ensemble

Cette section documente l'ensemble des métriques et KPIs utilisés dans le système Vérone. Elle couvre les 16 hooks de données du dashboard, les 10 triggers de base de données qui maintiennent les métriques à jour, les 20+ formules de calcul business, et les composants Recharts de visualisation.

---

## Fichiers de cette Section

### Documents Principaux

- **[dashboard-kpis.md](./dashboard-kpis.md)**
  Documentation des 16 hooks dashboard (useTotalOrders, useRevenue, etc.) avec formules

- **[business-metrics.md](./business-metrics.md)**
  Métriques business (taux conversion, panier moyen, croissance MoM, etc.)

- **[technical-metrics.md](./technical-metrics.md)**
  Métriques techniques (performance queries, latence API, usage cache, etc.)

- **[database-triggers.md](./database-triggers.md)**
  Documentation des 10 triggers automatiques mise à jour métriques

- **[calculations.md](./calculations.md)**
  Référence complète des 20+ formules de calcul (SQL + TypeScript)

- **[components.md](./components.md)**
  Composants Recharts visualisation (BarChart, LineChart, KPI Cards, etc.)

---

## Liens Connexes

### Autres Sections Documentation

- [Database/Triggers](/Users/romeodossantos/verone-back-office-V1/docs/database/triggers-hooks.md) - Triggers métriques
- [Architecture/Design System](/Users/romeodossantos/verone-back-office-V1/docs/architecture/design-system.md) - Couleurs graphiques

### Manifests & Business Rules

- [Business Rules - Metrics](/Users/romeodossantos/verone-back-office-V1/manifests/business-rules/METRICS.md)
- [PRD - Dashboard](/Users/romeodossantos/verone-back-office-V1/manifests/prd/DASHBOARD.md)

---

## Navigation Rapide

### Par Type Métrique

#### KPIs Dashboard
- [Dashboard KPIs](./dashboard-kpis.md)
- [Composants Visualisation](./components.md)

#### Métriques Business
- [Business Metrics](./business-metrics.md)
- [Formules Calcul](./calculations.md)

#### Infrastructure Métriques
- [Database Triggers](./database-triggers.md)
- [Technical Metrics](./technical-metrics.md)

---

## Recherche Rapide

### Questions Fréquentes

**Q : Comment ajouter un nouveau KPI au dashboard ?**
A : Voir [dashboard-kpis.md](./dashboard-kpis.md#ajouter-nouveau-kpi) et [database-triggers.md](./database-triggers.md)

**Q : Quelle est la formule du taux de conversion ?**
A : Voir [calculations.md](./calculations.md#taux-conversion)

### Mots-Clés

- **Dashboard** → [dashboard-kpis.md](./dashboard-kpis.md)
- **Triggers** → [database-triggers.md](./database-triggers.md)
- **Recharts** → [components.md](./components.md)
- **Formules** → [calculations.md](./calculations.md)

---

**Retour** : [Index Principal Documentation](/Users/romeodossantos/verone-back-office-V1/docs/README.md)

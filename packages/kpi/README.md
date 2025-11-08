# 📊 @verone/kpi - KPI Documentation

**KPI métier centralisés** en format YAML structuré avec tests et validation.

⚠️ **Statut** : Préparation (migration effective après Phase 1)

---

## 🎯 Objectif

Documenter tous les KPI métier de manière structurée, testable, et versionnée.

---

## 📦 Structure

```
packages/kpi/
├── stock/
│   ├── stock-turnover-rate.yaml
│   ├── stock-coverage-days.yaml
│   └── inventory-value.yaml
├── sales/
│   ├── revenue-growth.yaml
│   ├── average-order-value.yaml
│   └── conversion-rate.yaml
├── finance/
│   ├── gross-margin.yaml
│   ├── net-profit-margin.yaml
│   └── cash-flow.yaml
├── hooks/                 # React hooks pour chaque KPI
│   ├── use-stock-turnover.ts
│   ├── use-revenue-growth.ts
│   └── ...
├── tests/                 # Tests unitaires KPI
│   ├── stock-kpis.test.ts
│   └── ...
└── README.md              # Ce fichier
```

---

## 📝 Format YAML

Voir [EXAMPLE.yaml](./EXAMPLE.yaml) pour le format complet.

**Sections obligatoires** :

- `name` : Nom KPI
- `description` : Description métier
- `category` : Catégorie (stock, sales, finance, etc.)
- `formula` : Formule mathématique
- `inputs` : Données sources avec queries SQL
- `output` : Type, unité, format
- `thresholds` : Seuils (excellent, good, warning, critical)
- `tests` : Scénarios de test
- `references` : Liens vers hooks/docs
- `last_updated` : Date dernière MAJ
- `validated_by` : Validateur

---

## ✅ Validation

Chaque KPI YAML doit avoir :

1. **Tests unitaires** : Basés sur la section `tests:` du YAML
2. **Hook React** : Hook `use-[kpi-name].ts` associé
3. **Documentation** : Référence dans docs/metrics/

---

## 🚀 Usage futur (après migration)

```typescript
import { useStockTurnover } from '@verone/kpi/hooks'

export function StockMetrics() {
  const { turnoverRate, loading, error } = useStockTurnover({
    startDate: '2025-01-01',
    endDate: '2025-12-31'
  })

  return <KPICard value={turnoverRate} threshold="good" />
}
```

---

## 📊 KPI à documenter (Phase 1)

**Stock** :

- [ ] Taux de rotation stock
- [ ] Couverture stock (jours)
- [ ] Valeur stock
- [ ] Stock négatif prévu

**Ventes** :

- [ ] CA mensuel
- [ ] Panier moyen
- [ ] Taux de conversion
- [ ] Top produits

**Finance** :

- [ ] Marge brute
- [ ] Marge nette
- [ ] Cash flow
- [ ] ROI

---

_À migrer : Après Phase 1_
_Référence actuelle : src/hooks/use-_-metrics.ts\*
